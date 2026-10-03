import { localDateKey, safeAstronomicalDate } from "./date-time.mjs";

export function formatTime(value, location, baseDate = null, alwaysDate = false) {
  const instant = safeAstronomicalDate(value);
  if (!instant) return "Not available";
  const rounded = new Date(Math.round(+instant / 60000) * 60000);
  const time = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: location.timezone }).format(rounded);
  if (!alwaysDate && (!baseDate || localDateKey(rounded, location.timezone) === baseDate)) return time;
  const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: location.timezone }).format(rounded);
  return `${date}, ${time}`;
}

export function formatMoonEvent(value, label, location, baseDate) {
  return safeAstronomicalDate(value) ? formatTime(value, location, baseDate)
    : `No ${label} on this local civil date`;
}

export function tithiRows(day, location) {
  return day.tithis.map((item) => ({
    title: `${item.paksha} ${item.name}`,
    status: [item.presentAtSunrise ? "At sunrise" : "", item.skippedAtSunrise ? "Kshaya · not present at sunrise" : "", item.repeatedAtSunrise ? "Vriddhi · repeated at sunrise" : ""].filter(Boolean).join(" · "),
    start: formatTime(item.start, location, day.date, true),
    end: formatTime(item.end, location, day.date, true),
  }));
}

export function muhurtaRows(day, location) {
  return Object.values(day.shubhMuhurtas).map((item) => [item.name, `${formatTime(item.start, location, day.date)} – ${formatTime(item.end, location, day.date)}`]);
}

export function renderTimingSections(root, day, location) {
  const timeline = root.querySelector("[data-panchang-tithis]");
  if (timeline) timeline.replaceChildren(...tithiRows(day, location).map((row) => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = row.title;
    const status = document.createElement("small");
    status.textContent = row.status;
    const start = document.createElement("span");
    start.textContent = `Starts: ${row.start}`;
    const end = document.createElement("span");
    end.textContent = `Ends: ${row.end}`;
    item.append(title, status, start, end);
    return item;
  }));
  const muhurtas = root.querySelector("[data-panchang-muhurtas]");
  if (muhurtas) muhurtas.replaceChildren(...muhurtaRows(day, location).map(([label, value]) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    item.append(term, description);
    return item;
  }));
}
