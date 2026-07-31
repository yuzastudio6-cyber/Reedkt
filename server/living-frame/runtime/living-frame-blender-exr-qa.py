from __future__ import annotations

from array import array
import json
import math
from pathlib import Path
import stat

import bpy


VERSION = "living-frame-blender-fixed-exr-qa-v1"
WIDTH = 1920
HEIGHT = 1080
FRAMES = (12, 42, 71)
MAXIMUM_FILE_BYTES = 64 * 1024 * 1024


def fail(message: str) -> None:
    raise RuntimeError(message)


def exact_regular_file(path: Path, suffix: str) -> Path:
    resolved = path.resolve(strict=True)
    if resolved.parent != path.parent.resolve(strict=True):
        fail("OpenEXR QA input escaped its fixed private directory")
    details = resolved.lstat()
    if (
        not stat.S_ISREG(details.st_mode)
        or path.is_symlink()
        or details.st_size <= 0
        or details.st_size > MAXIMUM_FILE_BYTES
        or resolved.suffix != suffix
    ):
        fail("OpenEXR QA input is not an exact bounded regular file")
    return resolved


def load_pixels(path: Path, expected_channels: int = 4) -> tuple[bpy.types.Image, array]:
    image = bpy.data.images.load(str(path), check_existing=False)
    if tuple(image.size) != (WIDTH, HEIGHT):
        fail("OpenEXR QA image dimensions changed")
    pixel_count = WIDTH * HEIGHT * expected_channels
    values = array("f", [0.0]) * pixel_count
    image.pixels.foreach_get(values)
    if len(values) != pixel_count:
        fail("OpenEXR QA image pixel count changed")
    return image, values


def inspect_frame(root: Path, frame: int) -> dict[str, int | float]:
    label = f"{frame:04d}"
    depth_path = exact_regular_file(
        root / "depth" / f"frame_{label}.exr",
        ".exr",
    )
    mask_path = exact_regular_file(
        root / "mask" / f"frame_{label}.png",
        ".png",
    )
    depth_image, depth_values = load_pixels(depth_path)
    mask_image, mask_values = load_pixels(mask_path)
    try:
        finite_subject_count = 0
        minimum_depth = math.inf
        maximum_depth = 0.0
        for pixel in range(WIDTH * HEIGHT):
            offset = pixel * 4
            if mask_values[offset] < 0.5:
                continue
            depth = float(depth_values[offset])
            if math.isfinite(depth) and depth > 0.0:
                finite_subject_count += 1
                minimum_depth = min(minimum_depth, depth)
                maximum_depth = max(maximum_depth, depth)
        if (
            finite_subject_count < 1000
            or not math.isfinite(minimum_depth)
            or maximum_depth <= 0.0
        ):
            fail("OpenEXR QA found no finite positive subject depth")
        return {
            "frame": frame,
            "finiteSubjectDepthPixelCount": finite_subject_count,
            "minimumFiniteSubjectDepth": minimum_depth,
            "maximumFiniteSubjectDepth": maximum_depth,
        }
    finally:
        bpy.data.images.remove(depth_image)
        bpy.data.images.remove(mask_image)


def main() -> None:
    root = (Path.cwd() / ".reeditpro-lf-exr-qa").resolve(strict=True)
    if root.parent != Path.cwd().resolve(strict=True):
        fail("OpenEXR QA root is invalid")
    results = [inspect_frame(root, frame) for frame in FRAMES]
    output = {
        "version": VERSION,
        "blenderVersion": bpy.app.version_string,
        "widthPixels": WIDTH,
        "heightPixels": HEIGHT,
        "sampleFrames": list(FRAMES),
        "samples": results,
        "openExrLoadedByBlender": True,
        "finitePositiveSubjectDepthVerified": True,
    }
    result_path = root / "result.json"
    with result_path.open("xb") as handle:
        handle.write(
            json.dumps(
                output,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")
        )


if __name__ == "__main__":
    main()
