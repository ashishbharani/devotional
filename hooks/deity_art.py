"""Exact Category 1 identities whose preview artwork the owner approved."""
from html import escape
from posixpath import relpath


# Owner approval: first 16 on 15 October; displayed remakes, additional
# previews and Navagraha on 16 October: "yes use all this pics".
# Next twenty lifelike portraits: "all are ok", with revised files selected.
# No aliases, substring matches or gender inference.
APPROVED = {
    "GANESHA": ("ganesha", "Shri Ganesha"),
    "SHIVA / MAHESH": ("shiva", "Lord Shiva"),
    "VISHNU": ("vishnu", "Lord Vishnu"),
    "DURGA": ("durga", "Maa Durga"),
    "RAMA": ("rama", "Lord Rama"),
    "KRISHNA": ("krishna", "Lord Krishna"),
    "LAKSHMI": ("lakshmi", "Maa Lakshmi"),
    "HANUMAN": ("hanuman", "Lord Hanuman"),
    "SARASWATI": ("saraswati", "Maa Saraswati"),
    "KARTIKEYA / MURUGAN": ("murugan", "Lord Murugan, single-faced Vel-bearing form"),
    "NARASIMHA": ("narasimha", "Lord Yoga Narasimha"),
    "VENKATESHWARA / BALAJI / SRINIVASA": ("venkateswara", "Lord Venkateswara of Tirumala"),
    "VITTHALA": ("vitthala", "Lord Vitthala of Pandharpur"),
    "SAI BABA": ("sai-baba", "Shirdi Sai Baba"),
    "KALI": ("kali", "Maa Kali"),
    "SURYA": ("surya", "Lord Surya"),
    "CHANDRA": ("chandra", "Lord Chandra"),
    "BRAHMA": ("brahma", "Lord Brahma, four-visible-head illustrative form"),
    "RAHU": ("rahu", "Rahu, head-only form"),
    "SHUKRA": ("shukra", "Lord Shukra"),
    "DATTATREYA": ("dattatreya", "Lord Dattatreya"),
    "RADHA": ("radha", "Shri Radha"),
    "PARVATI": ("parvati", "Maa Parvati"),
    "SITA": ("sita", "Maa Sita"),
    "ANNAPURNA": ("annapurna", "Maa Annapurna"),
    "DHANVANTARI": ("dhanvantari", "Lord Dhanvantari"),
    "HAYAGRIVA": ("hayagriva", "Lord Hayagriva"),
    "DAKSHINAMURTI": ("dakshinamurti", "Lord Dakshinamurti"),
    "SHANI": ("shani", "Lord Shani"),
    "MANGALA": ("mangala", "Lord Mangala"),
    "BRIHASPATI / GURU": ("brihaspati", "Lord Brihaspati"),
    "KETU": ("ketu", "Ketu, serpent-tailed form"),
    "BUDHA": ("budha", "Lord Budha"),
    "LALITA TRIPURASUNDARI": ("lalita", "Maa Lalita Tripurasundari"),
    "NAVAGRAHA": ("navagraha", "the nine Navagraha deities, illustrative grouping"),
    "KUBERA": ("kubera", "Lord Kubera"),
    "AYYAPPA": ("ayyappa", "Lord Ayyappa, yogic form"),
    "VARAHI": ("varahi", "Maa Varahi, boar-headed goddess"),
    "MEENAKSHI": ("meenakshi", "Maa Meenakshi of Madurai"),
    "BHAIRAVA": ("bhairava", "Lord Kalabhairava"),
    "BALA TRIPURASUNDARI": ("bala-tripurasundari", "Maa Bala Tripurasundari"),
    "GAYATRI": ("gayatri", "Maa Gayatri, five-faced form"),
    "BHUVANESHWARI": ("bhuvaneshwari", "Maa Bhuvaneshwari"),
    "KAMALA / KAMALATMIKA": ("kamala", "Maa Kamala"),
    "KAMAKSHI": ("kamakshi", "Maa Kamakshi of Kanchipuram"),
    "SHYAMALA / MATANGI": ("shyamala-matangi", "Maa Raja Shyamala, Raja Matangi form"),
    "ARDHANARISHVARA": ("ardhanarishvara", "Ardhanarishvara, unified Shiva and Parvati form"),
    "PRATYANGIRA": ("pratyangira", "Maa Pratyangira, lion-faced goddess"),
    "BAGALAMUKHI": ("bagalamukhi", "Maa Bagalamukhi"),
    "MOOKAMBIKA": ("mookambika", "Maa Mookambika of Kollur"),
    "TULASI": ("tulasi", "Devi Tulasi, Vrinda"),
    "RENUKA / YELLAMMA": ("renuka-yellamma", "Maa Renuka, Yellamma maternal interpretation"),
    "VEERABHADRA": ("veerabhadra", "Lord Veerabhadra"),
    "NATARAJA": ("nataraja", "Lord Shiva Nataraja"),
    "PARASHURAMA": ("parashurama", "Lord Parashurama"),
}

# Explicit selected versions: rejected drafts must never be packaged.
PREVIEW_VERSIONS = {"chandra": 4, "brahma": 4, "rahu": 2, "shukra": 2}

# Owner approved all twenty lifelike previews, selecting revised versions.
# Kamakshi and Nataraja files already contain their final corrected images;
# Bhairava's earlier bead-loop draft has a separate name and is excluded.
LIFELIKE_PREVIEWS = {
    "kubera": "kubera-lifelike-preview.png",
    "ayyappa": "ayyappa-lifelike-preview.png",
    "varahi": "varahi-lifelike-preview.png",
    "meenakshi": "meenakshi-lifelike-preview.png",
    "bhairava": "bhairava-lifelike-corrected.png",
    "bala-tripurasundari": "bala-tripurasundari-lifelike-preview.png",
    "gayatri": "gayatri-lifelike-preview.png",
    "bhuvaneshwari": "bhuvaneshwari-lifelike-preview.png",
    "kamala": "kamala-lifelike-preview.png",
    "kamakshi": "kamakshi-lifelike-preview.png",
    "shyamala-matangi": "shyamala-matangi-lifelike-preview.png",
    "ardhanarishvara": "ardhanarishvara-lifelike-preview.png",
    "pratyangira": "pratyangira-lifelike-preview.png",
    "bagalamukhi": "bagalamukhi-lifelike-preview.png",
    "mookambika": "mookambika-lifelike-preview.png",
    "tulasi": "tulasi-lifelike-preview.png",
    "renuka-yellamma": "renuka-yellamma-lifelike-preview.png",
    "veerabhadra": "veerabhadra-lifelike-preview.png",
    "nataraja": "nataraja-lifelike-preview.png",
    "parashurama": "parashurama-lifelike-preview.png",
}


def portrait(name, page_url="", css="abp-deity-portrait"):
    """Render only an explicitly approved identity; preserve the whole image."""
    item = APPROVED.get(name)
    if not item:
        return ""
    slug, label = item
    prefix = relpath("assets/images/deities", page_url.rstrip("/") or ".")
    return (
        f'<img class="{escape(css)}" src="{prefix}/{slug}-640.webp" '
        f'srcset="{prefix}/{slug}-640.webp 640w, {prefix}/{slug}-1254.webp 1254w" '
        'sizes="(max-width: 600px) 96px, 144px" width="1254" height="1254" '
        f'loading="lazy" decoding="async" alt="3D devotional illustration of {escape(label)}">'
    )
