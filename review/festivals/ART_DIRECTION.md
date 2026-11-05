# Five prototypes — cultural and visual approval pending

These are authored CSS/SVG studies on the existing website, not final art or
release approval. No bitmap, deity portrait, PWA icon, catalogue artwork or
third-party tourism photograph is modified or imported. Existing homepage
artwork remains in its original element. The developer build reuses it with
a reversible atmospheric tint underneath the copy.

| Prototype | Atmosphere | Lighting | Ornament | Motion | Devotional imagery | Interaction |
| --- | --- | --- | --- | --- | --- | --- |
| Diwali | Maroon temple-like perimeter | Warm gold | Abstract lamps and concentric rangoli-inspired lines | Slow lamp drift | Existing approved homepage artwork; no new deity assignment | Three stage previews, greeting, collection link |
| Holi | Mauve, green and spring colour clouds | Diffuse spring light | Original floral outline | Restrained floral drift | Original artwork preserved; no new Radha/Krishna portrait claim | Design-only stage previews and greeting |
| Maha Shivaratri | Midnight blue and star field | Silver moonlight | Original crescent outline | Calm celestial drift | Existing Shiva guardian stays unchanged; no generated iconography | Existing canonical Shiva collection route |
| Chhath | Warm sunrise perimeter and horizontal river light | Solar gold | Abstract sun and water lines | Slow ornamental drift, no ritual simulation | Ornament fallback; no unlicensed riverbank photograph | Signposted preview, greeting and collection discovery |
| Pongal | Harvest green and sunlit gold | Seasonal glow | Abstract grain; geometric kolam-inspired pattern | Gentle grain drift | Ornament fallback; no fabricated temple or deity | Signposted preview and harvest greeting |

Ganesha is an additional continuity study: saffron-gold floral points and an
original abstract arch preserve the existing saved choice without creating a
deity image. It does not approve a Visarjan period.

Stage progression increases atmospheric opacity from .4 to .65 to .85, plus
hero/reading-plane glow depth and strength. Tests compare three distinct computed
hero shadows for every study. Allowlisted member-day variations retain the family:
Diwali lotus/harvest light, Chhath sunset/dawn and Pongal harvest/warm accents.
Unknown IDs fall back to the family; data cannot inject CSS or SVG paths.
All stages apply the whole prototype, rather than a countdown alone. Motifs
stay at reading-surface edges. Existing header, navigation, taskbar, typography,
content surfaces and category colours keep their own tokens. At most twelve
decorative SVG nodes animate (eight outside the reading plane plus four on
the homepage); only transforms/opacity animate. There are no image requests.

Reduced motion, existing `abp-still`, high contrast, forced colours, data saver
and low reported device capability suppress motion or decoration. CSS remains
the final reduced-motion/high-contrast guard even if JavaScript fails.

Licensing inventory: the new abstract paths and CSS are original repository
code, with no third-party visual asset. Existing art ownership/provenance stays
in `DEITY_ARTWORK.md`; no additional redistribution rights are asserted.
The research PDFs are evidence references only, not theme assets, and are not
committed. Their URLs and fetched-byte hashes are in `source-claims.json`.

Not complete: dedicated final artwork/licence review, regional ornament review,
and additional family-specific directions (including Navratri, Durga Puja,
the final Ganeshotsav direction, Janmashtami, Onam and Ratha Jatra). These families cannot be
promoted merely by assigning one of the five prototype IDs. A family must
explicitly declare its matching art direction in the activation registry.
