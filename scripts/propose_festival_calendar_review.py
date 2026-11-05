"""Fetch published reference facts for review; never approve or edit site data.

Run manually, for example:
  uv run python scripts/propose_festival_calendar_review.py --years 2031
Only explicit published years/cities are accepted. No Panchang calculation or
Gregorian date shifting is performed. Output stays under ignored work/.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen
from urllib.parse import urlsplit


SPECS = {
    "onam": ("festivals/onam/onam-calendar.html", "1254163", "Thiruvananthapuram"),
    "holi": ("calendars/hindu/hinducalendar.html", "1261481", "New Delhi"),
    "shivaratri": ("festivals/maha-shivaratri/maha-shivaratri-date-time.html", "1261481", "New Delhi"),
    "janmashtami": ("dashavatara/lord-krishna/krishna-janmashtami-date-time.html", "1261481", "New Delhi"),
}


class Node:
    def __init__(self, tag="", attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def text(self):
        if self.tag in {"script", "style", "noscript"}:
            return ""
        return " ".join(" ".join(c.text() if isinstance(c, Node) else c for c in self.children).split())

    def find(self, predicate):
        return [n for c in self.children if isinstance(c, Node)
                for n in ([c] if predicate(c) else []) + c.find(predicate)]

    def cls(self, name):
        return name in self.attrs.get("class", "").split()


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root, self.stack = Node(), []
        self.stack.append(self.root)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in {"img", "meta", "link", "br", "input", "hr", "source", "wbr", "area", "base", "embed", "param", "track", "col"}:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, value):
        self.stack[-1].children.append(value)


def civil(value, fmt, year):
    result = datetime.strptime(value, fmt).date()
    if result.year != year:
        raise ValueError("Date is outside the requested publication year")
    if "%A" in fmt and value.rsplit(",", 1)[-1].strip() != result.strftime("%A"):
        raise ValueError("Published weekday conflicts with the civil date")
    return result.isoformat()


def extract(raw: bytes, family: str, year: int, city: str):
    tree = Tree()
    tree.feed(raw.decode("utf-8"))
    titles = tree.root.find(lambda n: n.tag == "title")
    if len(titles) != 1:
        raise ValueError("Publication must identify one title")
    title = titles[0].text()
    if not re.search(rf"\b{year}\b", title) or city not in title or "India" not in title:
        raise ValueError("Publication year/city/country does not match the request")
    rows = []
    if family == "onam":
        for card in tree.root.find(lambda n: n.cls("dpEventCard")):
            day = card.find(lambda n: n.cls("dpEventDay"))
            month = card.find(lambda n: n.cls("dpSmallDate"))
            heading = card.find(lambda n: n.cls("dpEventCardTitle"))
            if not heading or not heading[0].text().startswith("Onam Day "):
                continue
            if len(day) != 1 or len(month) != 1:
                raise ValueError("Onam card date structure changed")
            number = re.match(r"\d+", day[0].text())
            if not number:
                raise ValueError("Invalid published day")
            labels = card.find(lambda n: n.cls("dpCardInfoText"))
            rows.append({"date": civil(number[0] + " " + month[0].text(), "%d %B %Y", year),
                         "label": heading[0].text(), "publishedDayName": labels[0].text() if labels else ""})
    elif family == "holi":
        for event in tree.root.find(lambda n: n.cls("dpEvent")):
            names = event.find(lambda n: n.cls("dpEventName"))
            dates = event.find(lambda n: n.cls("dpEventGregDate"))
            if names and names[0].text() in {"Holika Dahan", "Holi"}:
                if len(dates) != 1:
                    raise ValueError("Holi date structure changed")
                rows.append({"date": civil(dates[0].text(), "%B %d, %Y, %A", year), "label": names[0].text()})
        if sorted(r["label"] for r in rows) != ["Holi", "Holika Dahan"]:
            raise ValueError("Expected exactly the two selected Holi reference days")
    else:
        text = tree.root.text()
        name = "Maha Shivaratri" if family == "shivaratri" else "Krishna Janmashtami"
        # Extract explicit labelled date claims only. Multiple traditions remain
        # separate claims; no combined religious period is inferred here.
        pattern = rf"({name}|ISKCON (?:Krishna )?Janmashtami) on \w+, (\w+ \d+, {year})"
        seen = set()
        for label, value in re.findall(pattern, text):
            row = (label, civil(value, "%B %d, %Y", year))
            if row not in seen:
                seen.add(row)
                rows.append({"date": row[1], "label": label})
    if not rows:
        raise ValueError("No supported explicit date facts; manual source review required")
    if len({(r["date"], r["label"]) for r in rows}) != len(rows):
        raise ValueError("Duplicate selected date facts")
    return title, rows


def fetch(item):
    family, year = item
    path, geo, city = SPECS[family]
    url = f"https://www.drikpanchang.com/{path}?year={year}&geoname-id={geo}&lang=en"
    result = {"family": family, "year": year, "city": city, "url": url,
              "retrievedOn": datetime.now(timezone.utc).date().isoformat(),
              "status": "unreviewed-proposal", "approval": False,
              "requiredReview": ["Actual source facts and regional/tradition scope", "Complete family endpoints, including overnight/Parana where relevant", "Conflicting sources and matching approved art direction"],
              "automaticActivation": False}
    try:
        request = Request(url, headers={"User-Agent": "HDC calendar source review/1.0"})
        with urlopen(request, timeout=40) as response:
            final = urlsplit(response.geturl())
            if final.scheme != "https" or final.hostname != "www.drikpanchang.com":
                raise ValueError("Publisher redirected to a different authority")
            raw = response.read(2_000_001)
        if len(raw) > 2_000_000:
            raise ValueError("Publication exceeds the review fetch budget")
        title, rows = extract(raw, family, year, city)
        result.update(publicationTitle=title, sha256=sha256(raw).hexdigest(), dateClaims=rows)
    except Exception as error:
        result.update(status="source-gap", error=str(error), dateClaims=[])
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--years", type=int, nargs="+", required=True)
    parser.add_argument("--families", choices=list(SPECS), nargs="+", default=list(SPECS))
    args = parser.parse_args()
    if any(not 2026 <= year <= 2100 for year in args.years):
        parser.error("Only explicit review years 2026–2100 are supported")
    with ThreadPoolExecutor(max_workers=3) as pool:
        records = list(pool.map(fetch, [(family, year) for family in dict.fromkeys(args.families) for year in sorted(set(args.years))]))
    destination = Path("work/festival-coverage/calendar-proposals.json")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps({"schema": 1, "automaticPublication": False, "records": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for record in records:
        print(record["family"], record["year"], record["status"], json.dumps(record.get("dateClaims", []), ensure_ascii=False))
    print(f"Review proposals only: {destination}. Site data and approval flags were not changed.")


if __name__ == "__main__":
    main()
