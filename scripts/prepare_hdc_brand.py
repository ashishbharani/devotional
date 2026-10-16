"""Extract exact approved panels from the owner's PNG board; never generate artwork."""
from __future__ import annotations
import argparse
from collections import deque
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
BOXES = {
    "logo-full": (0, 0, 882, 335),
    "logo-horizontal": (40, 363, 602, 438),
    "emblem": (918, 18, 1184, 280),
    "header-emblem": (42, 363, 142, 438),
    "header-sunset": (610, 363, 894, 438),
    "mobile-emblem-light": (687, 701, 754, 760),
    "mobile-emblem-dark": (687, 796, 754, 857),
    "app-192": (1202, 73, 1382, 253),
    "favicon": (1406, 135, 1508, 240),
    "navigation-lotus": (728, 473, 800, 514),
}


def outside_alpha(image):
    """Remove only boundary-connected burgundy outside the icon's gold frame."""
    image = image.convert("RGBA")
    pixels = image.load()
    seen, queue = set(), deque()
    for x in range(image.width):
        queue.extend(((x, 0), (x, image.height - 1)))
    for y in range(image.height):
        queue.extend(((0, y), (image.width - 1, y)))
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < image.width and 0 <= y < image.height):
            continue
        seen.add((x, y))
        r, g, b, _ = pixels[x, y]
        if r < 125 and g < 65 and b < 70 and r > g * 1.1:
            pixels[x, y] = (r, g, b, 0)
            queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    return image


def square(image, size, background=(0, 0, 0, 0), fraction=1.0):
    target = Image.new("RGBA", (size, size), background)
    art = ImageOps.contain(image.convert("RGBA"), (round(size * fraction), round(size * fraction)), Image.Resampling.LANCZOS)
    target.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("board", type=Path)
    parser.add_argument("--add-mobile", action="store_true", help="Extend the same reviewed source with its dedicated mobile emblems only.")
    args = parser.parse_args()
    target = ROOT / "docs/assets/images/hdc-brand"
    if (target / "source.json").exists():
        if not args.add_mobile:
            raise FileExistsError("Brand assets already exist; review rather than silently overwrite.")
        assert json.loads((target / "source.json").read_text())["sha256"] == hashlib.sha256(args.board.read_bytes()).hexdigest()
        with Image.open(args.board) as board:
            for name in ("mobile-emblem-light", "mobile-emblem-dark"):
                output = target / f"{name}.webp"
                if output.exists():
                    raise FileExistsError(output)
                board.crop(BOXES[name]).save(output, "WEBP", quality=94, method=6)
        metadata = json.loads((target / "source.json").read_text())
        metadata["cropBoxes"] = BOXES
        (target / "source.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        return
    target.mkdir(parents=True, exist_ok=True)
    with Image.open(args.board) as board:
        assert board.size == (1536, 1024), "Coordinates apply only to the supplied 1536×1024 board."
        panels = {key: board.crop(box) for key, box in BOXES.items()}
    for name in ("logo-full", "logo-horizontal", "header-emblem", "header-sunset", "navigation-lotus", "mobile-emblem-light", "mobile-emblem-dark"):
        panels[name].save(target / f"{name}.webp", "WEBP", quality=94, method=6)
    emblem = outside_alpha(panels["emblem"])
    square(emblem, 266).save(target / "emblem.webp", "WEBP", quality=94, method=6)
    square(emblem, 512).save(target / "icon-512.png", optimize=True)
    # Every part of the complete frame/lotus lies inside the central safe circle.
    square(emblem, 512, (73, 7, 20, 255), .52).save(target / "icon-maskable-512.png", optimize=True)
    app = outside_alpha(panels["app-192"])
    square(app, 192).save(target / "icon-192.png", optimize=True)
    square(app, 180, (73, 7, 20, 255)).save(target / "apple-touch-icon.png", optimize=True)
    favicon = outside_alpha(panels["favicon"])
    for size in (32, 48):
        square(favicon, size).save(target / f"favicon-{size}.png", optimize=True)
    metadata = {"source": args.board.name, "sha256": hashlib.sha256(args.board.read_bytes()).hexdigest(),
                "sourceSize": [1536, 1024], "cropBoxes": BOXES,
                "method": "Exact dedicated panels, no AI generation/repainting; contain, never stretch; boundary-only alpha.",
                "limitation": "512px output is resampled from a 266×262 board panel, not a native high-resolution master.",
                "maskableArtworkFraction": .52}
    (target / "source.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps({file.name: file.stat().st_size for file in sorted(target.iterdir())}))


if __name__ == "__main__":
    main()
