const TITHI_MARKERS = new Map([
  [10, "Ekadashi Tithi"],
  [14, "Purnima Tithi"],
  [25, "Ekadashi Tithi"],
  [29, "Amavasya Tithi"],
]);

export const FESTIVAL_POLICY_NOTE = "Festival dates are rule-based and can vary by sampradaya, region and local observance convention.";

export function applyFestivalRules(rawFestivals, sunriseTithi) {
  const festivals = (Array.isArray(rawFestivals) ? rawFestivals : [])
    // Multi-day package spans remain excluded. Their day-numbering has not
    // been independently validated against this site's sunrise-day model.
    .filter((festival) => festival?.type !== "span" && festival?.name)
    .map((festival) => ({
      ...festival,
      source: "bundled-rule-engine",
      validation: "rule-based-regional-review-advised",
    }));
  const observances = [];
  const marker = TITHI_MARKERS.get(sunriseTithi);
  if (marker) {
    observances.push({
      name: marker,
      source: "sunrise-tithi",
      validation: "astronomical-marker-not-a-festival-ruling",
    });
  }
  const seen = new Set();
  return {
    festivals: festivals.filter((item) => !seen.has(item.name) && seen.add(item.name)),
    observances: observances.filter((item) => !seen.has(item.name) && seen.add(item.name)),
  };
}

export function observanceNames(day) {
  return [...(day.festivals || []), ...(day.observances || [])].map((item) => item.name);
}
