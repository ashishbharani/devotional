/* Lightweight, offline work-title transliteration for the site's selected Indic scripts. */
(() => {
  "use strict";

  const LANGUAGE_SCRIPTS = {
    hi: "devanagari", mr: "devanagari", gu: "gujarati", bn: "bengali", pa: "gurmukhi",
    te: "telugu", kn: "kannada", ml: "malayalam", ta: "tamil",
  };

  const COMMON_WORDS = {
    aarti: "āratī", arti: "āratī", ashtakam: "aṣṭakam", ashtottara: "aṣṭottara",
    bhagavad: "bhagavad", bhagavata: "bhāgavata", bhajan: "bhajana", chalisa: "cālīsā",
    chaleesa: "cālīsā", devi: "devī", dhyana: "dhyāna", durga: "durgā", ganesh: "gaṇeśa",
    ganesha: "gaṇeśa", gayatri: "gāyatrī", geeta: "gītā", gita: "gītā", hanuman: "hanumān",
    kavach: "kavaca", kavacha: "kavaca", kirtan: "kīrtana", krishna: "kṛṣṇa",
    lakshmi: "lakṣmī", laxmi: "lakṣmī", mahatmya: "māhātmya", mantra: "mantra",
    namavali: "nāmāvalī", narasimha: "narasiṃha", parayan: "pārāyaṇa", path: "pāṭha",
    pooja: "pūjā", prarthana: "prārthanā", puja: "pūjā", purana: "purāṇa", raksha: "rakṣā", ram: "rāma",
    rama: "rāma", sahasranama: "sahasranāma", shiva: "śiva", shiv: "śiva", shloka: "śloka",
    shri: "śrī", sloka: "śloka", stotra: "stotra", stotram: "stotram", stuti: "stuti",
    suktam: "sūktam", upanishad: "upaniṣad", vandana: "vandanā", veda: "veda",
    venkateshwara: "veṅkaṭeśvara", venkateswara: "veṅkaṭeśvara", vishnu: "viṣṇu",
  };

  const SCRIPTS = {
    devanagari: {
      vowels: { a: "अ", A: "आ", i: "इ", I: "ई", u: "उ", U: "ऊ", R: "ऋ", e: "ए", ai: "ऐ", o: "ओ", au: "औ" },
      marks: { a: "", A: "ा", i: "ि", I: "ी", u: "ु", U: "ू", R: "ृ", e: "े", ai: "ै", o: "ो", au: "ौ" },
      consonants: { k: "क", kh: "ख", g: "ग", gh: "घ", G: "ङ", c: "च", ch: "छ", j: "ज", jh: "झ", J: "ञ", T: "ट", Th: "ठ", D: "ड", Dh: "ढ", N: "ण", t: "त", th: "थ", d: "द", dh: "ध", n: "न", p: "प", ph: "फ", b: "ब", bh: "भ", m: "म", y: "य", r: "र", l: "ल", L: "ळ", v: "व", z: "श", S: "ष", s: "स", h: "ह" },
      virama: "्", anusvara: "ं", visarga: "ः",
    },
    bengali: {
      vowels: { a: "অ", A: "আ", i: "ই", I: "ঈ", u: "উ", U: "ঊ", R: "ঋ", e: "এ", ai: "ঐ", o: "ও", au: "ঔ" },
      marks: { a: "", A: "া", i: "ি", I: "ী", u: "ু", U: "ূ", R: "ৃ", e: "ে", ai: "ৈ", o: "ো", au: "ৌ" },
      consonants: { k: "ক", kh: "খ", g: "গ", gh: "ঘ", G: "ঙ", c: "চ", ch: "ছ", j: "জ", jh: "ঝ", J: "ঞ", T: "ট", Th: "ঠ", D: "ড", Dh: "ঢ", N: "ণ", t: "ত", th: "থ", d: "দ", dh: "ধ", n: "ন", p: "প", ph: "ফ", b: "ব", bh: "ভ", m: "ম", y: "য", r: "র", l: "ল", L: "ল", v: "ব", z: "শ", S: "ষ", s: "স", h: "হ" },
      virama: "্", anusvara: "ং", visarga: "ঃ",
    },
    gujarati: {
      vowels: { a: "અ", A: "આ", i: "ઇ", I: "ઈ", u: "ઉ", U: "ઊ", R: "ઋ", e: "એ", ai: "ઐ", o: "ઓ", au: "ઔ" },
      marks: { a: "", A: "ા", i: "િ", I: "ી", u: "ુ", U: "ૂ", R: "ૃ", e: "ે", ai: "ૈ", o: "ો", au: "ૌ" },
      consonants: { k: "ક", kh: "ખ", g: "ગ", gh: "ઘ", G: "ઙ", c: "ચ", ch: "છ", j: "જ", jh: "ઝ", J: "ઞ", T: "ટ", Th: "ઠ", D: "ડ", Dh: "ઢ", N: "ણ", t: "ત", th: "થ", d: "દ", dh: "ધ", n: "ન", p: "પ", ph: "ફ", b: "બ", bh: "ભ", m: "મ", y: "ય", r: "ર", l: "લ", L: "ળ", v: "વ", z: "શ", S: "ષ", s: "સ", h: "હ" },
      virama: "્", anusvara: "ં", visarga: "ઃ",
    },
    gurmukhi: {
      vowels: { a: "ਅ", A: "ਆ", i: "ਇ", I: "ਈ", u: "ਉ", U: "ਊ", R: "ਰਿ", e: "ਏ", ai: "ਐ", o: "ਓ", au: "ਔ" },
      marks: { a: "", A: "ਾ", i: "ਿ", I: "ੀ", u: "ੁ", U: "ੂ", R: "੍ਰਿ", e: "ੇ", ai: "ੈ", o: "ੋ", au: "ੌ" },
      consonants: { k: "ਕ", kh: "ਖ", g: "ਗ", gh: "ਘ", G: "ਙ", c: "ਚ", ch: "ਛ", j: "ਜ", jh: "ਝ", J: "ਞ", T: "ਟ", Th: "ਠ", D: "ਡ", Dh: "ਢ", N: "ਣ", t: "ਤ", th: "ਥ", d: "ਦ", dh: "ਧ", n: "ਨ", p: "ਪ", ph: "ਫ", b: "ਬ", bh: "ਭ", m: "ਮ", y: "ਯ", r: "ਰ", l: "ਲ", L: "ਲ਼", v: "ਵ", z: "ਸ਼", S: "ਸ਼", s: "ਸ", h: "ਹ" },
      virama: "੍", anusvara: "ਂ", visarga: "ਃ",
    },
    telugu: {
      vowels: { a: "అ", A: "ఆ", i: "ఇ", I: "ఈ", u: "ఉ", U: "ఊ", R: "ఋ", e: "ఏ", ai: "ఐ", o: "ఓ", au: "ఔ" },
      marks: { a: "", A: "ా", i: "ి", I: "ీ", u: "ు", U: "ూ", R: "ృ", e: "ే", ai: "ై", o: "ో", au: "ౌ" },
      consonants: { k: "క", kh: "ఖ", g: "గ", gh: "ఘ", G: "ఙ", c: "చ", ch: "ఛ", j: "జ", jh: "ఝ", J: "ఞ", T: "ట", Th: "ఠ", D: "డ", Dh: "ఢ", N: "ణ", t: "త", th: "థ", d: "ద", dh: "ధ", n: "న", p: "ప", ph: "ఫ", b: "బ", bh: "భ", m: "మ", y: "య", r: "ర", l: "ల", L: "ళ", v: "వ", z: "శ", S: "ష", s: "స", h: "హ" },
      virama: "్", anusvara: "ం", visarga: "ః",
    },
    kannada: {
      vowels: { a: "ಅ", A: "ಆ", i: "ಇ", I: "ಈ", u: "ಉ", U: "ಊ", R: "ಋ", e: "ಏ", ai: "ಐ", o: "ಓ", au: "ಔ" },
      marks: { a: "", A: "ಾ", i: "ಿ", I: "ೀ", u: "ು", U: "ೂ", R: "ೃ", e: "ೇ", ai: "ೈ", o: "ೋ", au: "ೌ" },
      consonants: { k: "ಕ", kh: "ಖ", g: "ಗ", gh: "ಘ", G: "ಙ", c: "ಚ", ch: "ಛ", j: "ಜ", jh: "ಝ", J: "ಞ", T: "ಟ", Th: "ಠ", D: "ಡ", Dh: "ಢ", N: "ಣ", t: "ತ", th: "ಥ", d: "ದ", dh: "ಧ", n: "ನ", p: "ಪ", ph: "ಫ", b: "ಬ", bh: "ಭ", m: "ಮ", y: "ಯ", r: "ರ", l: "ಲ", L: "ಳ", v: "ವ", z: "ಶ", S: "ಷ", s: "ಸ", h: "ಹ" },
      virama: "್", anusvara: "ಂ", visarga: "ಃ",
    },
    malayalam: {
      vowels: { a: "അ", A: "ആ", i: "ഇ", I: "ഈ", u: "ഉ", U: "ഊ", R: "ഋ", e: "ഏ", ai: "ഐ", o: "ഓ", au: "ഔ" },
      marks: { a: "", A: "ാ", i: "ി", I: "ീ", u: "ു", U: "ൂ", R: "ൃ", e: "േ", ai: "ൈ", o: "ോ", au: "ൌ" },
      consonants: { k: "ക", kh: "ഖ", g: "ഗ", gh: "ഘ", G: "ങ", c: "ച", ch: "ഛ", j: "ജ", jh: "ഝ", J: "ഞ", T: "ട", Th: "ഠ", D: "ഡ", Dh: "ഢ", N: "ണ", t: "ത", th: "ഥ", d: "ദ", dh: "ധ", n: "ന", p: "പ", ph: "ഫ", b: "ബ", bh: "ഭ", m: "മ", y: "യ", r: "ര", l: "ല", L: "ള", v: "വ", z: "ശ", S: "ഷ", s: "സ", h: "ഹ" },
      virama: "്", anusvara: "ം", visarga: "ഃ",
    },
    tamil: {
      vowels: { a: "அ", A: "ஆ", i: "இ", I: "ஈ", u: "உ", U: "ஊ", R: "ரு", e: "ஏ", ai: "ஐ", o: "ஓ", au: "ஔ" },
      marks: { a: "", A: "ா", i: "ி", I: "ீ", u: "ு", U: "ூ", R: "்ரு", e: "ே", ai: "ை", o: "ோ", au: "ௌ" },
      consonants: { k: "க", kh: "க", g: "க", gh: "க", G: "ங", c: "ச", ch: "ச", j: "ஜ", jh: "ஜ", J: "ஞ", T: "ட", Th: "ட", D: "ட", Dh: "ட", N: "ண", t: "த", th: "த", d: "த", dh: "த", n: "ந", p: "ப", ph: "ப", b: "ப", bh: "ப", m: "ம", y: "ய", r: "ர", l: "ல", L: "ள", v: "வ", z: "ஶ", S: "ஷ", s: "ஸ", h: "ஹ" },
      virama: "்", anusvara: "ம்", visarga: "ஃ",
    },
  };

  const TOKEN_RULES = [
    ["kṣ", ["k", "S"]], ["ksh", ["k", "S"]], ["jñ", ["j", "J"]], ["gny", ["j", "J"]],
    ["chh", ["ch"]], ["ṭh", ["Th"]], ["ḍh", ["Dh"]], ["kh", ["kh"]], ["gh", ["gh"]],
    ["jh", ["jh"]], ["th", ["th"]], ["dh", ["dh"]], ["ph", ["ph"]], ["bh", ["bh"]],
    ["aa", ["A"]], ["ee", ["I"]], ["ii", ["I"]], ["oo", ["U"]], ["uu", ["U"]],
    ["ai", ["ai"]], ["au", ["au"]], ["ng", ["G"]], ["ny", ["J"]], ["sh", ["z"]],
    ["gy", ["j", "J"]], ["ā", ["A"]], ["ī", ["I"]], ["ū", ["U"]], ["ṛ", ["R"]],
    ["ṝ", ["R"]], ["ṅ", ["G"]], ["ñ", ["J"]], ["ṭ", ["T"]], ["ḍ", ["D"]],
    ["ṇ", ["N"]], ["ś", ["z"]], ["ṣ", ["S"]], ["ḷ", ["L"]], ["ṃ", ["M"]],
    ["ṁ", ["M"]], ["ḥ", ["H"]],
  ];
  const VOWELS = new Set(["a", "A", "i", "I", "u", "U", "R", "e", "ai", "o", "au"]);
  const CONSONANTS = new Set(["k", "kh", "g", "gh", "G", "c", "ch", "j", "jh", "J", "T", "Th", "D", "Dh", "N", "t", "th", "d", "dh", "n", "p", "ph", "b", "bh", "m", "y", "r", "l", "L", "v", "z", "S", "s", "h"]);
  const cache = new Map();

  function normalizedKey(word) {
    return word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  }

  function tokensFor(word) {
    const source = COMMON_WORDS[normalizedKey(word)] || word.toLowerCase().normalize("NFC");
    const tokens = [];
    for (let i = 0; i < source.length;) {
      let matched = false;
      for (const [roman, values] of TOKEN_RULES) {
        if (source.startsWith(roman, i)) {
          tokens.push(...values);
          i += roman.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      const char = source[i++];
      if ("aiueo".includes(char)) tokens.push(char);
      else if (char === "c") tokens.push("c");
      else if (char === "q") tokens.push("k");
      else if (char === "f") tokens.push("ph");
      else if (char === "w") tokens.push("v");
      else if (char === "x") tokens.push("k", "s");
      else if (char === "z") tokens.push("j");
      else if (CONSONANTS.has(char)) tokens.push(char);
      else tokens.push({ literal: char });
    }
    return tokens;
  }

  function renderWord(word, script) {
    if (!/[A-Za-zāīūṛṝṅñṭḍṇśṣḷṃṁḥ]/u.test(word)) return word;
    let output = "";
    let pendingConsonant = false;
    for (const token of tokensFor(word)) {
      if (typeof token === "object") {
        output += token.literal;
        pendingConsonant = false;
      } else if (CONSONANTS.has(token)) {
        if (pendingConsonant) output += script.virama;
        output += script.consonants[token];
        pendingConsonant = true;
      } else if (VOWELS.has(token)) {
        output += pendingConsonant ? script.marks[token] : script.vowels[token];
        pendingConsonant = false;
      } else if (token === "M") {
        output += script.anusvara;
        pendingConsonant = false;
      } else if (token === "H") {
        output += script.visarga;
        pendingConsonant = false;
      }
    }
    return output;
  }

  function transliterate(title, language) {
    const scriptName = LANGUAGE_SCRIPTS[language];
    if (!scriptName || !title) return title;
    const key = `${language}\u0000${title}`;
    if (cache.has(key)) return cache.get(key);
    const script = SCRIPTS[scriptName];
    const result = title.replace(/[\p{L}\p{M}]+/gu, (word) => renderWord(word, script));
    cache.set(key, result);
    return result;
  }

  window.abpTransliterate = { transliterate, languages: new Set(Object.keys(LANGUAGE_SCRIPTS)) };
})();
