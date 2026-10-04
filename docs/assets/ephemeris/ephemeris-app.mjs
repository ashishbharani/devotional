// SPDX-License-Identifier: AGPL-3.0-or-later
import { INDIAN_CITIES, findCity, loadSettings, saveSettings, subscribeSettings, settingsEqual } from "../panchang/settings.mjs";
import { civilForInstant, localCivilTimeToUTC, formatOffset, DEFAULT_TIMEZONE } from "./time-conversion.mjs";
import { formatAngle, RASHIS } from "./zodiac.mjs";
import { exportCSV, downloadCSV } from "./csv-export.mjs";
import { attachLocationControls, locationDescription } from "../panchang/location-controls.mjs";

const PREF_KEY = "abp-ephemeris-preferences-v1";
const AYANAMSHA_LABELS = { lahiri: "Lahiri (Chitrapaksha)", raman: "Raman", krishnamurti: "Krishnamurti", yukteshwar: "Yukteshwar", fagan: "Fagan/Bradley", tropical: "Tropical / Sayana (comparison)" };
const HOUSE_LABELS = { W: "Whole Sign — Jyotish", A: "Equal House", S: "Sripati", P: "Placidus — Western comparison" };
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const numberText = (value, digits = 6) => value === null || value === undefined ? "—" : value.toFixed(digits);
const options = (items) => Object.entries(items).map(([value, label]) => `<option value="${escape(value)}">${escape(label)}</option>`).join("");

function markup() {
  return `<div class="eph">
    <header class="eph-hero">
      <p class="eph-hindi" lang="hi">भारतीय ग्रह स्थिति</p>
      <p class="eph-subtitle">High-Precision Sidereal Planetary Positions for Jyotish</p>
      <p>Default: Lahiri/Chitrapaksha • Asia/Kolkata</p>
      <span class="eph-engine" data-engine-status>Loading ephemeris engine…</span>
    </header>
    <div class="eph-tabs" role="tablist" aria-label="Ephemeris mode">
      <button type="button" role="tab" id="eph-tab-current" aria-controls="eph-panel" aria-selected="true" data-mode="current">Current</button>
      <button type="button" role="tab" id="eph-tab-date" aria-controls="eph-panel" aria-selected="false" tabindex="-1" data-mode="date">Date &amp; Time</button>
      <button type="button" role="tab" id="eph-tab-month" aria-controls="eph-panel" aria-selected="false" tabindex="-1" data-mode="month">Monthly Ephemeris</button>
    </div>
    <section id="eph-panel" role="tabpanel" aria-labelledby="eph-tab-current" tabindex="0">
      <form class="eph-controls">
        <div class="eph-grid" data-date-controls hidden>
          <label>Date (Gregorian)<input name="date" type="date" min="1800-01-01" max="2399-12-31" required></label>
          <label>Time<input name="time" type="time" step="1" required></label>
        </div>
        <div class="eph-grid" data-month-controls hidden>
          <label>Month<input name="month" type="month" min="1800-01" max="2399-12" required></label>
          <label>Daily reference time<input name="referenceTime" type="time" value="00:00:00" step="1" required></label>
          <label class="eph-check"><input name="detailed" type="checkbox"> Detailed cells (Nakshatra, Pada, speed)</label>
          <label class="eph-check"><input name="events" type="checkbox"> Find Rashi ingresses and stations</label>
        </div>
        <div class="eph-grid">
          <label>Timezone (IANA)<input name="timezone" value="Asia/Kolkata" list="eph-timezones" required spellcheck="false"></label>
          <datalist id="eph-timezones"><option>Asia/Kolkata</option><option>UTC</option><option>Asia/Kathmandu</option><option>Europe/London</option><option>America/New_York</option></datalist>
          <label>Ayanamsha / Zodiac<select name="ayanamsha">${options(AYANAMSHA_LABELS)}</select></label>
          <label>Lunar node<select name="nodeMode"><option value="mean">Mean Node</option><option value="true">True Node</option></select></label>
          <label>Display precision<select name="precision"><option value="seconds">Degrees + Minutes + Seconds</option><option value="minutes">Degrees + Minutes</option><option value="degrees">Degrees</option></select></label>
        </div>
        <details class="eph-advanced">
          <summary>Advanced Settings · Location, observer and historical time</summary>
          <div class="eph-grid">
            <label>Observer mode<select name="observerMode"><option value="geocentric">Geocentric (default)</option><option value="topocentric">Topocentric</option></select></label>
            <label class="eph-check"><input name="modern" type="checkbox"> Include Uranus, Neptune and Pluto separately</label>
            <label class="eph-check"><input name="showLagna" type="checkbox"> Show Lagna and houses</label>
            <label>House system<select name="houseSystem">${options(HOUSE_LABELS)}</select></label>
            <label>Indian city / town<input name="city" list="eph-cities" autocomplete="off" placeholder="Type a place, then Enter or Search; or choose a preset"></label>
            <datalist id="eph-cities">${INDIAN_CITIES.map((c) => `<option value="${escape(c.name)}"></option>`).join("")}<option value="New Delhi"></option></datalist>
            <label>Latitude (north +)<input name="latitude" type="number" min="-90" max="90" step="any"></label>
            <label>Longitude (east +)<input name="longitude" type="number" min="-180" max="180" step="any"></label>
            <label>Elevation (metres)<input name="altitude" type="number" min="-500" max="10000" step="any"></label>
            <button class="abp-btn" type="button" data-location>📍 Use Current Location</button>
            <p class="eph-hint" role="status" aria-live="polite" data-location-status>City presets are approximate central coordinates, not an exact birth location. Set precise coordinates for Lagna or topocentric work.</p>
            <label class="eph-check"><input name="manual" type="checkbox"> Manually specify historical UTC offset</label>
            <label>Historical offset (±HH:MM[:SS])<input name="manualOffset" value="+05:30" pattern="[+-][0-9]{2}:[0-9]{2}(:[0-9]{2})?" disabled></label>
          </div>
          <p>Lagna is location- and time-dependent. Geocentric planetary positions do not depend on location. In topocentric mode the planets are corrected; Rahu/Ketu remain geocentric orbital nodes.</p>
          <p>Supported UTC date range: 1800–2399. Calendar: proleptic Gregorian. UTC is used as an approximation to UT1; no DUT1 correction is applied.</p>
        </details>
        <div class="eph-actions">
          <button class="abp-btn eph-primary" type="submit" data-calculate>Refresh</button>
          <button class="abp-btn" type="button" data-now>Now</button>
          <button class="abp-btn" type="button" data-reset>Reset</button>
        </div>
      </form>
      <p class="eph-status" role="status" aria-live="polite" data-status>Loading ephemeris engine…</p>
      <div data-results hidden>
        <div class="eph-summary" data-summary></div>
        <div class="eph-actions eph-export">
          <button class="abp-btn" type="button" data-copy>Copy Table</button>
          <button class="abp-btn" type="button" data-csv>Download CSV</button>
          <button class="abp-btn" type="button" data-print>Print</button>
          <button class="abp-btn" type="button" data-share>Copy Share Link</button>
          <label class="eph-check"><input type="checkbox" data-share-location> Include coordinates in share link</label>
        </div>
        <p class="eph-hint">Scroll the table horizontally to see all columns. Values are displayed by truncating seconds or minutes; exported raw numbers retain engine precision.</p>
        <div class="eph-scroll" tabindex="0" role="region" aria-label="Planetary positions table" data-table></div>
        <div data-lagna></div>
        <div data-events></div>
        <details class="eph-details"><summary>Calculation Details</summary><div data-details></div></details>
      </div>
    </section>
    <details class="eph-about">
      <summary>About this Ephemeris</summary>
      <p>Sidereal (Nirayana) positions use the selected ayanamsha, an angular offset from the tropical (Sayana) zodiac. Lahiri/Chitrapaksha is the default; other traditions use other offsets. Native Swiss modes are used throughout. Tropical comparison has no Jyotish Nakshatra/Pada classification.</p>
      <p>Modern India uses UTC+05:30 in Asia/Kolkata. The selected civil clock is resolved through the browser’s IANA timezone database into UTC before the engine calculates a Julian Day in UT. Historical offsets may differ, including second-level offsets. Verify old regional civil times; a manual offset overrides IANA history. Ambiguous clock times require an explicit offset.</p>
      <p>Rahu uses your selected mean or true lunar node; neither convention is universal across Jyotish schools. Ketu is exactly opposite Rahu. Nodes are orbital intersections, not physical planets with an observer distance. Retrograde means negative longitudinal speed; near station means absolute speed below 0.0001°/day.</p>
      <p>The 12 Rashis divide the zodiac into 30° segments. The 27 Nakshatras span 13°20′ each, divided into four Padas of 3°20′. Classifications use unrounded longitude. Location affects Lagna, houses and topocentric planetary positions, but not basic geocentric longitude.</p>
      <p>Monthly positions are sampled at the explicitly selected local reference time. Optional ingress/station events use hourly brackets refined to one second; this search is not an exhaustive transit calendar and may miss very brief double crossings. It detects Rashi changes and speed-zero stations, not Nakshatra events.</p>
      <p>Calculations run locally using Swiss Ephemeris 2.10.03 via @kuntay/swisseph 0.2.2. Only the planet and Moon DE441 files for 1800–2399 are loaded and verified by SHA-256. Missing/corrupt data or Moshier fallback withholds results. Geolocation is requested only by the location button and is never stored persistently. Preferences store only ayanamsha, node, precision and monthly reference time.</p>
      <p>Software licence: AGPL-3.0-or-later. <a href="https://github.com/ashishbharani/devotional">Complete website source and build instructions</a> · <a href="https://github.com/kuntayerkus/swisseph-wasm/tree/v0.2.2">Pinned engine source</a> · <a href="https://www.astro.com/swisseph/swephprg.htm">Swiss programming reference</a>.</p>
    </details>
    <p class="eph-disclaimer">Astrological interpretations vary among traditions. This tool provides astronomical position calculations and Jyotish-oriented classifications based on the selected calculation settings. Users should verify birth times, historical time-zone information and interpretive conventions when precision is important.</p>
  </div>`;
}

function detailedTable(result, precision) {
  const render = (planet) => `<tr><th scope="row">${escape(planet.name)}<small lang="hi">${escape(planet.hindi)}</small></th>
    <td aria-label="${escape(planet.name)} symbol">${escape(planet.symbol)}</td>
    <td>${formatAngle(planet.longitude, precision)}</td><td>${escape(planet.rashi.name)}<small>${escape(planet.rashi.hindi)} · ${escape(planet.rashi.english)}</small></td>
    <td>${formatAngle(planet.degreeInRashi, precision, 30)}</td><td>${escape(planet.nakshatra || "Not applicable")}<small>${planet.nakshatra ? `${formatAngle(planet.nakshatraProgress, precision)} into Nakshatra` : "Tropical comparison"}</small></td>
    <td>${planet.pada ?? "—"}</td><td>${planet.speed.toFixed(6)}°/day</td><td>${escape(planet.motion)}</td>
    <td>${numberText(planet.latitude)}°</td><td>${["rahu", "ketu"].includes(planet.key) ? "Orbital node; N/A" : numberText(planet.distance, 8)}</td>
    <td>${formatAngle(planet.tropicalLongitude, precision)}</td></tr>`;
  return `<table class="eph-table"><caption>${result.sidereal ? "Sidereal" : "Tropical"} Navagraha positions · ${escape(result.ayanamsha)} · ${escape(result.observerMode)} · ${result.nodeMode} node</caption>
    <thead><tr>${["Graha", "Symbol", "Longitude (0°–360°)", "Rashi / Sign", "Position within Rashi", "Nakshatra / Progress", "Pada", "Speed", "Motion", "Latitude", "Distance (AU)", "Tropical longitude"].map((label) => `<th scope="col">${label}</th>`).join("")}</tr></thead>
    <tbody>${result.planets.map(render).join("")}${result.modern.length ? `<tr class="eph-separator"><th scope="row" colspan="12">Optional modern planets (outside Navagraha)</th></tr>${result.modern.map(render).join("")}` : ""}</tbody></table>`;
}

function monthlyTable(model, detailed, precision) {
  const bodies = [...model.rows[0].result.planets, ...model.rows[0].result.modern];
  return `<table class="eph-table eph-month"><caption>Daily planetary positions · ${escape(model.referenceTime)} · ${escape(model.timezone)}. Full raw values and UTC instants are included in CSV.</caption>
    <thead><tr><th scope="col">Local date</th>${bodies.map((p) => `<th scope="col">${escape(p.name)}</th>`).join("")}</tr></thead>
    <tbody>${model.rows.map(({ date, result }) => `<tr><th scope="row">${date}</th>${[...result.planets, ...result.modern].map((p) => `<td>${p.rashi.abbreviation} ${formatAngle(p.degreeInRashi, precision, 30)} ${p.speed < 0 ? "℞" : ""}${detailed ? `<small>${escape(p.nakshatra || "Tropical")} · Pada ${p.pada ?? "—"}<br>${p.speed.toFixed(6)}°/day · ${escape(p.motion)}</small>` : ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

export function initializeEphemeris(root) {
  if (root.dataset.ephemerisReady === "ready") return;
  root.innerHTML = markup();
  root.dataset.ephemerisReady = "ready";
  const get = (selector) => root.querySelector(selector);
  const form = get("form");
  const control = (name) => form.elements.namedItem(name);
  let mode = "current";
  let snapshot = null;
  let busy = false;
  let worker = null;
  let requestId = 0;
  const pending = new Map();
  let cleanupObserver;
  let generation = 0;
  let restoreControls = () => {};
  let canonical = loadSettings();
  let activeLocationName = canonical.location.name;

  function invalidate() {
    generation += 1;
    worker?.terminate(); worker = null;
    for (const task of pending.values()) { clearTimeout(task.timer); task.reject(new Error("Calculation superseded.")); }
    pending.clear();
    restoreControls();
    busy = false;
    discardResults();
  }

  function setStatus(message, state = "ready") {
    get("[data-status]").textContent = message;
    get("[data-status]").dataset.state = state;
  }
  function discardResults() {
    snapshot = null;
    get("[data-results]").hidden = true;
  }
  function savePreferences() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(Object.fromEntries(["ayanamsha", "nodeMode", "precision", "referenceTime"].map((key) => [key, control(key).value])))); }
    catch (_) { /* Blocked storage keeps preferences session-only. */ }
  }
  function setNow() {
    const p = civilForInstant(new Date(), control("timezone").value, control("manual").checked ? control("manualOffset").value : null);
    control("date").value = p.date;
    control("time").value = p.time;
    control("month").value = p.date.slice(0, 7);
  }
  function setCity(city) {
    activeLocationName = city.name;
    control("city").value = city.name;
    control("latitude").value = city.latitude;
    control("longitude").value = city.longitude;
    control("altitude").value = city.altitudeKnown === false ? "" : city.altitude;
    control("timezone").value = city.timezone;
    control("manual").checked = false;
    control("manualOffset").disabled = true;
    get("[data-location-status]").textContent = locationDescription(city);
  }
  function settings() {
    const numeric = (key) => control(key).value.trim() === "" ? null : Number(control(key).value);
    return { ayanamsha: control("ayanamsha").value, nodeMode: control("nodeMode").value,
      observerMode: control("observerMode").value, modern: control("modern").checked,
      showLagna: mode !== "month" && control("showLagna").checked, houseSystem: control("houseSystem").value,
      latitude: numeric("latitude"), longitude: numeric("longitude"), altitude: numeric("altitude") ?? 0 };
  }
  function selectMode(value, focus = false) {
    mode = value;
    root.querySelectorAll("[data-mode]").forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab.dataset.mode === mode));
      tab.tabIndex = tab.dataset.mode === mode ? 0 : -1;
      if (focus && tab.dataset.mode === mode) tab.focus();
    });
    get("#eph-panel").setAttribute("aria-labelledby", `eph-tab-${mode}`);
    get("[data-date-controls]").hidden = mode !== "date";
    get("[data-month-controls]").hidden = mode !== "month";
    ["date", "time"].forEach((key) => { control(key).disabled = mode !== "date"; });
    ["month", "referenceTime", "detailed", "events"].forEach((key) => { control(key).disabled = mode !== "month"; });
    control("showLagna").disabled = mode === "month";
    get("[data-calculate]").textContent = mode === "current" ? "Refresh" : mode === "month" ? "Generate Month" : "Calculate";
    discardResults();
    setStatus(mode === "month" ? "Choose a month and explicit local sampling time, then Generate Month." : mode === "current" ? "Refresh calculates the actual current instant." : "Enter a date and time, then Calculate.");
  }

  function callWorker(type, request) {
    if (!worker) {
      worker = new Worker(new URL("./ephemeris-worker.mjs", import.meta.url), { type: "module" });
      worker.onmessage = ({ data }) => {
        const task = pending.get(data.id);
        if (!task) return;
        if (data.progress) { setStatus(`Calculating monthly ephemeris: ${data.progress}…`); return; }
        clearTimeout(task.timer);
        pending.delete(data.id);
        if (data.error) task.reject(new Error(data.error)); else task.resolve(data.result);
      };
      worker.onerror = () => {
        for (const task of pending.values()) { clearTimeout(task.timer); task.reject(new Error("Ephemeris engine unavailable. Please reload or try again.")); }
        pending.clear(); worker.terminate(); worker = null;
      };
    }
    return new Promise((resolve, reject) => {
      const id = ++requestId;
      const timer = setTimeout(() => {
        pending.delete(id);
        worker?.terminate(); worker = null;
        reject(new Error("Ephemeris engine timed out. Please reload or try again."));
      }, 120000);
      pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, type, request });
    });
  }

  function details(row) {
    const { result: r, civil: c } = row;
    const values = [
      ["Local date/time", `${c.date} ${c.time}`], ["Timezone", c.timezone], ["UTC offset", formatOffset(c.offsetSeconds)],
      ["Offset source", c.manualOffset === null ? "Browser IANA tzdb" : `Manual ${c.manualOffset}`], ["UTC timestamp", r.instantUTC],
      ["Julian Day UT", r.jdUT.toFixed(9)], ["Calendar", "Proleptic Gregorian"],
      ["Latitude", r.settings.latitude ?? "Not supplied"], ["Longitude (east +)", r.settings.longitude ?? "Not supplied"], ["Elevation (m)", r.settings.altitude ?? "Not supplied"],
      ["Ayanamsha", r.ayanamsha], ["Ayanamsha value (degrees)", r.ayanamshaValue.toFixed(9)],
      ["Node convention", `${r.nodeMode} · geocentric orbital nodes`], ["Observer", r.observerMode],
      ["Engine", `${r.engine} ${r.engineVersion}`], ["Wrapper", "@kuntay/swisseph 0.2.2"], ["Dataset", r.dataset],
      ["Requested flags", `${r.flags} · apparent ecliptic of date, speed${r.sidereal ? ", native sidereal" : ""}`],
      ["ΔT model (seconds)", r.deltaTSeconds.toFixed(6)], ["Time scale", r.timeScaleNote],
    ];
    return `<dl class="eph-definition">${values.map(([label, value]) => `<dt>${escape(label)}</dt><dd>${escape(value)}</dd>`).join("")}</dl>`;
  }

  function render() {
    if (!snapshot) return;
    const rows = snapshot.rows;
    const { result: r, civil: c } = rows[0];
    const precision = control("precision").value;
    const ist = c.timezone === "Asia/Kolkata" && c.offsetSeconds === 19800 ? " IST" : "";
    const civilDate = new Date(`${c.date}T12:00:00Z`);
    const longDate = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(civilDate);
    const title = snapshot.mode === "month" ? `Positions calculated daily at: ${snapshot.referenceTime}${ist} · ${c.timezone}` : `${longDate} · ${c.time}${ist}`;
    get("[data-summary]").innerHTML = `<h2>${escape(title)}</h2>
      <p>${formatOffset(c.offsetSeconds)} · ${escape(c.timezone)} · ${escape(r.observerMode)} · ${r.nodeMode} node</p>
      <p>Ayanamsha: ${escape(r.ayanamsha)} · ${formatAngle(r.ayanamshaValue, "seconds")} (${r.ayanamshaValue.toFixed(8)}°)</p>
      <p>${snapshot.mode === "month" ? `${rows.length} calendar dates · offsets resolved separately for each row` : `UTC: ${escape(r.instantUTC)} · JD UT: ${r.jdUT.toFixed(9)}`}</p>
      ${c.warning ? `<p class="eph-warning">${escape(c.warning)}</p>` : ""}
      ${r.observerMode === "topocentric" ? "<p>Planets: topocentric · Rahu/Ketu: geocentric orbital nodes.</p>" : ""}
      ${!r.sidereal ? "<p>Tropical / Sayana comparison: Nakshatra and Pada are not assigned.</p>" : ""}`;
    get("[data-table]").innerHTML = snapshot.mode === "month" ? monthlyTable(snapshot, control("detailed").checked, precision) : detailedTable(r, precision);
    get("[data-details]").innerHTML = `${snapshot.mode === "month" ? "<p>First daily sample shown below. Every date’s UTC instant, offset and numerical ayanamsha are recorded in the monthly CSV.</p>" : ""}${details(rows[0])}`;
    get("[data-lagna]").innerHTML = r.lagna ? `<section><h2>Lagna / Ascendant</h2><p>Lagna is location- and time-dependent. ${escape(control("city").value || "Manual location")} · ${r.settings.latitude}°, ${r.settings.longitude}°.</p>
      <p>${escape(r.lagna.rashi.name)} · ${formatAngle(r.lagna.degreeInRashi, precision, 30)} · absolute ${formatAngle(r.lagna.longitude, precision)}${r.sidereal ? ` · ${escape(r.lagna.nakshatra)} · Pada ${r.lagna.pada}` : ""}</p>
      <details><summary>Houses · ${escape(HOUSE_LABELS[r.houses.system])}</summary><ol>${r.houses.cusps.map((longitude) => `<li>${escape(RASHIS[Math.floor(longitude / 30)].name)} · ${formatAngle(longitude, precision)}</li>`).join("")}</ol></details></section>` : "";
    get("[data-events]").innerHTML = snapshot.eventsUnavailable ? "<p>Event search is unavailable for December 2399. The daily samples remain supported.</p>" : snapshot.events?.length ? `<details><summary>Rashi ingresses and stations (${snapshot.events.length})</summary><p>Hourly scan refined to ≤1 second; timestamps below use the selected civil timezone. Verify very brief double crossings separately.</p><ul>${snapshot.events.map((event) => {
      const p = civilForInstant(event.instantUTC, c.timezone, c.manualOffset);
      return `<li>${p.date} ${p.time} ${formatOffset(p.offsetSeconds)} · ${escape(event.body)} · ${escape(event.event)}</li>`;
    }).join("")}</ul></details>` : snapshot.mode === "month" && snapshot.eventsRequested ? "<p>No Rashi ingress or station was detected by the hourly scan in this month.</p>" : "";
    get("[data-csv]").textContent = snapshot.mode === "month" ? "Download Monthly CSV" : "Download CSV";
    get("[data-results]").hidden = false;
  }

  async function calculate() {
    if (busy || !form.reportValidity()) return;
    if (control("city").value.trim() !== activeLocationName) {
      setStatus("Choose a search result or preset, or explicitly apply manual coordinates before calculating for a new place name.", "error");
      return;
    }
    const run = ++generation;
    discardResults(); busy = true;
    // Freeze controls while the worker calculates so exports cannot describe a
    // different setting than the numbers on screen.
    const disabled = [...form.elements].map((element) => [element, element.disabled]);
    restoreControls = () => disabled.forEach(([element, state]) => { element.disabled = state; });
    try {
      const timezone = control("timezone").value.trim();
      const manualOffset = control("manual").checked ? control("manualOffset").value : null;
      const selected = settings();
      let request;
      let civil;
      if (mode === "month") {
        const [year, month] = control("month").value.split("-").map(Number);
        request = { year, month, referenceTime: control("referenceTime").value, timezone, manualOffset, settings: selected, events: control("events").checked };
      } else {
        if (mode === "current") {
          const instantUTC = new Date().toISOString();
          const p = civilForInstant(instantUTC, timezone, manualOffset);
          civil = { instantUTC, date: p.date, time: p.time, timezone, offsetSeconds: p.offsetSeconds, manualOffset, warning: null };
        } else civil = localCivilTimeToUTC({ date: control("date").value, time: control("time").value, timezone, manualOffset });
        request = { ...selected, instantUTC: civil.instantUTC };
      }
      form.querySelectorAll("input, select, button").forEach((element) => { element.disabled = true; });
      setStatus("Loading ephemeris engine / calculating…");
      const result = await callWorker(mode === "month" ? "month" : "single", request);
      if (!root.isConnected || run !== generation) return;
      snapshot = mode === "month" ? { ...result, mode, eventsRequested: request.events } : { mode, rows: [{ date: civil.date, result, civil }] };
      get("[data-engine-status]").textContent = `Swiss Ephemeris ${snapshot.rows[0].result.engineVersion} · verified DE441 files`;
      savePreferences(); render();
      setStatus(mode === "month" ? "Monthly calculation complete. Each row uses the stated local reference time." : "Calculation complete. Raw engine values are available in CSV.");
    } catch (error) {
      if (!root.isConnected || run !== generation) return;
      discardResults();
      get("[data-engine-status]").textContent = "No calculation available";
      setStatus(`Ephemeris unavailable for these settings. ${error.message} Please correct the input or reload and try again.`, "error");
    } finally {
      if (run === generation) { restoreControls(); busy = false; }
    }
  }

  setCity(canonical.location);
  setNow();
  try {
    const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
    for (const name of ["ayanamsha", "nodeMode", "precision", "referenceTime"]) {
      if (typeof prefs[name] === "string") {
        control(name).value = prefs[name];
        if (!control(name).value) control(name).value = { ayanamsha: "lahiri", nodeMode: "mean", precision: "seconds", referenceTime: "00:00:00" }[name];
      }
    }
  } catch (_) { /* Bad preferences never stop astronomy. */ }
  const query = new URL(location.href).searchParams;
  for (const [param, name] of [["date", "date"], ["time", "time"], ["timezone", "timezone"], ["ayanamsha", "ayanamsha"], ["node", "nodeMode"], ["observer", "observerMode"], ["lat", "latitude"], ["lon", "longitude"], ["alt", "altitude"], ["offset", "manualOffset"]]) {
    if (query.has(param)) control(name).value = query.get(param);
  }
  if (query.has("offset")) { control("manual").checked = true; control("manualOffset").disabled = false; }
  if (query.get("lagna") === "1") control("showLagna").checked = true;
  if (query.has("houses")) control("houseSystem").value = query.get("houses");
  if (query.get("modern") === "1") control("modern").checked = true;
  if (query.has("lat") || query.has("lon")) {
    control("city").value = "Shared manual location"; activeLocationName = control("city").value;
    if (!query.has("alt")) control("altitude").value = "";
  }
  selectMode(query.has("date") ? "date" : "current");
  if (query.has("lat") || query.has("lon")) get("[data-location-status]").textContent = "Shared URL coordinates are a local override, not a saved site location. Blank elevation uses a 0 m neutral fallback.";
  const applyLocation = (place) => {
    locationControls.cancel();
    invalidate();
    setCity(place);
    canonical = { ...loadSettings(), location: place };
    canonical = saveSettings(canonical);
    locationControls.show(canonical.location);
    calculate();
  };
  const locationControls = attachLocationControls({ root, input: control("city"),
    geolocate: get("[data-location]"), timezone: () => control("timezone").value.trim(), apply: applyLocation,
    manual: () => Object.fromEntries(["latitude", "longitude", "altitude"].map((key) => [key, control(key).value])),
  });

  form.addEventListener("submit", (event) => { event.preventDefault(); calculate(); });
  form.addEventListener("change", (event) => {
    if (event.target.name === "precision" || event.target.name === "detailed") { savePreferences(); render(); return; }
    if (event.target.name === "manual") control("manualOffset").disabled = !control("manual").checked;
    if (event.target.name === "city") {
      const city = findCity(control("city").value);
      if (city) {
        applyLocation(city);
        return;
      }
      else get("[data-location-status]").textContent = "Press Enter or click Search Indian locations and choose a result, or apply manual coordinates. Typing alone keeps the previous calculation location.";
    }
    if (["latitude", "longitude", "altitude"].includes(event.target.name)) {
      control("city").value = "Manual location";
      activeLocationName = "Manual location";
      get("[data-location-status]").textContent = "Manual local override. Apply manual coordinates across site to share for this session; timezone is selected independently. Blank elevation uses a 0 m neutral fallback.";
    }
    discardResults(); setStatus("Settings changed. Calculate to update results.");
  });
  form.addEventListener("input", (event) => {
    if (event.target.name !== "precision" && event.target.name !== "detailed") discardResults();
  });
  root.querySelectorAll("[data-mode]").forEach((tab) => {
    tab.addEventListener("click", () => { if (!busy) selectMode(tab.dataset.mode); });
    tab.addEventListener("keydown", (event) => {
      if (busy || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const modes = ["current", "date", "month"];
      const index = modes.indexOf(mode);
      selectMode(modes[event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3], true);
    });
  });
  get("[data-now]").addEventListener("click", () => { setNow(); selectMode("current"); calculate(); });
  get("[data-reset]").addEventListener("click", () => {
    form.reset(); control("manualOffset").disabled = true;
    setCity(loadSettings().location); setNow(); selectMode("current"); savePreferences(); calculate();
  });
  const csv = () => exportCSV(snapshot.rows, { generatedAt: snapshot.generatedAt, referenceTime: snapshot.referenceTime });
  get("[data-csv]").addEventListener("click", () => { if (snapshot) downloadCSV(csv(), `indian-ephemeris-${snapshot.rows[0].date}${snapshot.mode === "month" ? "-monthly" : ""}.csv`); });
  get("[data-copy]").addEventListener("click", async () => {
    if (!snapshot) return;
    try { await navigator.clipboard.writeText(csv()); setStatus("Table copied as CSV, including calculation metadata."); }
    catch (_) { setStatus("Clipboard access unavailable. Use Download CSV instead.", "error"); }
  });
  get("[data-print]").addEventListener("click", () => { if (snapshot) window.print(); });
  get("[data-share]").addEventListener("click", async () => {
    if (!snapshot) return;
    const { civil: c, result: r } = snapshot.rows[0];
    const url = new URL(location.href); url.search = ""; url.hash = "";
    for (const [key, value] of Object.entries({ date: c.date, time: c.time, timezone: c.timezone, ayanamsha: r.ayanamshaKey, node: r.nodeMode })) url.searchParams.set(key, value);
    if (c.manualOffset !== null) url.searchParams.set("offset", c.manualOffset);
    if (r.modern.length) url.searchParams.set("modern", "1");
    if (r.houses) url.searchParams.set("houses", r.houses.system);
    const locationRequired = r.observerMode === "topocentric" || Boolean(r.lagna);
    if (locationRequired && !get("[data-share-location]").checked) { setStatus("This result depends on location. Check Include coordinates to share it reproducibly.", "error"); return; }
    if (get("[data-share-location]").checked) {
      for (const [param, key] of [["lat", "latitude"], ["lon", "longitude"], ["alt", "altitude"]]) if (r.settings[key] !== null) url.searchParams.set(param, r.settings[key]);
      url.searchParams.set("observer", r.observerMode);
      if (r.lagna) url.searchParams.set("lagna", "1");
    }
    try { await navigator.clipboard.writeText(url.href); setStatus(snapshot.mode === "month" ? "Link copied for the first monthly sample (date/time view)." : "Calculation link copied."); }
    catch (_) { setStatus(`Share link: ${url.href}`); }
  });
  // Dispose on Material instant navigation. A return visit initializes a fresh
  // page/worker, avoiding detached observers and background calculations.
  const unsubscribe = subscribeSettings((next) => {
    if (!root.isConnected || settingsEqual(canonical, next)) return;
    const locationChanged = !settingsEqual({ ...canonical, convention: next.convention }, next);
    canonical = next;
    if (!locationChanged) return;
    locationControls.cancel();
    invalidate();
    setCity(next.location);
    locationControls.show(next.location);
    calculate();
  });
  cleanupObserver = new MutationObserver(() => {
    if (root.isConnected) return;
    unsubscribe();
    locationControls.dispose();
    invalidate();
    cleanupObserver.disconnect();
  });
  cleanupObserver.observe(document.body, { childList: true, subtree: true });
  calculate();
}
