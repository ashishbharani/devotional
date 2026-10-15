# Owner-approved deity artwork

On 15 October 2026 the owner approved the displayed previews with:
“allow every pic till surya”. This covers the first 16 generated images:
Ganesha, Shiva, Vishnu, Durga, Rama, Krishna, Lakshmi, Hanuman, Saraswati,
Murugan, Yoga Narasimha, Venkateswara, Vitthala, Shirdi Sai Baba, Kali and Surya.
The later Chandra and Brahma previews are **not approved or included**.
No remaining Category 1 identity is approved by implication.

`hooks/deity_art.py` is the explicit allowlist shared by the homepage,
Category 1 and existing section-introduction rendering. There is no substring,
alias, gender or avatar inference, and no reuse on unrelated categories.
Existing Navagraha artwork is left unchanged, not replaced by an individual god.
The homepage's two top-banner guardian portraits also use this allowlist:
Ganesha and Shiva must never fall back to the older royal-home image files.

The artwork was generated with the built-in image tool and individually shown
to the owner before approval. It is modern artistic interpretation, not a
photograph or certified reproduction of any temple idol. Kali's approved
preview uses a non-graphic golden symbolic head attribute. Murugan is the
single-faced Vel-bearing form; Narasimha is the peaceful Yoga form;
Venkateswara is the Tirumala murti, not Hanuman despite shared use of “Balaji”.

Previews and prompt/reference notes remain in the local sibling
`outputs/deity-previews/` folder; unapproved previews must not be copied into docs.
`scripts/prepare_deity_art.py` packages only approved PNGs as 640px and 1254px
quality-92 WebP. It does not crop, repaint or alter identifying attributes.
Pillow is needed only for this developer packaging command, not the site build;
the bundled desktop Python includes it. No site dependency was added.

The responsive sources use explicit dimensions, lazy loading and asynchronous
decoding. Whole-image containment avoids clipping crowns, arms or attributes.
Large original PNGs are not shipped to website visitors. Existing collection
data, canonical IDs, URLs and all astronomy remain unchanged.

Checks: strict MkDocs build, `python scripts/test_deity_art.py`, site smoke audit,
homepage hook test and responsive homepage/browser checks.
