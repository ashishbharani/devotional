import { DEFAULT_LOCATION, INDIAN_CITIES, findCity, loadSettings, saveSettings } from "./settings.mjs";
import { GENERAL_LINKS, devotionalContext } from "./festival-links.mjs";
import {
  calculatePanchangDay,
  calculatePanchangMonth,
  clearPanchangCache,
} from "./panchang-adapter.mjs";
import {
  dateKeyFromParts,
  localDateKey,
  localDateParts,
  parseDateKey,
  safeAstronomicalDate,
  shiftDateKey,
} from "./date-time.mjs";
import { FESTIVAL_POLICY_NOTE, observanceNames } from "./festival-rules.mjs";

const partsDate = (date, timeZone) => localDateKey(date, timeZone);

function longDate(value, location) {
  const parts = parseDateKey(value);
  if (!parts) return "Invalid date";
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(date);
}

function shortTime(value, location, baseDate = null) {
  const date = safeAstronomicalDate(value);
  if (!date) return "Not available";
  const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: location.timezone }).format(date);
  if (!baseDate) return time;
  const eventDate = localDateKey(date, location.timezone);
  if (eventDate === baseDate) return time;
  const relation = eventDate === shiftDateKey(baseDate, 1) ? "next civil day" : eventDate;
  const label = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric", timeZone: location.timezone }).format(date);
  return `${time} (${label}, ${relation})`;
}

function timeRange(value, location, baseDate = null) {
  if (!value?.start || !value?.end) return "Not available";
  return `${shortTime(value.start, location, baseDate)} – ${shortTime(value.end, location, baseDate)}`;
}

function transitionSequence(items, location, baseDate) {
  if (!items?.length) return "Not available";
  return items.map((item) => `${item.name} until ${shortTime(item.end, location, baseDate)}`).join("; then ");
}

function noCivilEvent(label) {
  return `No ${label} on this local civil date`;
}

function setText(root, field, value) {
  root.querySelectorAll(`[data-panchang-field="${field}"]`).forEach((element) => { element.textContent = value; });
}

function observances(result) {
  return [...new Set(observanceNames(result))];
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
      clearPanchangCache();
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
      clearPanchangCache();
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
        clearPanchangCache();
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
  const context = devotionalContext(result.festivals || [], result.sunriseTithi.name);
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
  const events = observances(result);
  setText(root, "date", longDate(result.date, root._panchangSettings.location));
  setText(root, "location", root._panchangSettings.location.name);
  setText(root, "tithi", result.sunriseTithi.name);
  setText(root, "tithi-end", shortTime(result.tithiTransitions[0]?.end, root._panchangSettings.location, result.date));
  setText(root, "paksha", result.paksha);
  setText(root, "masa", `${result.masa.isAdhika ? "Adhika " : ""}${result.masa.name}`);
  setText(root, "nakshatra", result.sunriseNakshatra.name);
  setText(root, "nakshatra-end", shortTime(result.nakshatraTransitions[0]?.end, root._panchangSettings.location, result.date));
  setText(root, "festival", events.join("; ") || "No major observance identified in the current ruleset.");
  setText(root, "sunrise-sunset", `${shortTime(result.sunrise, root._panchangSettings.location)} / ${shortTime(result.sunset, root._panchangSettings.location)}`);
  setText(root, "convention", root._panchangSettings.convention === "purnimanta" ? "Purnimanta" : "Amanta");
  setStatus(root, "Panchang calculated for the selected date and location.");
}

async function renderSummary(root, state) {
  setStatus(root, "Calculating today’s Panchang…", "loading");
  const today = partsDate(new Date(), state.location.timezone);
  const result = await calculatePanchangDay(today, state);
  renderCommon(root, result);
  renderDevotionalLinks(root, result, root._siteRoot);
}

function detailRows(result, location, convention) {
  const rows = [
    ["Gregorian date", longDate(result.date, location)],
    ["Vara / Weekday", result.weekday],
    ["Hindu day", `${shortTime(result.sunrise, location)} to ${shortTime(result.nextSunrise, location, result.date)}`],
    ["Tithi at sunrise", result.sunriseTithi.name],
    ["Tithi sequence (sunrise to sunrise)", transitionSequence(result.tithiTransitions, location, result.date)],
    ["Paksha", result.paksha],
    ["Masa", `${result.masa.isAdhika ? "Adhika " : ""}${result.masa.name}`],
    ["Calendar convention", convention === "purnimanta" ? "Purnimanta" : "Amanta"],
    ["Nakshatra at sunrise", result.sunriseNakshatra.name],
    ["Nakshatra sequence (sunrise to sunrise)", transitionSequence(result.nakshatraTransitions, location, result.date)],
    ["Yoga at sunrise", result.sunriseYoga.name],
    ["Yoga sequence (sunrise to sunrise)", transitionSequence(result.yogaTransitions, location, result.date)],
    ["Karana at sunrise", result.sunriseKarana.name],
    ["Karana sequence (sunrise to sunrise)", transitionSequence(result.karanaTransitions, location, result.date)],
    ["Sunrise", shortTime(result.sunrise, location)],
    ["Sunset", shortTime(result.sunset, location)],
    ["Moonrise / Chandrodaya", result.moonrise ? shortTime(result.moonrise, location) : noCivilEvent("Moonrise")],
    ["Moonset / Chandrasta", result.moonset ? shortTime(result.moonset, location) : noCivilEvent("Moonset")],
    ["Vikram Samvat", result.samvat?.vikram],
    ["Shaka Samvat", result.samvat?.shaka],
    ["Rahu Kalam", timeRange(result.rahuKalam, location, result.date)],
    ["Yamaganda", timeRange(result.yamaganda, location, result.date)],
    ["Gulika", timeRange(result.gulika, location, result.date)],
    ["Abhijit Muhurta", timeRange(result.abhijitMuhurta, location, result.date)],
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
  const result = await calculatePanchangDay(selected, state);
  renderCommon(root, result);
  renderRows(root.querySelector("[data-panchang-details]"), detailRows(result, state.location, state.convention));
  const festivals = root.querySelector("[data-panchang-festivals]");
  festivals.replaceChildren(...((result.festivals || []).map((festival) => {
    const item = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = festival.name;
    item.append(strong);
    if (festival.description) item.append(` — ${festival.description}`);
    const qualification = document.createElement("small");
    qualification.textContent = " Rule-based observance; verify the applicable regional tradition.";
    item.append(qualification);
    return item;
  })));
  if (!festivals.children.length) {
    const item = document.createElement("li");
    item.textContent = "No major observance identified in the current ruleset.";
    festivals.append(item);
  }
  const policy = document.createElement("li");
  policy.className = "abp-panchang__policy";
  policy.textContent = FESTIVAL_POLICY_NOTE;
  festivals.append(policy);
  renderDevotionalLinks(root, result, root._siteRoot);
  const url = new URL(location.href);
  url.searchParams.set("date", selected);
  history.replaceState(history.state, "", url);
}

async function renderCalendar(root, state, isCurrent = () => true) {
  const monthInput = root.querySelector("[data-calendar-month]");
  const yearInput = root.querySelector("[data-calendar-year]");
  const todayKey = partsDate(new Date(), state.location.timezone);
  const now = parseDateKey(todayKey);
  const month = Math.min(12, Math.max(1, Number(monthInput.value) || now.month));
  const year = Math.min(2200, Math.max(1800, Number(yearInput.value) || now.year));
  monthInput.value = month;
  yearInput.value = year;
  setStatus(root, "Calculating the monthly Hindu calendar…", "loading");
  const grid = root.querySelector("[data-calendar-grid]");
  grid.replaceChildren();
  const first = new Date(Date.UTC(year, month - 1, 1, 12));
  const monthDays = await calculatePanchangMonth(year, month, state, (complete, total) => {
    if (isCurrent()) setStatus(root, `Calculating the monthly Hindu calendar… ${complete}/${total}`, "loading");
  });
  if (!isCurrent()) return;
  for (let blank = 0; blank < first.getUTCDay(); blank += 1) {
    const spacer = document.createElement("span");
    spacer.className = "abp-panchang-calendar__blank";
    spacer.setAttribute("aria-hidden", "true");
    grid.append(spacer);
  }
  for (const result of monthDays) {
    const value = result.date;
    const day = parseDateKey(value).day;
    if (!result.error) {
      const link = document.createElement("a");
      link.className = "abp-panchang-calendar__day";
      if (value === todayKey) link.classList.add("is-today");
      link.href = new URL(`panchang/?date=${value}`, root._siteRoot).href;
      const number = document.createElement("b");
      number.textContent = day;
      const tithi = document.createElement("span");
      tithi.textContent = result.sunriseTithi.name;
      link.append(number, tithi);
      const firstTithi = result.tithiTransitions[0];
      const firstNakshatra = result.sunriseNakshatra.name;
      if (firstTithi?.end) {
        const transition = document.createElement("small");
        transition.className = "abp-panchang-calendar__transition";
        transition.textContent = `until ${shortTime(firstTithi.end, state.location, value)} · ${firstNakshatra}`;
        link.append(transition);
      }
      const markers = observances(result);
      if (markers.length) {
        const marker = document.createElement("small");
        marker.textContent = markers.slice(0, 2).join(" · ");
        link.append(marker);
      }
      link.setAttribute("aria-label", `${longDate(value, state.location)}: ${result.sunriseTithi.name} at sunrise; ${firstNakshatra} Nakshatra${markers.length ? `; ${markers.join(", ")}` : ""}`);
      grid.append(link);
    } else {
      const unavailable = document.createElement("span");
      unavailable.className = "abp-panchang-calendar__day is-unavailable";
      unavailable.textContent = String(day);
      unavailable.setAttribute("aria-label", `${longDate(value, state.location)} unavailable: ${result.warnings.join(" ")}`);
      grid.append(unavailable);
    }
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
  const result = await calculatePanchangDay(input.value, state);
  converterOutput(root, detailRows(result, state.location, state.convention).filter(([label]) => ["Gregorian date", "Vara / Weekday", "Tithi at sunrise", "Tithi sequence (sunrise to sunrise)", "Paksha", "Masa", "Calendar convention", "Nakshatra at sunrise", "Nakshatra sequence (sunrise to sunrise)", "Vikram Samvat", "Shaka Samvat"].includes(label)));
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
  const center = new Date(Date.UTC(expectedGregorianYear, 3, 1 + Math.round(month * 29.53), 12));
  const centerKey = dateKeyFromParts({ year: center.getUTCFullYear(), month: center.getUTCMonth() + 1, day: center.getUTCDate() });
  const start = shiftDateKey(centerKey, -110);
  const matches = [];
  let checked = 0;
  setStatus(root, "Searching possible Gregorian dates…", "loading");
  const output = root.querySelector("[data-converter-output]");
  output.hidden = true;
  output.querySelector("dl").replaceChildren();
  output.querySelector("[data-converter-matches]").replaceChildren();
  for (let index = 0; index <= 220; index += 1) {
    const value = shiftDateKey(start, index);
    const result = await calculatePanchangDay(value, state);
    if (result.samvat?.vikram === year && result.masa.index === month && result.paksha === paksha && result.sunriseTithi.index === wantedTithi && result.masa.isAdhika === adhika) {
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
      item.append(link, ` — ${match.result.sunriseTithi.name}, ${match.result.paksha} ${match.result.masa.name}`);
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
    const current = parseDateKey(input.value) ? input.value : partsDate(new Date(), root._panchangSettings.location.timezone);
    input.value = shiftDateKey(current, Number(button.dataset.dateShift));
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
  const now = localDateParts(new Date(), root._panchangSettings.location.timezone);
  month.value = now.month;
  year.value = now.year;
  const shift = (amount) => {
    const date = new Date(Date.UTC(Number(year.value), Number(month.value) - 1 + amount, 1));
    month.value = date.getUTCMonth() + 1;
    year.value = date.getUTCFullYear();
    refresh();
  };
  root.querySelector("[data-month-prev]")?.addEventListener("click", () => shift(-1));
  root.querySelector("[data-month-next]")?.addEventListener("click", () => shift(1));
  root.querySelector("[data-month-today]")?.addEventListener("click", () => {
    month.value = now.month;
    year.value = now.year;
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
      if (view === "calendar") await renderCalendar(root, root._panchangSettings, () => run === generation);
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
