"""Generate full-double golden fixtures from the official native Swiss DLL.

Windows: python scripts/generate_ephemeris_reference.py --dll work/native/sweph/bin/swedll64.dll
Native binaries are QA-only and are never shipped to the browser.
"""
from __future__ import annotations

import argparse
import ctypes as c
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "docs/assets/ephemeris/vendor/data-0.2.2"
MODES = {"lahiri": 1, "raman": 3, "krishnamurti": 5, "yukteshwar": 7, "fagan": 0, "tropical": None}
DATES = ["2000-01-01T12:00:00Z", "2024-01-01T00:00:00Z", "2026-10-03T03:25:00Z",
         "2024-02-29T18:30:00Z", "1850-01-01T00:00:00Z", "2100-12-31T23:59:59Z"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dll", required=True, type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "scripts/fixtures/ephemeris-golden.json")
    args = parser.parse_args()
    dll = c.CDLL(str(args.dll.resolve()))
    double = c.c_double
    integer = c.c_int32
    ptr = c.POINTER(double)
    dll.swe_version.argtypes = [c.c_char_p]
    dll.swe_version.restype = c.c_char_p
    dll.swe_set_ephe_path.argtypes = [c.c_char_p]
    dll.swe_set_sid_mode.argtypes = [integer, double, double]
    dll.swe_set_topo.argtypes = [double, double, double]
    dll.swe_calc_ut.argtypes = [double, integer, integer, ptr, c.c_char_p]
    dll.swe_calc_ut.restype = integer
    dll.swe_get_ayanamsa_ex_ut.argtypes = [double, integer, ptr, c.c_char_p]
    dll.swe_get_ayanamsa_ex_ut.restype = integer
    dll.swe_houses_ex2.argtypes = [double, integer, double, double, integer, ptr, ptr, ptr, ptr, c.c_char_p]
    dll.swe_houses_ex2.restype = integer
    version = dll.swe_version(c.create_string_buffer(256)).decode()
    assert version == "2.10.03", version
    dll.swe_set_ephe_path(str(DATA.resolve()).encode())
    fixtures = []
    for date in DATES:
        instant = datetime.fromisoformat(date.replace("Z", "+00:00"))
        jd = instant.timestamp() / 86400 + 2440587.5
        for name, mode in MODES.items():
            dll.swe_set_sid_mode(mode if mode is not None else 1, 0, 0)
            for observer in ("geocentric", "topocentric"):
                dll.swe_set_topo(77.209, 28.6139, 216)
                flags = 2 | 256 | (65536 if mode is not None else 0)
                positions = []
                for body in range(12):
                    body_flags = flags | (32768 if observer == "topocentric" and body < 10 else 0)
                    output = (double * 6)()
                    error = c.create_string_buffer(256)
                    ret = dll.swe_calc_ut(jd, body, body_flags, output, error)
                    assert ret >= 0 and ret & 2 and not ret & 4, (body, ret, error.value)
                    positions.append({"body": body, "values": list(output), "flags": ret})
                ayanamsa = double(0)
                error = c.create_string_buffer(256)
                ret = dll.swe_get_ayanamsa_ex_ut(jd, 2, c.byref(ayanamsa), error)
                assert ret >= 0
                houses = {}
                for system in "WASP":
                    cusps = (double * 13)()
                    angles = (double * 10)()
                    cusp_speed = (double * 13)()
                    angle_speed = (double * 10)()
                    ret = dll.swe_houses_ex2(jd, flags & 65536, 28.6139, 77.209, ord(system), cusps, angles, cusp_speed, angle_speed, error)
                    assert ret >= 0
                    houses[system] = {"ascendant": angles[0], "cusps": list(cusps)[1:]}
                fixtures.append({"instantUTC": date, "jdUT": jd, "ayanamsha": name,
                                 "observerMode": observer, "ayanamshaValue": ayanamsa.value if mode is not None else 0,
                                 "positions": positions, "houses": houses})
    document = {
        "reference": "Official Astrodienst native swedll64.dll, swe_calc_ut and swe_get_ayanamsa_ex_ut",
        "version": version,
        "dllSHA256": hashlib.sha256(args.dll.read_bytes()).hexdigest(),
        "archiveURL": "https://raw.githubusercontent.com/aloistr/swisseph/master/windows/sweph.zip",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "datasetSHA256": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in DATA.glob("*.se1")},
        # Topocentric SPEED uses short finite differences (PLAN_SPEED_INTV
        # 0.0001 day). Native/WASM compiler roundoff is amplified by that
        # differentiation. Measured max 1.336e-8 deg/day, against positional
        # agreement < 1.14e-13 degrees. 2e-8 is 0.000072 arcsec/day.
        "toleranceDegrees": 1e-9, "toleranceSpeedDegreesPerDay": 2e-8, "toleranceAU": 1e-10,
        "cases": fixtures,
    }
    args.output.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(fixtures)} native reference cases; engine {version}; {args.output}")


if __name__ == "__main__":
    main()
