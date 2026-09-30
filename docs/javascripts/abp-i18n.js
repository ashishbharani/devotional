/* Native interface translations for the 22 languages in India's Eighth Schedule. */
(() => {
  "use strict";

  const STORAGE_KEY = "abp-language";
  const RTL = new Set(["ks", "sd", "ur"]);
  const store = {
    get: () => { try { return localStorage.getItem(STORAGE_KEY); } catch (error) { return null; } },
    set: (value) => { try { localStorage.setItem(STORAGE_KEY, value); } catch (error) { /* private browsing */ } },
  };
  const en = {
    language: "Language", home: "Home", index: "Integrated Master Index",
    library: "Scriptures & Books Library", find: "Find a Work", foreword: "Foreword",
    previous: "Previous", top: "Top", next: "Next", search: "Search", close: "Close",
    original: "Original", works: "works", categories: "categories", sections: "sections",
    form: "Form", tier: "Tier", foundIn: "Found in", all: "All", loading: "Loading…",
    showMore: "Show more results",
  };

  const locales = {
    en: { name: "English", strings: en },
    as: { name: "অসমীয়া", strings: { language: "ভাষা", home: "মূলপৃষ্ঠা", index: "সূচী", library: "পুথিভঁৰাল", find: "ৰচনা বিচাৰক", foreword: "পাতনি", previous: "পূৰ্বৱৰ্তী", top: "ওপৰলৈ", next: "পৰৱৰ্তী", search: "সন্ধান", close: "বন্ধ কৰক", original: "মূল", works: "ৰচনা", categories: "শ্ৰেণী", sections: "বিভাগ", form: "ৰূপ", tier: "স্তৰ", foundIn: "ইয়াত আছে", all: "সকলো", loading: "লোড হৈ আছে…", showMore: "আৰু ফলাফল দেখুৱাওক" } },
    bn: { name: "বাংলা", strings: { language: "ভাষা", home: "প্রথম পাতা", index: "সূচি", library: "গ্রন্থাগার", find: "রচনা খুঁজুন", foreword: "ভূমিকা", previous: "পূর্ববর্তী", top: "উপরে", next: "পরবর্তী", search: "অনুসন্ধান", close: "বন্ধ করুন", original: "মূল", works: "রচনা", categories: "বিভাগ", sections: "অংশ", form: "রূপ", tier: "স্তর", foundIn: "যেখানে আছে", all: "সব", loading: "লোড হচ্ছে…", showMore: "আরও ফলাফল দেখুন" } },
    brx: { name: "बर’ राव", strings: { language: "राव", home: "गुदि बिलाइ", index: "फारिलाइ", library: "बिजाब बाख्रि", find: "मेथाइ नागिर", foreword: "सिगांनि बाथ्रा", previous: "सिगांनि", top: "बिजौ", next: "उननि", search: "नागिर", close: "बन्द खालाम", original: "गुदि", works: "मेथाइ", categories: "थाखो", sections: "खोन्दो", form: "महर", tier: "थाखो", foundIn: "बेयाव दं", all: "गासै", loading: "ल'ड जायगासिनो…", showMore: "गोबां फिथाइ दिन्थि" } },
    doi: { name: "डोगरी", strings: { language: "भाशा", home: "मुक्ख सफा", index: "सूची", library: "कताबघर", find: "रचना तुप्पो", foreword: "प्रस्तावना", previous: "पिछला", top: "उप्पर", next: "अगला", search: "खोज", close: "बंद करो", original: "मूल", works: "रचनां", categories: "श्रेणियां", sections: "खंड", form: "रूप", tier: "स्तर", foundIn: "इत्थै", all: "सब्भै", loading: "लोड होआ करदा ऐ…", showMore: "होर नतीजे दस्सो" } },
    gu: { name: "ગુજરાતી", strings: { language: "ભાષા", home: "મુખ્ય પાનું", index: "સૂચિ", library: "પુસ્તકાલય", find: "રચના શોધો", foreword: "પ્રસ્તાવના", previous: "પાછલું", top: "ઉપર", next: "આગળ", search: "શોધો", close: "બંધ કરો", original: "મૂળ", works: "રચનાઓ", categories: "શ્રેણીઓ", sections: "વિભાગો", form: "રૂપ", tier: "સ્તર", foundIn: "અહીં મળે છે", all: "બધા", loading: "લોડ થઈ રહ્યું છે…", showMore: "વધુ પરિણામો બતાવો" } },
    hi: { name: "हिन्दी", strings: { language: "भाषा", home: "मुख्य पृष्ठ", index: "अनुक्रमणिका", library: "पुस्तकालय", find: "रचना खोजें", foreword: "भूमिका", previous: "पिछला", top: "ऊपर", next: "अगला", search: "खोजें", close: "बंद करें", original: "मूल", works: "रचनाएँ", categories: "श्रेणियाँ", sections: "खंड", form: "रूप", tier: "स्तर", foundIn: "यहाँ मिला", all: "सभी", loading: "लोड हो रहा है…", showMore: "और परिणाम दिखाएँ" } },
    kn: { name: "ಕನ್ನಡ", strings: { language: "ಭಾಷೆ", home: "ಮುಖಪುಟ", index: "ಸೂಚಿ", library: "ಗ್ರಂಥಾಲಯ", find: "ಕೃತಿ ಹುಡುಕಿ", foreword: "ಮುನ್ನುಡಿ", previous: "ಹಿಂದಿನ", top: "ಮೇಲೆ", next: "ಮುಂದಿನ", search: "ಹುಡುಕಿ", close: "ಮುಚ್ಚಿ", original: "ಮೂಲ", works: "ಕೃತಿಗಳು", categories: "ವರ್ಗಗಳು", sections: "ವಿಭಾಗಗಳು", form: "ರೂಪ", tier: "ಹಂತ", foundIn: "ಇಲ್ಲಿ ಇದೆ", all: "ಎಲ್ಲಾ", loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…", showMore: "ಇನ್ನಷ್ಟು ಫಲಿತಾಂಶಗಳು" } },
    ks: { name: "کٲشُر", strings: { language: "زَبان", home: "مُکھ صفحہ", index: "فہرست", library: "کُتب خانہ", find: "کلام ژھانڈِو", foreword: "پیش لفظ", previous: "پَتِم", top: "ہیور", next: "اَگلا", search: "تلاش", close: "بند کٔرِو", original: "اصل", works: "کلام", categories: "قسمہٕ", sections: "حصہٕ", form: "شکل", tier: "درجہ", foundIn: "یَتھ مِلیو", all: "تمام", loading: "لوڈ گژھان…", showMore: "مزید نتیجہٕ ہٲیو" } },
    kok: { name: "कोंकणी", strings: { language: "भास", home: "मुखेल पान", index: "वळेरी", library: "ग्रंथालय", find: "रचना सोदात", foreword: "प्रस्तावना", previous: "फाटलें", top: "वयर", next: "मुखार", search: "सोद", close: "बंद करात", original: "मूळ", works: "रचना", categories: "वर्ग", sections: "विभाग", form: "रूप", tier: "पांवडो", foundIn: "हांगा आसा", all: "सगळें", loading: "लोड जाता…", showMore: "आनीक निकाल दाखयात" } },
    mai: { name: "मैथिली", strings: { language: "भाषा", home: "मुख्य पृष्ठ", index: "अनुक्रमणिका", library: "पुस्तकालय", find: "रचना खोजू", foreword: "भूमिका", previous: "पछिला", top: "ऊपर", next: "अगिला", search: "खोजू", close: "बन्द करू", original: "मूल", works: "रचना", categories: "श्रेणी", sections: "खंड", form: "रूप", tier: "स्तर", foundIn: "एतय भेटल", all: "सभ", loading: "लोड भऽ रहल अछि…", showMore: "आओर परिणाम देखाउ" } },
    ml: { name: "മലയാളം", strings: { language: "ഭാഷ", home: "ഹോം", index: "സൂചിക", library: "ഗ്രന്ഥശാല", find: "കൃതി കണ്ടെത്തുക", foreword: "ആമുഖം", previous: "മുമ്പത്തെ", top: "മുകളിൽ", next: "അടുത്തത്", search: "തിരയുക", close: "അടയ്ക്കുക", original: "മൂലം", works: "കൃതികൾ", categories: "വിഭാഗങ്ങൾ", sections: "ഭാഗങ്ങൾ", form: "രൂപം", tier: "നില", foundIn: "ഇവിടെ കാണാം", all: "എല്ലാം", loading: "ലോഡ് ചെയ്യുന്നു…", showMore: "കൂടുതൽ ഫലങ്ങൾ" } },
    mni: { name: "ꯃꯤꯇꯩ ꯂꯣꯟ", strings: { language: "ꯂꯣꯟ", home: "ꯃꯔꯨ ꯂꯃꯥꯏ", index: "ꯃꯤꯡ ꯄꯔꯦꯡ", library: "ꯂꯥꯏꯔꯤꯛ ꯂꯥꯏꯁꯪ", find: "ꯔꯆꯅꯥ ꯊꯤꯕꯤꯌꯨ", foreword: "ꯃꯃꯥꯡ ꯋꯥꯔꯤ", previous: "ꯃꯃꯥꯡꯒꯤ", top: "ꯃꯊꯛꯇ", next: "ꯃꯊꯪꯒꯤ", search: "ꯊꯤꯕ", close: "ꯂꯣꯏꯁꯤꯟꯕ", original: "ꯃꯔꯨ", works: "ꯔꯆꯅꯥ", categories: "ꯃꯈꯜ", sections: "ꯁꯔꯨꯛ", form: "ꯃꯑꯣꯡ", tier: "ꯊꯥꯛ", foundIn: "ꯃꯐꯝ", all: "ꯄꯨꯝꯅꯃꯛ", loading: "ꯂꯣꯗ ꯇꯧꯔꯤ…", showMore: "ꯍꯦꯟꯅꯥ ꯎꯠꯄꯤꯌꯨ" } },
    mr: { name: "मराठी", strings: { language: "भाषा", home: "मुख्यपृष्ठ", index: "अनुक्रमणिका", library: "ग्रंथालय", find: "रचना शोधा", foreword: "प्रस्तावना", previous: "मागील", top: "वर", next: "पुढील", search: "शोधा", close: "बंद करा", original: "मूळ", works: "रचना", categories: "श्रेणी", sections: "विभाग", form: "प्रकार", tier: "स्तर", foundIn: "येथे आहे", all: "सर्व", loading: "लोड होत आहे…", showMore: "अधिक निकाल दाखवा" } },
    ne: { name: "नेपाली", strings: { language: "भाषा", home: "गृहपृष्ठ", index: "अनुक्रमणिका", library: "पुस्तकालय", find: "रचना खोज्नुहोस्", foreword: "भूमिका", previous: "अघिल्लो", top: "माथि", next: "अर्को", search: "खोज्नुहोस्", close: "बन्द गर्नुहोस्", original: "मूल", works: "रचनाहरू", categories: "श्रेणीहरू", sections: "खण्डहरू", form: "रूप", tier: "तह", foundIn: "यहाँ भेटियो", all: "सबै", loading: "लोड हुँदैछ…", showMore: "थप नतिजा देखाउनुहोस्" } },
    or: { name: "ଓଡ଼ିଆ", strings: { language: "ଭାଷା", home: "ମୁଖ୍ୟ ପୃଷ୍ଠା", index: "ସୂଚୀ", library: "ପୁସ୍ତକାଳୟ", find: "ରଚନା ଖୋଜନ୍ତୁ", foreword: "ଉପକ୍ରମଣିକା", previous: "ପୂର୍ବବର୍ତ୍ତୀ", top: "ଉପରକୁ", next: "ପରବର୍ତ୍ତୀ", search: "ଖୋଜନ୍ତୁ", close: "ବନ୍ଦ କରନ୍ତୁ", original: "ମୂଳ", works: "ରଚନା", categories: "ଶ୍ରେଣୀ", sections: "ବିଭାଗ", form: "ରୂପ", tier: "ସ୍ତର", foundIn: "ଏଠାରେ ମିଳେ", all: "ସମସ୍ତ", loading: "ଲୋଡ୍ ହେଉଛି…", showMore: "ଅଧିକ ଫଳାଫଳ" } },
    pa: { name: "ਪੰਜਾਬੀ", strings: { language: "ਭਾਸ਼ਾ", home: "ਮੁੱਖ ਪੰਨਾ", index: "ਸੂਚੀ", library: "ਪੁਸਤਕਾਲਾ", find: "ਰਚਨਾ ਲੱਭੋ", foreword: "ਭੂਮਿਕਾ", previous: "ਪਿਛਲਾ", top: "ਉੱਪਰ", next: "ਅਗਲਾ", search: "ਖੋਜੋ", close: "ਬੰਦ ਕਰੋ", original: "ਮੂਲ", works: "ਰਚਨਾਵਾਂ", categories: "ਸ਼੍ਰੇਣੀਆਂ", sections: "ਭਾਗ", form: "ਰੂਪ", tier: "ਪੱਧਰ", foundIn: "ਇੱਥੇ ਮਿਲਿਆ", all: "ਸਾਰੇ", loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ…", showMore: "ਹੋਰ ਨਤੀਜੇ ਵੇਖੋ" } },
    sa: { name: "संस्कृतम्", strings: { language: "भाषा", home: "मुखपृष्ठम्", index: "अनुक्रमणिका", library: "पुस्तकालयः", find: "रचनाम् अन्विष्यतु", foreword: "प्रस्तावना", previous: "पूर्वम्", top: "उपरि", next: "परम्", search: "अन्विष्यतु", close: "पिधत्त", original: "मूलम्", works: "रचनाः", categories: "वर्गाः", sections: "खण्डाः", form: "रूपम्", tier: "स्तरः", foundIn: "अत्र लब्धम्", all: "सर्वे", loading: "आरोपणं भवति…", showMore: "अधिकानि परिणामानि दर्शयतु" } },
    sat: { name: "ᱥᱟᱱᱛᱟᱲᱤ", strings: { language: "ᱯᱟᱹᱨᱥᱤ", home: "ᱢᱩᱬᱩᱫ ᱥᱟᱦᱴᱟ", index: "ᱥᱩᱪᱤ", library: "ᱯᱚᱛᱚᱵ ᱚᱲᱟᱜ", find: "ᱚᱱᱚᱲᱦᱮᱸ ᱯᱟᱱᱛᱮ", foreword: "ᱢᱟᱲᱟᱝ ᱨᱚᱲ", previous: "ᱛᱟᱭᱚᱢ", top: "ᱪᱮᱛᱟᱱ", next: "ᱫᱚᱥᱟᱨ", search: "ᱯᱟᱱᱛᱮ", close: "ᱵᱚᱱᱫ", original: "ᱢᱩᱬᱩᱫ", works: "ᱚᱱᱚᱲᱦᱮᱸ", categories: "ᱦᱟᱹᱴᱤᱧ", sections: "ᱦᱟᱹᱴᱤᱧ", form: "ᱨᱩᱯ", tier: "ᱛᱷᱚᱠ", foundIn: "ᱱᱚᱰᱮ", all: "ᱡᱚᱛᱚ", loading: "ᱞᱚᱰᱤᱝ…", showMore: "ᱟᱨᱦᱚᱸ ᱩᱫᱩᱜ" } },
    sd: { name: "سنڌي", strings: { language: "ٻولي", home: "مُک صفحو", index: "فهرست", library: "ڪتب خانو", find: "رچنا ڳوليو", foreword: "پيش لفظ", previous: "پويون", top: "مٿي", next: "اڳيون", search: "ڳوليو", close: "بند ڪريو", original: "اصل", works: "رچنائون", categories: "درجا", sections: "حصا", form: "صورت", tier: "سطح", foundIn: "هتي مليو", all: "سڀ", loading: "لوڊ ٿي رهيو آهي…", showMore: "وڌيڪ نتيجا ڏيکاريو" } },
    ta: { name: "தமிழ்", strings: { language: "மொழி", home: "முகப்பு", index: "அட்டவணை", library: "நூலகம்", find: "படைப்பைத் தேடுக", foreword: "முன்னுரை", previous: "முந்தைய", top: "மேலே", next: "அடுத்த", search: "தேடுக", close: "மூடுக", original: "மூலம்", works: "படைப்புகள்", categories: "வகைகள்", sections: "பிரிவுகள்", form: "வடிவம்", tier: "நிலை", foundIn: "இங்கு உள்ளது", all: "அனைத்தும்", loading: "ஏற்றப்படுகிறது…", showMore: "மேலும் முடிவுகள்" } },
    te: { name: "తెలుగు", strings: { language: "భాష", home: "మొదటి పేజీ", index: "సూచిక", library: "గ్రంథాలయం", find: "రచనను వెతకండి", foreword: "ముందుమాట", previous: "మునుపటి", top: "పైకి", next: "తదుపరి", search: "వెతకండి", close: "మూసివేయండి", original: "మూలం", works: "రచనలు", categories: "వర్గాలు", sections: "విభాగాలు", form: "రూపం", tier: "స్థాయి", foundIn: "ఇక్కడ ఉంది", all: "అన్నీ", loading: "లోడ్ అవుతోంది…", showMore: "మరిన్ని ఫలితాలు" } },
    ur: { name: "اردو", strings: { language: "زبان", home: "سرورق", index: "فہرست", library: "کتب خانہ", find: "کلام تلاش کریں", foreword: "پیش لفظ", previous: "پچھلا", top: "اوپر", next: "اگلا", search: "تلاش کریں", close: "بند کریں", original: "اصل", works: "کلام", categories: "زمرے", sections: "حصے", form: "صورت", tier: "درجہ", foundIn: "یہاں موجود", all: "تمام", loading: "لوڈ ہو رہا ہے…", showMore: "مزید نتائج دکھائیں" } },
  };

  const order = ["en", "as", "bn", "brx", "doi", "gu", "hi", "kn", "ks", "kok", "mai", "ml", "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur"];
  const chromeLabels = new Map([
    ["Home", "home"], ["Foreword", "foreword"], ["Hindu Scriptures & Books Library", "library"],
    ["Integrated Master Index", "index"], ["Find a Work", "find"],
  ]);
  let current = store.get() || "en";
  if (!locales[current]) current = "en";

  const t = (key) => locales[current].strings[key] || en[key] || key;

  function translate(root = document) {
    root.querySelectorAll(".md-nav__link").forEach((node) => {
      const key = chromeLabels.get(node.textContent.trim());
      if (key) node.setAttribute("data-i18n", key);
    });
    root.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = t(node.getAttribute("data-i18n"));
      if (value) node.textContent = value;
    });
    root.querySelectorAll("[data-i18n-aria]").forEach((node) => node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria"))));
    root.querySelectorAll("[data-i18n-title]").forEach((node) => node.setAttribute("title", t(node.getAttribute("data-i18n-title"))));
    root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => node.setAttribute("placeholder", t(node.getAttribute("data-i18n-placeholder"))));
    root.querySelectorAll("[data-i18n-label]").forEach((node) => node.setAttribute("data-label", t(node.getAttribute("data-i18n-label"))));
    root.querySelectorAll("[data-i18n-all]").forEach((node) => { node.textContent = `${t("all")} ${t(node.getAttribute("data-i18n-all"))}`; });
  }

  function applyLanguage(code) {
    current = locales[code] ? code : "en";
    store.set(current);
    document.documentElement.lang = current;
    document.documentElement.dir = RTL.has(current) ? "rtl" : "ltr";
    translate();
    document.querySelectorAll(".abp-language-btn").forEach((button) => {
      button.querySelector("span").textContent = locales[current].name;
      button.setAttribute("aria-label", `${t("language")}: ${locales[current].name}`);
      button.title = `${t("language")}: ${locales[current].name}`;
    });
    document.dispatchEvent(new CustomEvent("abp-languagechange", { detail: { language: current } }));
  }

  function openPicker() {
    const dialog = document.createElement("dialog");
    dialog.className = "abp-language-dialog";
    dialog.setAttribute("aria-labelledby", "abp-language-title");
    dialog.innerHTML =
      `<div class="abp-language-dialog__head"><h2 id="abp-language-title">${t("language")}</h2>` +
      `<button type="button" class="abp-language-dialog__close" aria-label="${t("close")}">×</button></div>` +
      '<p class="abp-language-dialog__note">Interface labels are translated. Devotional titles and publication text stay in their original form.</p>' +
      '<div class="abp-language-grid">' + order.map((code) => {
        const locale = locales[code];
        return `<button type="button" lang="${code}" dir="${RTL.has(code) ? "rtl" : "ltr"}" data-lang="${code}"${code === current ? ' aria-current="true"' : ""}>` +
          `<span>${locale.name}</span>${code === "en" ? `<small>${t("original")}</small>` : ""}</button>`;
      }).join("") + "</div>";
    document.body.appendChild(dialog);
    const close = () => { dialog.close(); dialog.remove(); };
    dialog.querySelector(".abp-language-dialog__close").addEventListener("click", close);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    dialog.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => {
      applyLanguage(button.getAttribute("data-lang"));
      close();
    }));
    dialog.showModal ? dialog.showModal() : dialog.setAttribute("open", "");
  }

  function addPicker() {
    const header = document.querySelector(".md-header__inner");
    if (!header || header.querySelector(".abp-language-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "abp-language-btn md-header__button";
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.9 15.1 10.4 8.6H8.6l-3.5 9h1.8l.8-2.2h3.6l.8 2.2h1.8l-1-2.5ZM8.3 13.8l1.2-3.3 1.2 3.3H8.3ZM20 4h-6V2h-2v2H6v2h9.9c-.5 1.5-1.4 3-2.5 4.2-.8-.9-1.5-2-2-3.2h-2c.6 1.7 1.5 3.2 2.7 4.5l-2 1.9.7 1.8 2.6-2.4c1.4 1.2 3 2.2 4.8 2.8l.6-1.8c-1.5-.5-2.9-1.3-4.1-2.3C17.2 9.9 18.3 8 18.8 6H20V4Z"/></svg><span></span>';
    button.addEventListener("click", openPicker);
    const search = header.querySelector(".md-search") || header.lastElementChild;
    header.insertBefore(button, search);
  }

  function initPage() {
    addPicker();
    applyLanguage(current);
  }

  window.abpI18n = { t, translate, applyLanguage, get language() { return current; }, locales };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initPage);
  else initPage();
  if (window.document$ && typeof window.document$.subscribe === "function") window.document$.subscribe(initPage);
})();
