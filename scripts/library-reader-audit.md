# Library embedding audit — 15 October 2026

The shared homepage/Library renderer progressively opens **only verified** reading
sources inside a sandboxed dialog. Existing anchors work externally without JS;
Ctrl/Cmd-click and the dialog's original-site link retain external access. LISTEN
is never framed. No provider content is copied, proxied, translated or cached.

## Verified live

`node scripts/validate_library_embeds.mjs` launches a real browser and asserts
readable text in cross-origin frames using the production sandbox permissions.
This is opt-in, not a network-dependent CI test. On the audit date it passed:

- ValmikiRamayan.net index and actual English Bala Kanda chapter 1 prose.
  The source lists six Kandas; no seven-Kanda completeness claim is made.
- Sanskrit Documents: Devi Mahatmya and Kena Upanishad. These are the existing
  source texts and language options, not newly verified English/Hindi translations.

HTTPS response headers confirmed no X-Frame-Options or frame-ancestors restriction
on those destinations. A successful audit is not a guarantee of future availability
or of every nested external chapter/resource. Native iframe load events cannot
reliably identify cross-origin framing/network errors; an always-visible fallback
is provided, without claiming successful loading or auto-detecting every failure.

## Explicitly not framed

Representative current library endpoints were fetched and their final response
headers checked, including redirects:

| Provider | Blocking policy observed |
| --- | --- |
| Gita Supersite | X-Frame-Options SAMEORIGIN; frame-ancestors 'none' |
| BharatKosha (redirects to Sarvakosh) | SAMEORIGIN; frame-ancestors 'self' |
| Adiveda | SAMEORIGIN |
| RamayanPath | DENY |

All other catalogue destinations remain external by default, even if an individual
page's policy later changes. Valmiki's Hindi reader remains the community Gita Press
transcription/scans at BharatKosha/Sarvakosh, not an official publisher service.
The broken IIT Kanpur Valmiki destinations are overridden in the renderer without
editing `data/collection.json`. No replacement of Ramayana with Ramcharitmanas.

## Safety and test scope

- No external reader is requested until a supported link is clicked.
- No arbitrary URL input, top navigation, popups or popup sandbox escape allowed
  inside the frame. Scripts, same-origin and forms are allowed for source readers;
  the verified frame is cross-origin from this site. Referrers are suppressed.
- Provider content can still make its own requests once opened; this is an online
  third-party reader, not an offline/privacy proxy or host-controlled translation.
- No PDFs are library entries today. The four existing project PDFs remain intact;
  no unrelated PDF viewer/re-hosting is introduced by this change.
- Deterministic CI mocks book sources to test our own viewer/fallbacks at 320, 768
  and 1440px, Escape/focus restoration, close cleanup, failed responses, unchanged
  LISTEN, no-JS links, duplicate prevention and MkDocs instant navigation.
