"""Exact Category 1 identities whose preview artwork the owner approved."""
from html import escape
from posixpath import relpath


# Owner approval: first 16 on 15 October; displayed remakes, additional
# previews and Navagraha on 16 October: "yes use all this pics".
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
}

# Explicit selected versions: rejected drafts must never be packaged.
PREVIEW_VERSIONS = {"chandra": 4, "brahma": 4, "rahu": 2, "shukra": 2}


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
