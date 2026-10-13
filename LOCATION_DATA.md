# Location data and search policy

Existing Indian presets in `settings.mjs` are unchanged. The compact local
index adds three approximate city centres from GeoNames, accessed 2026-10-13:

| Place | GeoNames source | Latitude | Longitude | IANA zone |
| --- | --- | --- | --- | --- |
| London | https://www.geonames.org/2643743/london.html | 51.50853 | -0.12574 | Europe/London |
| New York | https://www.geonames.org/5128581/new-york-city.html | 40.71427 | -74.00597 | America/New_York |
| Kathmandu | https://www.geonames.org/1283240/kathmandu.html | 27.70169 | 85.32060 | Asia/Kathmandu |

GeoNames data: Creative Commons Attribution 4.0,
https://creativecommons.org/licenses/by/4.0/; source/licensing notice:
https://download.geonames.org/export/dump/readme.txt and https://www.geonames.org/export/.
Credit is displayed beside the shared location selector. Elevation is deliberately
not imported: it is marked unknown, with a disclosed neutral 0 m calculation
fallback. Users may supply a measured elevation. Numeric preset offsets are
standard-time fallbacks, not substitutes for IANA DST/historical resolution.

Local token search is offline and ignores case, punctuation and repeated spaces.
UP expands to Uttar Pradesh. Exact well-established aliases (Kashi/Banaras/Benares,
New Delhi, Bangalore, Bombay and Calcutta) resolve visibly to their canonical
presets. Multiple partial matches remain selectable; arbitrary text is never
treated as coordinates or a known city. The small index loads only with location
controls, not as a large dataset on every catalogue page.

Unmatched explicit searches may use the configured, no-secret Nominatim endpoint
for India only. No network autocomplete, GPS transmission or bulk queries.
Attribution, six-result limit, abort/cancellation, caching, throttling and failure
fallback are retained. The provider may be disabled with `enabled: false` in
`docs/assets/panchang/location-search.json`, or switched to a compatible provider.
The public service requires an aggregate application limit of one request/second;
individual static clients cannot enforce that globally. For larger traffic,
disable it or configure a rate-limited compatible service before scaling.
Policy: https://operations.osmfoundation.org/policies/nominatim/.

This is **not general worldwide geocoding**. Only bundled worldwide places have
verified automatic IANA zones. Other worldwide locations require manual
coordinates and an explicit IANA timezone. Device mode uses the browser's IANA
zone, visibly asks the user to verify it, and does not infer zones from longitude
or send precise coordinates to a timezone service.
