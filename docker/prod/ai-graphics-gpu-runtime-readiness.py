#!/usr/bin/env python3
"""Native GPU runtime readiness probe for ReeditPro AI graphics tools.

This script is intentionally stricter than the install smoke. It is meant to be
run inside a built GPU worker image on a native linux/amd64 NVIDIA runtime. It
checks CUDA visibility and package imports, but it does not download model
weights, load checkpoints, process media, call providers, create artifacts, or
approve tool execution.
"""

from __future__ import annotations

import argparse
import importlib
import json
import os
from pathlib import Path
import shutil
import subprocess
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

MODEL_MANIFEST_DIRS: dict[str, str] = {
    "sam2": "sam2",
    "birefnet": "birefnet",
    "real_esrgan": "real-esrgan",
    "rembg": "rembg",
    "transparent_background": "transparent-background",
}

FORBIDDEN_TRUE_ENV = [
    "MODEL_DOWNLOADS_ENABLED",
    "PROVIDER_EXECUTION_ENABLED",
    "REAL_MEDIA_INPUT_ENABLED",
    "PUBLIC_ARTIFACTS_ENABLED",
    "SIGNED_URLS_ENABLED",
    "TOOL_ROUTE_EXECUTION_ENABLED",
    "WORKER_EXECUTION_ENABLED",
    "SUPABASE_MUTATION_ENABLED",
    "GCS_UPLOAD_ENABLED",
]


def version_for(module: object) -> str:
    return str(
        getattr(module, "__version__", None)
        or getattr(module, "VERSION", None)
        or getattr(module, "version", None)
        or "unknown"
    )


def blocked(status: str, reason: str) -> int:
    print(json.dumps({
        "status": status,
        "reason": reason,
        "agentCanExecuteToolsNow": False,
        "toolRouteExecutionReadyNow": False,
        "workerExecutionReadyNow": False,
        "gpuModelRuntimeReadyNow": False,
        "runtimeBetaReadyNow": False,
        "modelWeightsLoaded": False,
        "mediaProcessed": False,
        "providerRuntimeUsed": False,
        "publicArtifactCreated": False,
        "signedUrlCreated": False,
    }, sort_keys=True))
    return 2


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


def env_is_true(name: str) -> bool:
    return os.environ.get(name, "false").lower() in {"1", "true", "yes", "on"}


def parse_capability(value: str) -> tuple[int, int]:
    parts = value.split(".", 1)
    if len(parts) != 2:
        raise argparse.ArgumentTypeError("Expected capability in major.minor form, for example 8.9")
    return int(parts[0]), int(parts[1])


def capability_meets(actual: tuple[int, int], minimum: tuple[int, int]) -> bool:
    return actual[0] > minimum[0] or (actual[0] == minimum[0] and actual[1] >= minimum[1])


def run_nvidia_smi() -> dict[str, object]:
    if not shutil.which("nvidia-smi"):
        return {"available": False, "reason": "nvidia-smi not found in PATH"}
    completed = subprocess.run(
        ["nvidia-smi", "--query-gpu=name,driver_version,memory.total", "--format=csv,noheader"],
        check=False,
        encoding="utf-8",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return {
        "available": completed.returncode == 0,
        "returncode": completed.returncode,
        "stdout": completed.stdout.strip(),
        "stderr": completed.stderr.strip(),
    }


def check_model_manifests(weight_dir: Path, profile: str) -> list[dict[str, str]]:
    required = MODEL_MANIFEST_DIRS.keys() if profile == "gpu_worker_ai_graphics" else [profile]
    results: list[dict[str, str]] = []
    for tool_id in required:
        directory = MODEL_MANIFEST_DIRS.get(tool_id)
        if directory is None:
            continue
        manifest_path = weight_dir / directory / "model_tree_manifest.json"
        if not manifest_path.exists():
            raise RuntimeError(f"Missing reviewed model manifest for {tool_id}: {manifest_path}")
        results.append({
            "toolId": tool_id,
            "manifestPath": str(manifest_path),
            "status": "present_not_loaded",
        })
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile", required=True, choices=sorted(PROFILES))
    parser.add_argument("--min-compute-capability", default="8.9", type=parse_capability)
    parser.add_argument("--require-model-weight-manifests", action="store_true")
    args = parser.parse_args()

    if not env_is_true("REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF"):
        return blocked(
            "blocked_missing_runtime_proof_opt_in",
            "Set REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true only inside the approved native NVIDIA runtime proof lane.",
        )
    for name in FORBIDDEN_TRUE_ENV:
        if env_is_true(name):
            return blocked("blocked_forbidden_runtime_side_effect_flag", f"{name} must stay false during readiness proof.")

    imports = import_modules(PROFILES[args.profile])

    torch = importlib.import_module("torch")
    nvidia_smi = run_nvidia_smi()
    if not nvidia_smi["available"]:
        return blocked("blocked_missing_nvidia_smi", "Native NVIDIA runtime is required before GPU/model readiness can pass.")
    if not torch.cuda.is_available():
        return blocked("blocked_missing_torch_cuda", "torch.cuda.is_available() is false.")

    device_count = torch.cuda.device_count()
    if device_count < 1:
        return blocked("blocked_missing_cuda_device", "No CUDA devices are visible to Torch.")
    capability = torch.cuda.get_device_capability(0)
    if not capability_meets(capability, args.min_compute_capability):
        return blocked(
            "blocked_cuda_capability_below_target",
            f"CUDA capability {capability[0]}.{capability[1]} is below required {args.min_compute_capability[0]}.{args.min_compute_capability[1]}.",
        )

    probe_tensor = torch.ones((1,), device="cuda")
    probe_value = float((probe_tensor + 1).item())
    if probe_value != 2.0:
        return blocked("blocked_cuda_tensor_probe_failed", "Tiny CUDA tensor probe did not return the expected value.")

    manifest_results: list[dict[str, str]] = []
    if args.require_model_weight_manifests:
        weight_dir = Path(os.environ.get("REEDITPRO_MODEL_WEIGHT_DIR", "/opt/reeditpro/model-weights"))
        manifest_results = check_model_manifests(weight_dir, args.profile)

    print(json.dumps({
        "status": "passed",
        "profile": args.profile,
        "imports": imports,
        "nvidiaSmi": nvidia_smi,
        "cuda": {
            "available": True,
            "deviceCount": device_count,
            "deviceName": torch.cuda.get_device_name(0),
            "capability": f"{capability[0]}.{capability[1]}",
            "minCapabilityRequired": f"{args.min_compute_capability[0]}.{args.min_compute_capability[1]}",
            "tinyTensorProbePassed": True,
        },
        "modelManifestChecks": manifest_results,
        "modelWeightsLoaded": False,
        "mediaProcessed": False,
        "providerRuntimeUsed": False,
        "toolRouteExecutionReadyNow": False,
        "workerExecutionReadyNow": False,
        "runtimeBetaReadyNow": False,
        "publicArtifactCreated": False,
        "signedUrlCreated": False,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
