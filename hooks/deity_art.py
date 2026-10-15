"""Exact Category 1 identities whose preview artwork the owner approved."""
from html import escape
from posixpath import relpath


# Approval: 15 October 2026, "allow every pic till surya". Neither Chandra
# nor Brahma is approved. No aliases, substring matches or gender inference.
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
