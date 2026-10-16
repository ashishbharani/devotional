"""Package the owner's approved PNG previews as responsive WebP, without cropping."""
import argparse
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from hooks.deity_art import APPROVED, PREVIEW_VERSIONS, LIFELIKE_PREVIEWS  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("previews", type=Path)
    args = parser.parse_args()
    target = ROOT / "docs/assets/images/deities"
    target.mkdir(parents=True, exist_ok=True)
    for slug, _ in APPROVED.values():
        outputs = [target / f"{slug}-{width}.webp" for width in (640, 1254)]
        if all(output.exists() for output in outputs):
            continue  # Preserve previously packaged approved originals.
        version = PREVIEW_VERSIONS.get(slug, 1)
        source = (args.previews / "next-20-lifelike" / LIFELIKE_PREVIEWS[slug]
                  if slug in LIFELIKE_PREVIEWS
                  else args.previews / f"{slug}-preview-v{version}.png")
        with Image.open(source) as image:
            image = image.convert("RGB")
            assert image.width == image.height, slug
            for width in (640, 1254):
                output = target / f"{slug}-{width}.webp"
                if output.exists():
                    raise FileExistsError(f"Refusing to overwrite {output}")
                image.resize((width, width), Image.Resampling.LANCZOS).save(
                    output, "WEBP", quality=92, method=6
                )
        print(f"Packaged approved artwork: {slug}")


if __name__ == "__main__":
    main()
