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
import signal
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
    "rembg": [
        ("torch", "torch"),
        ("numpy", "numpy"),
        ("PIL", "PIL"),
        ("cv2", "cv2"),
        ("rembg", "rembg"),
    ],
    "transparent_background": [
        ("torch", "torch"),
        ("torchvision", "torchvision"),
        ("numpy", "numpy"),
        ("PIL", "PIL"),
        ("transparent_background", "transparent_background"),
    ],
}


def version_for(module: object) -> str:
    return str(
        getattr(module, "__version__", None)
        or getattr(module, "VERSION", None)
        or getattr(module, "version", None)
        or "unknown"
    )


class ImportTimeoutError(RuntimeError):
    pass


def import_timeout_handler(signum, frame) -> None:  # noqa: ARG001
    raise ImportTimeoutError("Timed out while importing module")


def import_modules(
    modules: Iterable[tuple[str, str]],
    *,
    timeout_seconds: int,
) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    for label, module_name in modules:
        print(f"ai_graphics_gpu_install_smoke: importing {label} ({module_name})", file=sys.stderr, flush=True)
        previous_handler = signal.signal(signal.SIGALRM, import_timeout_handler)
        signal.alarm(timeout_seconds)
        try:
            module = importlib.import_module(module_name)
        except ImportTimeoutError as error:
            raise RuntimeError(
                f"Import timed out after {timeout_seconds}s for {label} ({module_name})"
            ) from error
        finally:
            signal.alarm(0)
            signal.signal(signal.SIGALRM, previous_handler)
        print(f"ai_graphics_gpu_install_smoke: imported {label}", file=sys.stderr, flush=True)
        results.append({
            "label": label,
            "module": module_name,
            "version": version_for(module),
        })
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile", required=True, choices=sorted(PROFILES))
    parser.add_argument("--per-import-timeout-seconds", type=int, default=180)
    args = parser.parse_args()

    if os.environ.get("MODEL_DOWNLOADS_ENABLED", "false").lower() == "true":
        raise SystemExit("MODEL_DOWNLOADS_ENABLED must stay false during install proof.")
    if os.environ.get("PROVIDER_EXECUTION_ENABLED", "false").lower() == "true":
        raise SystemExit("PROVIDER_EXECUTION_ENABLED must stay false during install proof.")

    results = import_modules(
        PROFILES[args.profile],
        timeout_seconds=args.per_import_timeout_seconds,
    )
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
