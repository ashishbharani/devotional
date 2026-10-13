"""Derived universal search assets; never changes catalogue records or identities."""
from __future__ import annotations

from collections import defaultdict
from hashlib import sha256
from functools import lru_cache
import json
from pathlib import Path
import re
import unicodedata


@lru_cache(maxsize=100000)
def normalize(value):
    # Strip Latin romanisation accents only. Indic vowel signs and viramas matter.
    value = unicodedata.normalize("NFKC", str(value)).lower()
    output, latin = [], False
    for char in value:
        if latin and "\u0300" <= char <= "\u036f":
            continue
        latin = "LATIN" in unicodedata.name(char, "")
        output.append("".join(c for c in unicodedata.normalize("NFD", char)
                              if not unicodedata.combining(c)) if latin else char)
    return "".join(output)


@lru_cache(maxsize=100000)
def tokens(value):
    out, word = [], []
    for char in normalize(value):
        if unicodedata.category(char)[0] in "LNM":
            word.append(char)
        elif word:
            out.append("".join(word))
            word = []
    if word:
        out.append("".join(word))
    return out


def identity(kind, *values):
    text = "\0".join(map(str, values))
    return kind + ":" + sha256(text.encode()).hexdigest()[:20]


RELATIONS = {
    "EXACT_ALIAS_OF", "FORM_OF", "MANIFESTATION_OF", "AVATAR_OF", "EPITHET_OF",
    "ASSOCIATED_WITH", "REGIONAL_FORM_OF", "WORSHIPPED_AS", "BELONGS_TO_TRADITION",
    "PARENT_SECTION", "CHILD_SECTION", "WORK_ASSOCIATED_WITH", "WORK_BELONGS_TO_SECTION",
}


def build_search(catalogue, compact, registry_path):
    registry = json.loads(Path(registry_path).read_text(encoding="utf-8"))
    entities = registry["entities"]
    ids = {entity["id"] for entity in entities}
    if len(ids) != len(entities):
        raise ValueError("duplicate search identity ID")
    aliases, edges, nodes, postings = [], [], [], defaultdict(set)
    node_postings, entity_works = defaultdict(set), defaultdict(set)
    work_ids = {work[6]: i for i, work in enumerate(compact["works"])}
    if len(work_ids) != len(compact["works"]):
        raise ValueError("duplicate canonical work IDs in search source")
    for alias in registry.get("work_aliases", []):
        if alias.get("status") != "verified":
            continue
        if alias.get("work") not in work_ids or not alias.get("source"):
            raise ValueError("invalid or unsourced work alias")
        aliases.append({**alias, "canonical": compact["works"][work_ids[alias["work"]]][0]})
    by_group = defaultdict(list)
    for entity in entities:
        for group in entity.get("groups", []):
            by_group[normalize(group)].append(entity["id"])
        for alias in entity.get("aliases", []):
            if not alias.get("source") or alias.get("status") != "verified":
                continue
            aliases.append({**alias, "entity": entity["id"], "canonical": entity["name"]})
        aliases.append({"text": entity["name"], "entity": entity["id"],
                        "canonical": entity["name"], "type": "EXACT_ALIAS",
                        "language": "en", "script": "Latn", "status": "canonical",
                        "source": entity["source"], "confidence": 1, "scope": entity.get("context", "")})
    for edge in registry.get("relationships", []):
        if edge.get("status") != "verified":
            continue
        if edge["from"] not in ids or edge["to"] not in ids or edge["type"] not in RELATIONS or not edge.get("source"):
            raise ValueError("invalid or unsourced identity relationship")
        edges.append(edge)

    def node(kind, name, url, parent, category, works):
        value = {"id": identity(kind, category, url), "name": name, "kind": kind,
                 "url": url, "parent": parent, "category": category, "works": works}
        index = len(nodes)
        nodes.append(value)
        for token in set(tokens(name)):
            node_postings[token].add(index)
        if parent:
            edges.extend([{"from": value["id"], "to": parent, "type": "PARENT_SECTION", "source": "collection"},
                          {"from": parent, "to": value["id"], "type": "CHILD_SECTION", "source": "collection"}])
        return value

    for cat in catalogue["categories"]:
        category = node("category", cat["title"], cat["url"], None, cat["num"], [])
        aliases.append({"text": cat["title"], "node": category["id"], "canonical": cat["title"],
                        "type": "EXACT_ALIAS", "language": "en", "script": "Latn", "status": "catalogue",
                        "source": "collection#" + category["id"], "confidence": 1, "scope": "collection category only"})
        translation_path = Path(registry_path).parent.parent / "docs" / "assets" / "i18n.json"
        translations = json.loads(translation_path.read_text(encoding="utf-8")).get("categoryNames", {})
        for language, names in translations.items():
            if cat["num"] <= len(names) and names[cat["num"] - 1]:
                aliases.append({"text": names[cat["num"] - 1], "node": category["id"],
                                "canonical": cat["title"], "type": "ALTERNATIVE_NAME",
                                "language": language, "status": "catalogue", "confidence": 1,
                                "source": "docs/assets/i18n.json#categoryNames", "scope": "collection category only"})
        for group in cat["merged"]:
            section = node("section", group["name"], group["parts"][0]["url"], category["id"], cat["num"], [])
            for part in group["parts"]:
                for form in part["forms"]:
                    rows = [work_ids[w["cwid"]] for w in form["works"]]
                    url = part["url"] + "#" + form["anchor"]
                    subsection = node("subsection", group["name"] + " › " + form["name"], url, section["id"], cat["num"], rows)
                    section["works"].extend(rows)
                    category["works"].extend(rows)
                    for row in rows:
                        work = compact["works"][row]
                        edges.append({"from": work[6], "to": subsection["id"], "type": "WORK_BELONGS_TO_SECTION", "source": "collection"})
                        for entity in by_group.get(normalize(group["name"]), []):
                            entity_works[entity].add(row)
                        for token in set(tokens(work[0]) + tokens(group["name"]) + tokens(cat["title"]) + tokens(form["name"])
                                         + tokens(compact["forms"][work[3]]) + tokens(compact["langs"][work[2]])):
                            postings[token].add(row)
                    # Slash-separated labels remain scoped to this collection
                    # node: they do not create religious identity equivalences.
                    for name in [group["name"], *group["name"].split(" / ")]:
                        if len(name.strip()) > 1:
                            aliases.append({"text": name.strip(), "node": section["id"], "canonical": group["name"],
                                            "type": "ALTERNATIVE_NAME", "language": "und", "script": "Latn",
                                            "status": "catalogue", "source": "collection#" + section["id"],
                                            "confidence": 1, "scope": "collection section only"})

    # Explicitly curated form-to-title phrases connect specific forms without
    # falsely assigning every Krishna work to Banke Bihari, for example.
    normalized_titles = [" " + " ".join(tokens(w[0])) + " " for w in compact["works"]]
    for entity in entities:
        phrases = [" ".join(tokens(text)) for text in entity.get("title_phrases", [])]
        for i, work in enumerate(compact["works"]):
            title = normalized_titles[i]
            if any(" " + phrase + " " in title for phrase in phrases):
                entity_works[entity["id"]].add(i)
        for row in entity_works[entity["id"]]:
            edges.append({"from": compact["works"][row][6], "to": entity["id"], "type": "WORK_ASSOCIATED_WITH",
                          "source": "collection#" + compact["works"][row][6], "identitySource": entity["source"]})

    aliases = list({json.dumps(a, sort_keys=True): a for a in aliases}.values())
    for alias in aliases:
        target = alias.get("entity") or alias.get("node") or alias.get("work")
        alias["id"] = identity("alias", target, alias["text"], alias.get("language", "und"))
        edges.append({"from": alias["id"], "to": target,
                      "type": "EPITHET_OF" if alias["type"] in {"EPITHET", "DEVOTIONAL_TITLE"} else "EXACT_ALIAS_OF",
                      "source": alias["source"], "scope": alias.get("scope", "")})
    # All raw metadata remains visible. Malformed/mixed labels are not rewritten.
    return {
        "version": 1, "compactDigest": sha256(json.dumps(compact, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest(),
        "entities": entities, "aliases": aliases,
        "relationships": [edge for edge in registry.get("relationships", []) if edge.get("status") == "verified"],
        "edges": edges, "nodes": nodes,
        "postings": {key: sorted(values) for key, values in sorted(postings.items())},
        "nodePostings": {key: sorted(values) for key, values in sorted(node_postings.items())},
        "entityWorks": {key: sorted(values) for key, values in entity_works.items()},
        "forms": registry.get("forms", []), "languages": registry.get("languages", []),
        "coverage": {"works": len(compact["works"]), "categories": len(catalogue["categories"]),
                     "sections": sum(n["kind"] == "section" for n in nodes),
                     "subsections": sum(n["kind"] == "subsection" for n in nodes),
                     "identitiesResearched": len(entities), "verifiedAliases": len([a for a in aliases if a["status"] == "verified"]),
                     "researchLimit": registry["research_limit"]},
    }
