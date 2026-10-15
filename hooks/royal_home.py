"""Homepage-only presentation. Catalogue identities and routes come from generate.load."""
from html import escape
from urllib.parse import urlencode
from hooks.deity_art import portrait as deity_portrait

HOME_TITLE = "HINDU DEVOTIONAL COLLECTION"
ART = "assets/images/royal-home/"


def hero():
    return (
        '<div class="udhc-sacred-strip"><span aria-hidden="true">✦</span> '
        '<span lang="sa">ॐ सर्वे भवन्तु सुखिनः</span> · THE LIGHT OF DEVOTION · THE WISDOM OF BHARAT '
        '<span aria-hidden="true">✦</span></div>'
        '<nav class="udhc-quick-nav" aria-label="Homepage destinations">'
        + ''.join(f'<a href="{url}">{name}</a>' for name, url in [
            ("Home", "./"), ("Library", "library/"), ("Categories", "master-index/"),
            ("Books", "library/"), ("Search", "find/"), ("About", "foreword/"), ("Help", "legend/")])
        + '</nav><section class="udhc-hero" aria-labelledby="udhc-title">'
        '<div class="udhc-hero-art" aria-hidden="true">'
        f'<img src="{ART}temple-ghat-hero.webp" width="1536" height="1024" fetchpriority="high" alt="">'
        '</div><div class="udhc-hero-copy">'
        '<p class="udhc-plaque" lang="sa">॥ श्री गणेशाय नमः ॥</p>'
        '<p class="udhc-kicker">A digital sanctuary of sacred knowledge</p>'
        f'<h1 id="udhc-title" tabindex="-1">{HOME_TITLE}</h1>'
        '<p class="udhc-invitation">A Living Treasury <em>of Hindu Devotion.</em></p>'
        '<p class="udhc-hindi" lang="hi">सनातन ज्ञान • भक्ति • संस्कृति • परंपरा</p>'
        '<p class="udhc-motto">Explore • Read • Listen • Learn • Devote</p>'
        '<p class="udhc-intro">Explore Hindu scriptures, mantras, stotras, prayers, sacred literature, '
        'devotional music and traditional works — thoughtfully brought together in one living digital library.</p>'
        '<form class="udhc-search" action="find/" method="get" role="search" aria-label="Search the collection">'
        '<label for="udhc-query">What would you like to discover?</label><div>'
        '<input id="udhc-query" type="search" name="w" placeholder="Try Hanuman Chalisa, Shiva, a mantra…" required>'
        '<button type="submit">Search <span aria-hidden="true">→</span></button></div></form>'
        '<div class="udhc-actions"><a class="udhc-button" href="master-index/">Browse All Categories →</a>'
        '<a class="udhc-button udhc-button--outline" href="library/">Explore Books Library →</a>'
        '<a class="udhc-about-link" href="foreword/">About This Collection →</a></div>'
        '</div><div class="udhc-guardians" aria-label="Devotional illustrations">'
        f'<figure><img src="{ART}ganesha.webp" width="240" height="240" alt="Traditional illustration of Shri Ganesha"><figcaption>श्री गणेश</figcaption></figure>'
        f'<figure><img src="{ART}shiva.webp" width="240" height="240" alt="Traditional illustration of Lord Shiva"><figcaption>ॐ नमः शिवाय</figcaption></figure>'
        '</div></section><div class="udhc-gold-rule" aria-hidden="true">❖</div>'
    )


def discovery(d):
    paths = [
        ("☼", "Today’s Panchang", "Tithi, Nakshatra and local sunrise, with your shared selected city.", "panchang/", "maroon"),
        ("ॐ", "Devotional Works", "Mantras, stotras, aartis, bhajans and many more forms of devotion.", "master-index/", "saffron"),
        ("▣", "Scriptures & Books", "Sacred texts, epics, philosophical teachings and traditional literature.", "library/", "peacock"),
        ("✥", "A–Z Directory", "Browse the collection’s existing alphabetical directory.", "a-z/", "gold"),
    ]
    out = ['<section class="udhc-section" aria-labelledby="udhc-journey"><p class="udhc-kicker">✦ Your journey begins here ✦</p>'
           '<h2 id="udhc-journey">Discover the Paths of Devotion</h2><p class="udhc-section-intro">'
           'Whether you seek a daily Panchang, a sacred text, a familiar prayer or a new tradition to explore, begin here.</p><div class="udhc-divider" aria-hidden="true">❖</div><div class="udhc-paths">']
    for symbol, name, description, url, color in paths:
        out.append(f'<a class="udhc-path udhc-{color}" href="{url}"><span class="udhc-symbol" aria-hidden="true">{symbol}</span>'
                   f'<h3>{escape(name)}</h3><p>{escape(description)}</p><span class="udhc-card-action">Explore →</span></a>')
    out.append('</div></section><section class="udhc-section" aria-labelledby="udhc-categories">'
               '<p class="udhc-kicker">❖ Diverse voices of bhakti ❖</p><h2 id="udhc-categories">EXPLORE BY CATEGORY</h2>'
               '<p class="udhc-section-intro">These discovery paths search existing works; the complete canonical category structure remains below.</p><div class="udhc-category-grid">')
    for symbol, name, term in [
        ("ॐ", "Mantras & Mahamantras", "mantra"), ("❁", "Stotras & Ashtakams", "stotra"),
        ("✥", "Sahasranamas & Namavalis", "sahasranama"), ("▣", "Gita, Puranas & Scriptures", None),
        ("♨", "Puja, Homa & Rituals", "puja"), ("♫", "Bhajans, Kirtans & Aartis", "bhajan"),
        ("❖", "Kavachas & Sacred Prayers", "kavach"), ("◈", "Vrat Katha & Parayan", "vrat"),
        ("▤", "Hindu Books Library", None),
    ]:
        url = "find/?" + urlencode({"w": term}) if term else "library/"
        out.append(f'<a class="udhc-category" href="{url}"><span aria-hidden="true">{symbol}</span><h3>{escape(name)}</h3><span aria-hidden="true">→</span></a>')
    out.append(f'</div><p><a class="udhc-button" href="master-index/">Browse all {len(d["categories"])} canonical categories →</a></p></section>')
    out.append('<section class="udhc-section udhc-traditions" aria-labelledby="udhc-deities"><p class="udhc-kicker">✦ The many expressions of the divine ✦</p>'
               '<h2 id="udhc-deities">POPULAR DEVOTIONAL SECTIONS</h2><p class="udhc-section-intro">A home for individual deities, divine forms, river deities, regional traditions and living devotional communities.</p><div class="udhc-deities">')
    groups = {g["name"]: g for c in d["categories"] if c["num"] == 1 for g in c["merged"]}
    for key, name, art in [
        ("GANESHA", "Shri Ganesha", "ganesha"), ("SHIVA / MAHESH", "Lord Shiva", "shiva"),
        ("VISHNU", "Lord Vishnu", "vishnu"), ("DURGA", "Maa Durga", "durga"),
        ("RAMA", "Lord Rama", None), ("KRISHNA", "Lord Krishna", "krishna"),
        ("LAKSHMI", "Maa Lakshmi", None), ("HANUMAN", "Lord Hanuman", None),
        ("SARASWATI", "Maa Saraswati", "saraswati"), ("NAVAGRAHA", "Navagraha", "navagraha"),
    ]:
        if key not in groups:
            continue
        portrait = deity_portrait(key) or (f'<img src="{ART}{art}.webp" width="240" height="240" loading="lazy" alt="Illustration of {escape(name)}">' if art else f'<span class="udhc-seal" aria-hidden="true">{"श्री राम" if key == "RAMA" else "श्री" if key == "LAKSHMI" else "जय हनुमान"}</span>')
        out.append(f'<a href="{escape(groups[key]["url"])}">{portrait}<span>{escape(name)}</span></a>')
    all_deities = next(c["url"] for c in d["categories"] if c["num"] == 1)
    out.append(f'</div><a class="udhc-button" href="{all_deities}">All Deities & Divine Forms →</a></section>')
    out.append('<section class="udhc-section" aria-labelledby="udhc-live"><p class="udhc-kicker">❖ Your living devotional library ❖</p>'
               '<h2 id="udhc-live">Read, discover and practise</h2><p class="udhc-section-intro">Open the live Panchang, scriptures library and complete category index below. Their existing controls, calculations and reading links are preserved.</p></section>')
    return ''.join(out)


def closing():
    return ('<section class="udhc-section udhc-about" aria-labelledby="udhc-about"><h2 id="udhc-about">About This Collection</h2>'
            '<p>A multilingual devotional reference collected and compiled by Ashish Bharani, supporting exploration, learning and preservation of Hindu devotional literature and traditions.</p>'
            '<a href="foreword/">Read the Foreword →</a> · <a href="about/">About the Compiler →</a> · <a href="contribution/">Contribute →</a>'
            '</section><section class="udhc-quote" aria-label="Prayer for well-being"><span aria-hidden="true">ॐ</span>'
            '<p lang="sa">लोकाः समस्ताः सुखिनो भवन्तु ॥</p><p>May all beings everywhere be happy.</p></section>')
