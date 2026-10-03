import { DEFAULT_LOCATION, INDIAN_CITIES, findCity, loadSettings, saveSettings } from "./settings.mjs";
import { GENERAL_LINKS, devotionalContext } from "./festival-links.mjs";

let enginePromise;
const loadEngine = () => (enginePromise ||= import("./panchang-engine.mjs"));

const pad = (value) => String(value).padStart(2, "0");
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDateKey = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return null;
  const result = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return Number.isNaN(result.getTime()) ? null : result;
};

function partsDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function timeZoneOffset(date, timeZone, fallback = 330) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(date);
    const value = (type) => Number(parts.find((part) => part.type === type)?.value);
    const asUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
    return Math.round((asUtc - date.getTime()) / 60000);
  } catch (_) {
    return fallback;
  }
}

function calculationInstant(value, location) {
  const [year, month, day] = value.split("-").map(Number);
  const middayUtc = new Date(Date.UTC(year, month - 1, day, 12));
  const offset = timeZoneOffset(middayUtc, location.timezone, location.timezoneOffset);
  return { date: new Date(middayUtc.getTime() - offset * 60000), offset };
}

function longDate(value, location) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(date);
}

function shortTime(value, location) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: location.timezone }).format(new Date(value));
}

function timeRange(value, location) {
  if (!value?.start || !value?.end) return "Not available";
  return `${shortTime(value.start, location)} – ${shortTime(value.end, location)}`;
}

function nameAt(list, index, oneBased = false) {
  return list?.[oneBased ? index - 1 : index] || String(index ?? "Not available");
}

async function calculate(value, settings) {
  const engine = await loadEngine();
  const { date, offset } = calculationInstant(value, settings.location);
  const raw = engine.calculatePanchangam(
    date,
    settings.location.latitude,
    settings.location.longitude,
    settings.location.altitude || 0,
    { timezoneOffset: offset, calendarType: settings.convention },
  );
  return {
    raw,
    date: value,
    // panchangam-js 3.0.0 returns Tithi as 0–29 even though its declaration
    // describes 1–30. Keep the adapter correction in this one place.
    tithi: nameAt(engine.tithiNames, raw.tithi),
    nakshatra: nameAt(engine.nakshatraNames, raw.nakshatra),
    yoga: nameAt(engine.yogaNames, raw.yoga),
    vara: nameAt(engine.varaNames, raw.vara),
    monthNames: engine.masaNames,
    tithiNames: engine.tithiNames,
  };
}

function setText(root, field, value) {
  root.querySelectorAll(`[data-panchang-field="${field}"]`).forEach((element) => { element.textContent = value; });
}

function festivalNames(raw) {
  // Multi-day span labels are intentionally excluded: independent validation
  // found that the package's Shraddha day labels can differ from sunrise rules.
  return (raw.festivals || []).filter((festival) => festival.type !== "span").map((festival) => festival.name).filter(Boolean);
}

function observances(result) {
  const names = festivalNames(result.raw);
  if (result.raw.tithi === 10 || result.raw.tithi === 25) names.push("Ekadashi Tithi");
  if (result.raw.tithi === 14) names.push("Purnima Tithi");
  if (result.raw.tithi === 29) names.push("Amavasya Tithi");
  return [...new Set(names)];
}

function setStatus(root, message, state = "ready") {
  const status = root.querySelector("[data-panchang-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function populateLocationControl(root, settings, refresh) {
  const input = root.querySelector("[data-panchang-location]");
  const list = root.querySelector("[data-panchang-cities]");
  const convention = root.querySelector("[data-panchang-convention]");
  if (list && !list.children.length) {
    for (const city of INDIAN_CITIES) {
      const option = document.createElement("option");
      option.value = city.name;
      list.append(option);
    }
  }
  if (input) {
    input.value = settings.location.name;
    const commitCity = (reportInvalid = false) => {
      const city = findCity(input.value);
      if (!city) {
        if (reportInvalid) {
          input.setCustomValidity("Choose a city from the list.");
          input.reportValidity();
        }
        return;
      }
      input.setCustomValidity("");
      if (settings.location.id === city.id) return;
      settings.location = { ...city };
      saveSettings(settings);
      refresh();
    };
    input.addEventListener("input", () => commitCity(false));
    input.addEventListener("change", () => commitCity(true));
  }
  if (convention) {
    convention.value = settings.convention;
    convention.addEventListener("change", () => {
      settings.convention = convention.value === "purnimanta" ? "purnimanta" : "amanta";
      saveSettings(settings);
      refresh();
    });
  }
  root.querySelector("[data-panchang-geolocate]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    if (!navigator.geolocation) {
      setStatus(root, "Location access is unavailable. Delhi remains selected.", "error");
      return;
    }
    button.disabled = true;
    setStatus(root, "Waiting for location permission…", "loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_LOCATION.timezone;
        settings.location = {
          id: "device",
          name: "My location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || 0,
          timezone,
          timezoneOffset: -new Date().getTimezoneOffset(),
        };
        if (input) input.value = settings.location.name;
        saveSettings(settings);
        button.disabled = false;
        refresh();
      },
      () => {
        button.disabled = false;
        setStatus(root, `Location permission was not granted. Continuing with ${settings.location.name}.`, "error");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000 },
    );
  });
}

function renderDevotionalLinks(root, result, siteRoot) {
  const region = root.querySelector("[data-panchang-devotional]");
  if (!region) return;
  const supportedFestivals = (result.raw.festivals || []).filter((festival) => festival.type !== "span");
  const context = devotionalContext(supportedFestivals, result.tithi);
  const links = context.links.length ? context.links : GENERAL_LINKS;
  const list = region.querySelector("ul");
  if (list) {
    list.replaceChildren(...links.map((item) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = new URL(item.path, siteRoot).href;
      link.textContent = item.label;
      li.append(link);
      return li;
    }));
  }
  const significance = region.querySelector("[data-panchang-significance]");
  if (significance) {
    significance.hidden = !context.significance;
    significance.textContent = context.significance ? `Traditionally associated with ${context.significance}.` : "";
  }
  region.hidden = false;
}

function renderCommon(root, result) {
  const { raw } = result;
  const events = observances(result);
  setText(root, "date", longDate(result.date, root._panchangSettings.location));
  setText(root, "location", root._panchangSettings.location.name);
  setText(root, "tithi", result.tithi);
  setText(root, "tithi-end", shortTime(raw.tithiEndTime, root._panchangSettings.location));
  setText(root, "paksha", raw.paksha || "Not available");
  setText(root, "masa", `${raw.masa?.isAdhika ? "Adhika " : ""}${raw.masa?.name || "Not available"}`);
  setText(root, "nakshatra", result.nakshatra);
  setText(root, "nakshatra-end", shortTime(raw.nakshatraEndTime, root._panchangSettings.location));
  setText(root, "festival", events.join("; ") || "No major observance identified in the current ruleset.");
  setText(root, "sunrise-sunset", `${shortTime(raw.sunrise, root._panchangSettings.location)} / ${shortTime(raw.sunset, root._panchangSettings.location)}`);
  setText(root, "convention", root._panchangSettings.convention === "purnimanta" ? "Purnimanta" : "Amanta");
  setStatus(root, "Panchang calculated for the selected date and location.");
}

async function renderSummary(root, state) {
  setStatus(root, "Calculating today’s Panchang…", "loading");
  const today = partsDate(new Date(), state.location.timezone);
  const result = await calculate(today, state);
  renderCommon(root, result);
  renderDevotionalLinks(root, result, root._siteRoot);
}

function detailRows(result, location, convention) {
  const raw = result.raw;
  const rows = [
    ["Gregorian date", longDate(result.date, location)],
    ["Vara / Weekday", result.vara],
    ["Tithi", result.tithi],
    ["Tithi transition", shortTime(raw.tithiEndTime, location)],
    ["Paksha", raw.paksha],
    ["Masa", `${raw.masa?.isAdhika ? "Adhika " : ""}${raw.masa?.name}`],
    ["Calendar convention", convention === "purnimanta" ? "Purnimanta" : "Amanta"],
    ["Nakshatra", result.nakshatra],
    ["Nakshatra transition", shortTime(raw.nakshatraEndTime, location)],
    ["Yoga", result.yoga],
    ["Karana", raw.karana],
    ["Sunrise", shortTime(raw.sunrise, location)],
    ["Sunset", shortTime(raw.sunset, location)],
    ["Moonrise / Chandrodaya", shortTime(raw.moonrise, location)],
    ["Moonset / Chandrasta", shortTime(raw.moonset, location)],
    ["Vikram Samvat", raw.samvat?.vikram],
    ["Shaka Samvat", raw.samvat?.shaka],
    ["Rahu Kalam", raw.rahuKalamStart && raw.rahuKalamEnd ? `${shortTime(raw.rahuKalamStart, location)} – ${shortTime(raw.rahuKalamEnd, location)}` : "Not available"],
    ["Yamaganda", timeRange(raw.yamagandaKalam, location)],
    ["Gulika", timeRange(raw.gulikaKalam, location)],
    ["Abhijit Muhurta", timeRange(raw.abhijitMuhurta, location)],
  ];
  return rows.filter(([, value]) => value !== undefined && value !== null && value !== "undefined");
}

function renderRows(container, rows) {
  container.replaceChildren(...rows.map(([label, value]) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = String(value);
    item.append(term, description);
    return item;
  }));
}

async function renderFull(root, state) {
  const input = root.querySelector("[data-panchang-date]");
  const selected = parseDateKey(input?.value) ? input.value : partsDate(new Date(), state.location.timezone);
  if (input) input.value = selected;
  setStatus(root, "Calculating Panchang…", "loading");
  const result = await calculate(selected, state);
  renderCommon(root, result);
  renderRows(root.querySelector("[data-panchang-details]"), detailRows(result, state.location, state.convention));
  const festivals = root.querySelector("[data-panchang-festivals]");
  festivals.replaceChildren(...((result.raw.festivals || []).filter((festival) => festival.type !== "span").map((festival) => {
    const item = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = festival.name;
    item.append(strong);
    if (festival.description) item.append(` — ${festival.description}`);
    return item;
  })));
  if (!festivals.children.length) {
    const item = document.createElement("li");
    item.textContent = "No major observance identified in the current ruleset.";
    festivals.append(item);
  }
  renderDevotionalLinks(root, result, root._siteRoot);
  const url = new URL(location.href);
  url.searchParams.set("date", selected);
  history.replaceState(history.state, "", url);
}

async function renderCalendar(root, state) {
  const monthInput = root.querySelector("[data-calendar-month]");
  const yearInput = root.querySelector("[data-calendar-year]");
  const now = parseDateKey(partsDate(new Date(), state.location.timezone));
  let month = Math.min(12, Math.max(1, Number(monthInput.value) || now.getMonth() + 1));
  let year = Math.min(2200, Math.max(1800, Number(yearInput.value) || now.getFullYear()));
  monthInput.value = month;
  yearInput.value = year;
  setStatus(root, "Calculating the monthly Hindu calendar…", "loading");
  const grid = root.querySelector("[data-calendar-grid]");
  grid.replaceChildren();
  const first = new Date(year, month - 1, 1, 12);
  const days = new Date(year, month, 0).getDate();
  for (let blank = 0; blank < first.getDay(); blank += 1) {
    const spacer = document.createElement("span");
    spacer.className = "abp-panchang-calendar__blank";
    spacer.setAttribute("aria-hidden", "true");
    grid.append(spacer);
  }
  for (let day = 1; day <= days; day += 1) {
    const value = `${year}-${pad(month)}-${pad(day)}`;
    try {
      const result = await calculate(value, state);
      const link = document.createElement("a");
      link.className = "abp-panchang-calendar__day";
      if (value === dateKey(now)) link.classList.add("is-today");
      link.href = new URL(`panchang/?date=${value}`, root._siteRoot).href;
      const number = document.createElement("b");
      number.textContent = day;
      const tithi = document.createElement("span");
      tithi.textContent = result.tithi;
      link.append(number, tithi);
      const markers = observances(result);
      if (markers.length) {
        const marker = document.createElement("small");
        marker.textContent = markers.slice(0, 2).join(" · ");
        link.append(marker);
      }
      link.setAttribute("aria-label", `${longDate(value, state.location)}: ${result.tithi}${markers.length ? `; ${markers.join(", ")}` : ""}`);
      grid.append(link);
    } catch (_) {
      const unavailable = document.createElement("span");
      unavailable.className = "abp-panchang-calendar__day is-unavailable";
      unavailable.textContent = String(day);
      grid.append(unavailable);
    }
    if (day % 7 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  setStatus(root, `${new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(first)} calculated for ${state.location.name}.`);
}

function converterOutput(root, rows) {
  const output = root.querySelector("[data-converter-output]");
  output.hidden = false;
  renderRows(output.querySelector("dl"), rows);
}

async function convertGregorian(root, state) {
  const input = root.querySelector("[data-convert-gregorian]");
  if (!parseDateKey(input.value)) {
    input.setCustomValidity("Choose a valid Gregorian date.");
    input.reportValidity();
    return;
  }
  input.setCustomValidity("");
  setStatus(root, "Converting Gregorian date…", "loading");
  const result = await calculate(input.value, state);
  converterOutput(root, detailRows(result, state.location, state.convention).filter(([label]) => ["Gregorian date", "Vara / Weekday", "Tithi", "Tithi transition", "Paksha", "Masa", "Calendar convention", "Nakshatra", "Nakshatra transition", "Vikram Samvat", "Shaka Samvat"].includes(label)));
  setStatus(root, "Date conversion complete.");
}

async function convertHindu(root, state) {
  const year = Number(root.querySelector("[data-hindu-year]").value);
  const month = Number(root.querySelector("[data-hindu-month]").value);
  const paksha = root.querySelector("[data-hindu-paksha]").value;
  const day = Number(root.querySelector("[data-hindu-tithi]").value);
  const adhika = root.querySelector("[data-hindu-adhika]").checked;
  if (!Number.isInteger(year) || year < 1500 || year > 3000 || !Number.isInteger(month) || month < 0 || month > 11 || !Number.isInteger(day) || day < 1 || day > 15) {
    setStatus(root, "Enter a valid Vikram Samvat year, month and Tithi (1–15).", "error");
    return;
  }
  const wantedTithi = paksha === "Krishna" ? day + 14 : day - 1;
  const expectedGregorianYear = year - 57;
  const center = new Date(expectedGregorianYear, 3, 1 + Math.round(month * 29.53), 12);
  const start = new Date(center);
  const end = new Date(center);
  start.setDate(start.getDate() - 110);
  end.setDate(end.getDate() + 110);
  const matches = [];
  let checked = 0;
  setStatus(root, "Searching possible Gregorian dates…", "loading");
  const output = root.querySelector("[data-converter-output]");
  output.hidden = true;
  output.querySelector("dl").replaceChildren();
  output.querySelector("[data-converter-matches]").replaceChildren();
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const value = dateKey(cursor);
    const result = await calculate(value, state);
    const raw = result.raw;
    if (raw.samvat?.vikram === year && raw.masa?.index === month && raw.paksha === paksha && raw.tithi === wantedTithi && Boolean(raw.masa?.isAdhika) === adhika) {
      matches.push({ value, result });
    }
    checked += 1;
    if (checked % 20 === 0) {
      setStatus(root, `Searching possible Gregorian dates… ${checked} days checked`, "loading");
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  output.hidden = false;
  const list = output.querySelector("[data-converter-matches]");
  output.querySelector("dl").replaceChildren();
  list.replaceChildren();
  if (!matches.length) {
    const item = document.createElement("li");
    item.textContent = "No matching civil date was found in the supported search window. Check the convention, month and Adhika setting.";
    list.append(item);
  } else {
    for (const match of matches) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = new URL(`panchang/?date=${match.value}`, root._siteRoot).href;
      link.textContent = longDate(match.value, state.location);
      item.append(link, ` — ${match.result.tithi}, ${match.result.raw.paksha} ${match.result.raw.masa.name}`);
      list.append(item);
    }
  }
  setStatus(root, matches.length === 1 ? "One matching date found." : `${matches.length} possible matching dates found. Hindu dates can be ambiguous across conventions and locations.`);
}

function setupFullNavigation(root, refresh) {
  const input = root.querySelector("[data-panchang-date]");
  const queryDate = new URL(location.href).searchParams.get("date");
  input.value = parseDateKey(queryDate) ? queryDate : partsDate(new Date(), root._panchangSettings.location.timezone);
  input.addEventListener("change", refresh);
  root.querySelectorAll("[data-date-shift]").forEach((button) => button.addEventListener("click", () => {
    const current = parseDateKey(input.value) || new Date();
    current.setDate(current.getDate() + Number(button.dataset.dateShift));
    input.value = dateKey(current);
    refresh();
  }));
  root.querySelector("[data-date-today]")?.addEventListener("click", () => {
    input.value = partsDate(new Date(), root._panchangSettings.location.timezone);
    refresh();
  });
}

function setupCalendarNavigation(root, refresh) {
  const month = root.querySelector("[data-calendar-month]");
  const year = root.querySelector("[data-calendar-year]");
  const now = new Date();
  month.value = now.getMonth() + 1;
  year.value = now.getFullYear();
  const shift = (amount) => {
    const date = new Date(Number(year.value), Number(month.value) - 1 + amount, 1);
    month.value = date.getMonth() + 1;
    year.value = date.getFullYear();
    refresh();
  };
  root.querySelector("[data-month-prev]")?.addEventListener("click", () => shift(-1));
  root.querySelector("[data-month-next]")?.addEventListener("click", () => shift(1));
  root.querySelector("[data-month-today]")?.addEventListener("click", () => {
    month.value = now.getMonth() + 1;
    year.value = now.getFullYear();
    refresh();
  });
  month.addEventListener("change", refresh);
  year.addEventListener("change", refresh);
}

function setupConverter(root, state) {
  const today = partsDate(new Date(), state.location.timezone);
  root.querySelector("[data-convert-gregorian]").value = today;
  const modeButtons = root.querySelectorAll("[name=abp-converter-mode]");
  const updateMode = () => {
    const mode = root.querySelector("[name=abp-converter-mode]:checked").value;
    root.querySelector("[data-converter-gregorian-form]").hidden = mode !== "gregorian";
    root.querySelector("[data-converter-hindu-form]").hidden = mode !== "hindu";
    root.querySelector("[data-converter-output]").hidden = true;
  };
  modeButtons.forEach((button) => button.addEventListener("change", updateMode));
  root.querySelector("[data-convert-gregorian-button]").addEventListener("click", () => convertGregorian(root, state).catch((error) => fail(root, error)));
  root.querySelector("[data-convert-hindu-button]").addEventListener("click", () => convertHindu(root, state).catch((error) => fail(root, error)));
  updateMode();
}

function fail(root, error) {
  console.error("Panchang calculation failed", error);
  setStatus(root, "Today’s Panchang could not be calculated. Please retry.", "error");
}

export function initializePanchang(root, { siteRoot }) {
  if (root.dataset.panchangReady === "ready") return;
  root.dataset.panchangReady = "ready";
  root._panchangSettings = loadSettings();
  root._siteRoot = siteRoot;
  const view = root.dataset.panchangView;
  let generation = 0;
  const refresh = async () => {
    const run = ++generation;
    try {
      if (view === "summary") await renderSummary(root, root._panchangSettings);
      if (view === "full") await renderFull(root, root._panchangSettings);
      if (view === "calendar") await renderCalendar(root, root._panchangSettings);
      if (run !== generation) return;
    } catch (error) {
      if (run === generation) fail(root, error);
    }
  };
  populateLocationControl(root, root._panchangSettings, refresh);
  if (view === "full") setupFullNavigation(root, refresh);
  if (view === "calendar") setupCalendarNavigation(root, refresh);
  if (view === "converter") setupConverter(root, root._panchangSettings);
  if (view !== "converter") refresh();
}
