"""Independent QA-only Moon event references from official native Swiss DLL.

All fixture dates are modern Indian dates: fixed +05:30 is appropriate here,
not a production timezone conversion implementation. Production uses IANA.
"""
import argparse
import ctypes as c
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CITIES = [("delhi", 28.6139, 77.209, 216), ("mumbai", 19.076, 72.8777, 14),
          ("kolkata", 22.5726, 88.3639, 9), ("chennai", 13.0827, 80.2707, 7),
          ("bengaluru", 12.9716, 77.5946, 920), ("varanasi", 25.3176, 82.9739, 81)]
DATES = ["2026-01-03", "2026-01-10", "2026-01-18", "2026-01-25",
         "2026-04-02", "2026-07-14", "2026-10-03"]

parser = argparse.ArgumentParser()
parser.add_argument("--dll", required=True, type=Path)
args = parser.parse_args()
dll = c.CDLL(str(args.dll.resolve()))
ptr = c.POINTER(c.c_double)
dll.swe_set_ephe_path.argtypes = [c.c_char_p]
dll.swe_set_ephe_path(str(ROOT / "docs/assets/ephemeris/vendor/data-0.2.2").encode())
dll.swe_rise_trans.argtypes = [c.c_double, c.c_int32, c.c_char_p, c.c_int32,
                             c.c_int32, ptr, c.c_double, c.c_double, ptr, c.c_char_p]
dll.swe_rise_trans.restype = c.c_int32
dll.swe_version.argtypes = [c.c_char_p]
dll.swe_version.restype = c.c_char_p
version = dll.swe_version(c.create_string_buffer(256)).decode()
assert version == "2.10.03", version
zone = timezone(timedelta(hours=5, minutes=30))
cases = []
for date in DATES:
    start = datetime.fromisoformat(date).replace(tzinfo=zone)
    end = start + timedelta(days=1)
    jd = start.timestamp() / 86400 + 2440587.5
    for city, latitude, longitude, altitude in CITIES:
        record = dict(date=date, city=city, latitude=latitude, longitude=longitude,
                      altitude=altitude, timezone="Asia/Kolkata")
        for field, mode in [("moonrise", 1), ("moonset", 2)]:
            output = c.c_double()
            error = c.create_string_buffer(256)
            geopos = (c.c_double * 3)(longitude, latitude, altitude)
            # Upper limb, refraction, horizon 0 degrees; pressure estimated
            # from elevation and standard 15 C, no fitted offsets.
            ret = dll.swe_rise_trans(jd, 1, None, 2, mode, geopos, 0, 15, c.byref(output), error)
            assert ret in (0, -2), error.value
            event = datetime.fromtimestamp((output.value - 2440587.5) * 86400, timezone.utc) if ret == 0 else None
            record[field] = event.isoformat() if event and start <= event < end else None
        cases.append(record)
document = dict(reference="Official native Swiss Ephemeris swe_rise_trans", version=version,
                dllSHA256=hashlib.sha256(args.dll.read_bytes()).hexdigest(),
                definition="Upper limb; standard refraction; elevation pressure; 15 C; horizon 0 degrees",
                source="https://www.astro.com/swisseph/swephprg.htm", cases=cases)
(ROOT / "scripts/fixtures/moonrise-native.json").write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
print(f"Generated {len(cases)} independent native lunar event cases")
