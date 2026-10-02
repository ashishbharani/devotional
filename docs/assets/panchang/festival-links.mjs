const RULES = [
  { match: /ekadashi/i, links: [["Ekadashi observance cycle", "categories/07-festivals-vratas-jayantis-and-observances/ekadashi-observance-cycle/"], ["Vishnu devotional works", "categories/01-major-deities-and-supreme-forms/vishnu/"]], significance: "Vishnu worship, fasting and devotional remembrance" },
  { match: /shivaratri|shiva ratri/i, links: [["Maha Shivaratri collection", "categories/07-festivals-vratas-jayantis-and-observances/maha-shivaratri/"], ["Shiva devotional works", "categories/01-major-deities-and-supreme-forms/shiva-mahesh/"]], significance: "worship of Shiva, vigil and contemplative prayer" },
  { match: /navaratri|durga puja/i, links: [["Navaratri and Durga Puja", "categories/07-festivals-vratas-jayantis-and-observances/navaratri-durga-puja/"], ["Durga devotional works", "categories/01-major-deities-and-supreme-forms/durga/"]], significance: "devotion to the Divine Mother in her revered forms" },
  { match: /janmashtami|krishna/i, links: [["Krishna devotional works", "categories/01-major-deities-and-supreme-forms/krishna/"]], significance: "devotion to Shri Krishna" },
  { match: /ram navami|rama navami/i, links: [["Rama devotional works", "categories/01-major-deities-and-supreme-forms/rama/"]], significance: "devotion to Shri Rama" },
  { match: /ganesh|ganesh chaturthi|vinayaka/i, links: [["Ganesha devotional works", "categories/01-major-deities-and-supreme-forms/ganesha/"]], significance: "worship of Shri Ganesha" },
  { match: /hanuman/i, links: [["Hanuman devotional works", "categories/01-major-deities-and-supreme-forms/hanuman/"]], significance: "devotion to Hanuman and remembrance of steadfast service" },
  { match: /purnima|full moon/i, links: [["Sacred-calendar devotional cycles", "categories/28-daily-weekly-monthly-seasonal-and-sacred-calendar-devotional-cycles/"]], significance: "full-moon observances, with practice varying by tradition" },
  { match: /amavasya|new moon|shraddha|pitru/i, links: [["Festivals, vratas and observances", "categories/07-festivals-vratas-jayantis-and-observances/"], ["Sacred-calendar devotional cycles", "categories/28-daily-weekly-monthly-seasonal-and-sacred-calendar-devotional-cycles/"]], significance: "new-moon observance or remembrance of ancestors, according to family tradition" },
  { match: /sankranti/i, links: [["Sacred-calendar devotional cycles", "categories/28-daily-weekly-monthly-seasonal-and-sacred-calendar-devotional-cycles/"], ["Jyotisha and astral traditions", "categories/35-jyotisha-navagraha-nakshatra-and-astral-devotional-traditions/"]], significance: "a solar transition observed in regional traditions" },
];

export function devotionalContext(festivals, tithiName = "") {
  const text = [...festivals.map((festival) => festival.name || ""), tithiName].join(" | ");
  const matches = RULES.filter((rule) => rule.match.test(text));
  const links = [];
  const seen = new Set();
  for (const rule of matches) {
    for (const [label, path] of rule.links) {
      if (!seen.has(path)) {
        links.push({ label, path });
        seen.add(path);
      }
    }
  }
  return { links, significance: matches[0]?.significance || "" };
}

export const GENERAL_LINKS = Object.freeze([
  { label: "Festivals, Vratas, Jayantis & Observances", path: "categories/07-festivals-vratas-jayantis-and-observances/" },
  { label: "Sacred-calendar devotional cycles", path: "categories/28-daily-weekly-monthly-seasonal-and-sacred-calendar-devotional-cycles/" },
  { label: "Jyotisha, Navagraha & Nakshatra traditions", path: "categories/35-jyotisha-navagraha-nakshatra-and-astral-devotional-traditions/" },
]);

