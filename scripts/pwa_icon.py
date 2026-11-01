"""Publish a larger Android maskable icon using the approved HDC emblem.

The repository's canonical 512px art remains unchanged. No extra dependencies
are required, and the resulting icon is generated deterministically by MkDocs.
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
MASKABLE_FILL = 0.72  # previously 0.52; balance visibility and masking
BACKGROUND = (73, 7, 20)


def _chunk(name: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + name + data + struct.pack(">I", zlib.crc32(name + data) & 0xffffffff)


def _paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    return a if pa <= pb and pa <= pc else (b if pb <= pc else c)


def decode_rgba_png(data: bytes) -> tuple[int, int, bytes]:
    """Read an 8-bit RGBA, non-interlaced PNG (the canonical HDC icon format)."""
    if not data.startswith(PNG_SIGNATURE):
        raise ValueError("Missing PNG signature")
    offset, idat, width, height = 8, bytearray(), 0, 0
    while offset < len(data):
        length = struct.unpack_from(">I", data, offset)[0]
        label = data[offset + 4:offset + 8]
        piece = data[offset + 8:offset + 8 + length]
        offset += length + 12
        if label == b"IHDR":
            width, height, depth, color, compression, filtering, interlace = struct.unpack(">IIBBBBB", piece)
            if (depth, color, compression, filtering, interlace) != (8, 6, 0, 0, 0) or not (0 < width <= 1024 and 0 < height <= 1024):
                raise ValueError("Expected a non-interlaced RGBA PNG up to 1024px")
        elif label == b"IDAT":
            idat.extend(piece)
        elif label == b"IEND":
            break
    if not width or not idat:
        raise ValueError("PNG missing IHDR/IDAT")
    stride = width * 4
    packed = zlib.decompress(idat)
    if len(packed) != (stride + 1) * height:
        raise ValueError("Unexpected PNG pixel buffer size")
    output = bytearray(stride * height)
    prev = bytearray(stride)
    pos = 0
    for y in range(height):
        filter_type = packed[pos]
        pos += 1
        line = bytearray(packed[pos:pos + stride])
        pos += stride
        if filter_type not in range(5):
            raise ValueError(f"Unsupported PNG filter {filter_type}")
        if filter_type:
            for i in range(stride):
                left = line[i - 4] if i >= 4 else 0
                above = prev[i]
                upper_left = prev[i - 4] if i >= 4 else 0
                if filter_type == 1:
                    predictor = left
                elif filter_type == 2:
                    predictor = above
                elif filter_type == 3:
                    predictor = (left + above) // 2
                else:
                    predictor = _paeth(left, above, upper_left)
                line[i] = (line[i] + predictor) & 255
        output[y * stride:(y + 1) * stride] = line
        prev = line
    return width, height, bytes(output)


def encode_rgba_png(width: int, height: int, pixels: bytes) -> bytes:
    """Write a deterministic RGBA PNG using only the standard library."""
    stride = width * 4
    if len(pixels) != height * stride:
        raise ValueError("PNG pixel buffer has incorrect size")
    raw = b"".join(b"\0" + pixels[y * stride:(y + 1) * stride] for y in range(height))
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return PNG_SIGNATURE + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", zlib.compress(raw, 9)) + _chunk(b"IEND", b"")


def enlarge_maskable_icon(source: bytes, fill: float = MASKABLE_FILL) -> bytes:
    """Enlarge approved artwork on a solid, full-bleed burgundy launcher field."""
    width, height, rgba = decode_rgba_png(source)
    if width != 512 or height != 512:
        raise ValueError("Expected canonical 512x512 HDC emblem PNG")
    if not (0.6 <= fill <= 0.8):
        raise ValueError("Maskable fill outside reviewed safety range")
    backdrop = bytes((*BACKGROUND, 255))
    output = bytearray(backdrop * (512 * 512))
    rgb = bytearray(width * height * 3)
    for i in range(width * height):
        p = i * 4
        alpha = rgba[p + 3]
        for k in range(3):
            rgb[i * 3 + k] = (rgba[p + k] * alpha + BACKGROUND[k] * (255 - alpha) + 127) // 255
    size = round(512 * fill)
    inset = (512 - size) // 2
    for yy in range(size):
        sy = (yy + .5) * 512 / size - .5
        y0 = max(0, min(511, int(sy)))
        y1 = max(0, min(511, y0 + 1))
        fy = max(0., min(1., sy - y0))
        for xx in range(size):
            sx = (xx + .5) * 512 / size - .5
            x0 = max(0, min(511, int(sx)))
            x1 = max(0, min(511, x0 + 1))
            fx = max(0., min(1., sx - x0))
            a, b, c, d = ((y0 * width + x0) * 3, (y0 * width + x1) * 3,
                          (y1 * width + x0) * 3, (y1 * width + x1) * 3)
            out = ((yy + inset) * 512 + xx + inset) * 4
            for k in range(3):
                top = rgb[a + k] * (1 - fx) + rgb[b + k] * fx
                bottom = rgb[c + k] * (1 - fx) + rgb[d + k] * fx
                output[out + k] = round(top * (1 - fy) + bottom * fy)
    return encode_rgba_png(512, 512, bytes(output))


def publish_maskable(site: Path) -> None:
    """Rebuild only the published maskable PNG; leave tracked artwork intact."""
    folder = site / "assets" / "images" / "hdc-brand"
    source = folder / "icon-512.png"
    target = folder / "icon-maskable-512.png"
    if not (source.is_file() and target.is_file()):
        raise FileNotFoundError("HDC PWA icon sources missing from build")
    target.write_bytes(enlarge_maskable_icon(source.read_bytes()))
