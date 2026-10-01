/* Private, browser-only Japa / Devotional Counter. */
(() => {
  "use strict";

  const KEY = "abp-japa-state-v1";
  const MALA_SIZE = 108;
  const MAX_TARGET = 1_000_000_000;
  const t = (key) => window.abpI18n ? window.abpI18n.t(key) : key;

  function localDay() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function freshState() {
    return { name: "", count: 0, target: 108, today: 0, day: localDay(), haptic: false, sound: false, canUndo: false };
  }

  function readState() {
    let state = freshState();
    try { state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (error) { /* private browsing */ }
    state.count = Math.max(0, Math.floor(Number(state.count) || 0));
    state.target = Math.min(MAX_TARGET, Math.max(1, Math.floor(Number(state.target) || 108)));
    state.today = Math.max(0, Math.floor(Number(state.today) || 0));
    if (state.day !== localDay()) {
      state.day = localDay();
      state.today = 0;
      state.canUndo = false;
    }
    return state;
  }

  function initJapa() {
    const root = document.getElementById("abp-japa");
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";

    const byId = (id) => root.querySelector(`#${id}`);
    const name = byId("abp-japa-name");
    const count = byId("abp-japa-count");
    const malas = byId("abp-japa-malas");
    const remainder = byId("abp-japa-remainder");
    const today = byId("abp-japa-today");
    const tap = byId("abp-japa-tap");
    const progress = byId("abp-japa-progress");
    const progressText = byId("abp-japa-progress-text");
    const custom = byId("abp-japa-custom");
    const haptic = byId("abp-japa-haptic");
    const sound = byId("abp-japa-sound");
    const undo = byId("abp-japa-undo");
    const dialog = byId("abp-japa-dialog");
    const dialogMessage = byId("abp-japa-dialog-message");
    const announcement = byId("abp-japa-announcement");
    let state = readState();
    let pendingAction = null;
    let audioContext = null;

    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (error) { /* private browsing */ }
    }

    function render() {
      count.textContent = state.count.toLocaleString();
      malas.textContent = Math.floor(state.count / MALA_SIZE).toLocaleString();
      remainder.textContent = `${state.count % MALA_SIZE} / ${MALA_SIZE}`;
      today.textContent = state.today.toLocaleString();
      progress.max = state.target;
      progress.value = Math.min(state.count, state.target);
      progressText.textContent = `${state.count.toLocaleString()} / ${state.target.toLocaleString()}`;
      name.value = state.name;
      custom.value = state.target;
      haptic.checked = !!state.haptic;
      sound.checked = !!state.sound;
      undo.disabled = !state.canUndo || state.count === 0;
      root.querySelectorAll("[data-target]").forEach((button) => {
        button.setAttribute("aria-pressed", String(Number(button.dataset.target) === state.target));
      });
      tap.classList.toggle("is-complete", state.count >= state.target);
      tap.setAttribute("aria-label", `${t("tapToCount")}. ${t("currentCount")}: ${state.count.toLocaleString()}`);
    }

    function beep() {
      if (!state.sound) return;
      try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === "suspended") audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.frequency.value = 520;
        gain.gain.setValueAtTime(0.035, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.08);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.08);
      } catch (error) { /* audio is an optional enhancement */ }
    }

    function addOne() {
      if (state.day !== localDay()) {
        state.day = localDay();
        state.today = 0;
      }
      state.count += 1;
      state.today += 1;
      state.canUndo = true;
      save();
      render();
      announcement.textContent = `${t("currentCount")}: ${state.count.toLocaleString()}`;
      if (state.haptic && navigator.vibrate) navigator.vibrate(18);
      beep();
    }

    function setTarget(value) {
      const parsed = Math.floor(Number(value));
      if (!Number.isFinite(parsed) || parsed < 1) return;
      state.target = Math.min(MAX_TARGET, parsed);
      save();
      render();
    }

    function ask(action, messageKey) {
      pendingAction = action;
      dialogMessage.textContent = t(messageKey);
      dialog.showModal ? dialog.showModal() : dialog.setAttribute("open", "");
    }

    tap.addEventListener("click", addOne);
    name.addEventListener("change", () => { state.name = name.value.trim(); save(); });
    root.querySelectorAll("[data-target]").forEach((button) => button.addEventListener("click", () => setTarget(button.dataset.target)));
    byId("abp-japa-set-target").addEventListener("click", () => setTarget(custom.value));
    custom.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); setTarget(custom.value); } });
    haptic.addEventListener("change", () => { state.haptic = haptic.checked; save(); });
    sound.addEventListener("change", () => { state.sound = sound.checked; save(); });
    undo.addEventListener("click", () => {
      if (!state.canUndo || state.count < 1) return;
      state.count -= 1;
      if (state.day === localDay() && state.today > 0) state.today -= 1;
      state.canUndo = false;
      save();
      render();
      announcement.textContent = t("lastTapUndone");
    });
    byId("abp-japa-fresh").addEventListener("click", () => ask("fresh", "freshQuestion"));
    byId("abp-japa-reset").addEventListener("click", () => ask("reset", "resetQuestion"));
    dialog.querySelector("[data-cancel]").addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-confirm]").addEventListener("click", () => {
      if (pendingAction === "fresh") {
        state.count = 0;
        state.canUndo = false;
      } else if (pendingAction === "reset") {
        state = { ...freshState(), name: state.name, target: state.target, haptic: state.haptic, sound: state.sound };
      }
      pendingAction = null;
      save();
      render();
      dialog.close();
    });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    document.addEventListener("abp-languagechange", render);
    render();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") window.document$.subscribe(initJapa);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initJapa);
  else initJapa();
})();
