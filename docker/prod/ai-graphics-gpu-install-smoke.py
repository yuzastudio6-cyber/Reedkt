#!/usr/bin/env python3
"""Import-only GPU worker install proof for ReeditPro AI graphics tools.

This script is safe for Docker build-time checks. It imports packages and
prints versions, but it does not load model weights, process media, call
providers, create artifacts, or require CUDA devices.
"""

from __future__ import annotations

import argparse
import importlib
import json
import os
import sys
from typing import Iterable


PROFILES: dict[str, list[tuple[str, str]]] = {
    "gpu_worker_ai_graphics": [
        ("torch", "torch"),
        ("torchvision", "torchvision"),
        ("transformers", "transformers"),
        ("kornia", "kornia"),
        ("rembg", "rembg"),
        ("transparent_background", "transparent_background"),
        ("realesrgan", "realesrgan"),
        ("sam2", "sam2"),
    ],
    "sam2": [
        ("torch", "torch"),
        ("torchvision", "torchvision"),
        ("numpy", "numpy"),
        ("PIL", "PIL"),
        ("cv2", "cv2"),
        ("hydra", "hydra"),
        ("iopath", "iopath"),
        ("sam2", "sam2"),
    ],
    "birefnet": [
        ("torch", "torch"),
        ("torchvision", "torchvision"),
        ("transformers", "transformers"),
        ("safetensors", "safetensors"),
        ("PIL", "PIL"),
        ("cv2", "cv2"),
        ("numpy", "numpy"),
        ("timm", "timm"),
        ("kornia", "kornia"),
        ("einops", "einops"),
        ("scipy", "scipy"),
        ("skimage", "skimage"),
    ],
    "real_esrgan": [
        ("torch", "torch"),
        ("torchvision", "torchvision"),
        ("numpy", "numpy"),
        ("PIL", "PIL"),
        ("cv2", "cv2"),
        ("basicsr", "basicsr"),
        ("realesrgan", "realesrgan"),
    ],
}


def version_for(module: object) -> str:
    return str(
        getattr(module, "__version__", None)
        or getattr(module, "VERSION", None)
        or getattr(module, "version", None)
        or "unknown"
    )


def import_modules(modules: Iterable[tuple[str, str]]) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    for label, module_name in modules:
        module = importlib.import_module(module_name)
        results.append({
            "label": label,
            "module": module_name,
            "version": version_for(module),
        })
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile", required=True, choices=sorted(PROFILES))
    args = parser.parse_args()

    if os.environ.get("MODEL_DOWNLOADS_ENABLED", "false").lower() == "true":
        raise SystemExit("MODEL_DOWNLOADS_ENABLED must stay false during install proof.")
    if os.environ.get("PROVIDER_EXECUTION_ENABLED", "false").lower() == "true":
        raise SystemExit("PROVIDER_EXECUTION_ENABLED must stay false during install proof.")

    results = import_modules(PROFILES[args.profile])
    print(json.dumps({
        "status": "passed",
        "profile": args.profile,
        "imports": results,
        "modelWeightsLoaded": False,
        "mediaProcessed": False,
        "providerRuntimeUsed": False,
        "cudaRuntimeRequired": False,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
