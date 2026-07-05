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
import platform
import re
import shutil
import subprocess
import sys
from typing import Iterable, Any


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

MODEL_MANIFEST_DIRS: dict[str, str] = {
    "sam2": "sam2",
    "birefnet": "birefnet",
    "real_esrgan": "real-esrgan",
    "rembg": "rembg",
    "transparent_background": "transparent-background",
}

MODEL_MANIFEST_TEMPLATE_IDS: dict[str, str] = {
    "sam2": "sam2_checkpoint",
    "birefnet": "birefnet_model",
    "real_esrgan": "real_esrgan_model",
    "rembg": "rembg_model",
    "transparent_background": "transparent_background_model",
}

MODEL_MANIFEST_SOURCE_CANDIDATE_IDS: dict[str, str] = {
    "sam2": "facebook_sam2_1_hiera_tiny_existing_staging_evidence",
    "birefnet": "zhengpeng7_birefnet_official_weights_review_candidate",
    "real_esrgan": "xinntao_real_esrgan_x4plus",
    "rembg": "danielgatis_rembg_isnet_general_use_review_candidate",
    "transparent_background": "plemeri_transparent_background_base_ckpt_review_candidate",
}

MODEL_MANIFEST_SUGGESTED_CHECKSUM_SHA256: dict[str, str | None] = {
    "sam2": "45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2",
    "birefnet": "1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7",
    "real_esrgan": "4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1",
    "rembg": None,
    "transparent_background": None,
}

MODEL_MANIFEST_CHECKSUM_EVIDENCE_STATUS: dict[str, str] = {
    "sam2": "accepted_from_existing_internal_evidence_private_manifest_still_required",
    "birefnet": "accepted_from_existing_internal_evidence_private_manifest_still_required",
    "real_esrgan": "release_asset_checksum_required_before_private_manifest",
    "rembg": "checksum_required_before_private_manifest",
    "transparent_background": "checksum_required_before_private_manifest",
}

REQUIRED_MODEL_MANIFEST_FIELDS = [
    "manifestId",
    "toolId",
    "templateId",
    "sourceCandidateId",
    "privateArtifactRef",
    "checksumSha256",
    "checksumEvidenceRef",
    "sourceLicenseRef",
    "modelCardRef",
    "checksumEvidenceReviewed",
    "commercialUseReviewed",
    "redistributionReviewed",
    "qualityReviewed",
    "securityReviewed",
    "provenanceReviewed",
    "approvedForInternalBeta",
]

REVIEW_BOOLEAN_FIELDS = [
    "checksumEvidenceReviewed",
    "commercialUseReviewed",
    "redistributionReviewed",
    "qualityReviewed",
    "securityReviewed",
    "provenanceReviewed",
    "approvedForInternalBeta",
]

FORBIDDEN_MANIFEST_TRUE_FIELDS = [
    "modelWeightsDownloaded",
    "modelWeightsLoaded",
    "modelInferencePerformed",
    "mediaProcessingPerformed",
    "providerRuntimePerformed",
    "toolExecutionPerformed",
    "workerExecutionPerformed",
    "routeExecutionPerformed",
    "publicArtifactCreated",
    "signedUrlCreated",
]

SHA256_PATTERN = re.compile(r"^[a-fA-F0-9]{64}$")

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

PROBE_NAME = "reeditpro_ai_graphics_gpu_runtime_readiness"
PROBE_VERSION = "2026-06-26.native-gpu-proof-v1"


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


def require_non_empty_string(manifest: dict[str, Any], field: str, tool_id: str) -> str:
    value = manifest.get(field)
    if not isinstance(value, str) or not value.strip():
        raise RuntimeError(f"{tool_id} model manifest field {field} must be a non-empty string.")
    return value.strip()


def validate_private_artifact_ref(value: str, tool_id: str, field_name: str = "privateArtifactRef") -> None:
    lower = value.lower()
    if lower.startswith("http://") or lower.startswith("https://"):
        raise RuntimeError(f"{tool_id} {field_name} must not be an HTTP(S) URL.")
    if "x-goog-signature=" in lower or "x-amz-signature=" in lower or "signature=" in lower:
        raise RuntimeError(f"{tool_id} {field_name} must not be a signed URL.")
    if lower.startswith("public/") or "/public/" in lower or lower.startswith("gs://public"):
        raise RuntimeError(f"{tool_id} {field_name} must not point at a public artifact path.")
    allowed_private_namespace = lower.startswith("private://") or \
        lower.startswith("reeditpro-private://") or \
        lower.startswith("reeditpro-private-artifact-ref-")
    if not allowed_private_namespace:
        raise RuntimeError(
            f"{tool_id} {field_name} must use a reviewed private artifact ref namespace."
        )


def validate_model_manifest(manifest_path: Path, tool_id: str) -> dict[str, str]:
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Invalid JSON model manifest for {tool_id}: {manifest_path}: {error}") from error
    if not isinstance(manifest, dict):
        raise RuntimeError(f"{tool_id} model manifest must be a JSON object: {manifest_path}")

    missing = [field for field in REQUIRED_MODEL_MANIFEST_FIELDS if field not in manifest]
    if missing:
        raise RuntimeError(f"{tool_id} model manifest missing required fields: {', '.join(missing)}")

    manifest_tool_id = require_non_empty_string(manifest, "toolId", tool_id)
    if manifest_tool_id != tool_id:
        raise RuntimeError(f"{tool_id} model manifest toolId mismatch: {manifest_tool_id}")

    template_id = require_non_empty_string(manifest, "templateId", tool_id)
    expected_template_id = MODEL_MANIFEST_TEMPLATE_IDS[tool_id]
    if template_id != expected_template_id:
        raise RuntimeError(f"{tool_id} model manifest templateId must be {expected_template_id}, got {template_id}")

    source_candidate_id = require_non_empty_string(manifest, "sourceCandidateId", tool_id)
    expected_source_candidate_id = MODEL_MANIFEST_SOURCE_CANDIDATE_IDS[tool_id]
    if source_candidate_id != expected_source_candidate_id:
        raise RuntimeError(
            f"{tool_id} model manifest sourceCandidateId must be {expected_source_candidate_id}, got {source_candidate_id}"
        )

    manifest_id = require_non_empty_string(manifest, "manifestId", tool_id)
    private_artifact_ref = require_non_empty_string(manifest, "privateArtifactRef", tool_id)
    validate_private_artifact_ref(private_artifact_ref, tool_id)

    checksum = require_non_empty_string(manifest, "checksumSha256", tool_id)
    if not SHA256_PATTERN.fullmatch(checksum):
        raise RuntimeError(f"{tool_id} model manifest checksumSha256 must be a 64-character hex SHA-256 digest.")
    expected_checksum = MODEL_MANIFEST_SUGGESTED_CHECKSUM_SHA256[tool_id]
    if expected_checksum and checksum.lower() != expected_checksum.lower():
        raise RuntimeError(
            f"{tool_id} model manifest checksumSha256 must match reviewed source-catalog checksum."
        )

    checksum_evidence_ref = require_non_empty_string(manifest, "checksumEvidenceRef", tool_id)
    validate_private_artifact_ref(checksum_evidence_ref, tool_id, "checksumEvidenceRef")

    require_non_empty_string(manifest, "sourceLicenseRef", tool_id)
    require_non_empty_string(manifest, "modelCardRef", tool_id)

    for field in REVIEW_BOOLEAN_FIELDS:
        if manifest.get(field) is not True:
            raise RuntimeError(f"{tool_id} model manifest field {field} must be true.")

    for field in FORBIDDEN_MANIFEST_TRUE_FIELDS:
        if manifest.get(field) is True:
            raise RuntimeError(f"{tool_id} model manifest must not claim {field}=true.")

    return {
        "toolId": tool_id,
        "manifestPath": str(manifest_path),
        "manifestId": manifest_id,
        "templateId": template_id,
        "sourceCandidateId": source_candidate_id,
        "sourceCatalogSuggestedChecksumSha256": expected_checksum,
        "sourceCatalogChecksumEvidenceStatus": MODEL_MANIFEST_CHECKSUM_EVIDENCE_STATUS[tool_id],
        "privateArtifactRefStatus": "present_private_ref_not_logged",
        "checksumEvidenceRefStatus": "present_private_ref_not_logged",
        "checksumSha256": checksum,
        "status": "validated_not_loaded",
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
        results.append(validate_model_manifest(manifest_path, tool_id))
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
        try:
            manifest_results = check_model_manifests(weight_dir, args.profile)
        except RuntimeError as error:
            return blocked("blocked_model_manifest_validation_failed", str(error))

    print(json.dumps({
        "status": "passed",
        "profile": args.profile,
        "proofMetadata": {
            "probeName": PROBE_NAME,
            "probeVersion": PROBE_VERSION,
            "runtimePlatform": "linux",
            "runtimeMachine": platform.machine(),
            "pythonVersion": platform.python_version(),
            "nativeGpuRuntimeProof": True,
            "modelWeightsLoaded": False,
            "modelInferencePerformed": False,
            "mediaProcessingPerformed": False,
            "providerRuntimePerformed": False,
            "publicArtifactCreated": False,
            "signedUrlCreated": False,
        },
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
