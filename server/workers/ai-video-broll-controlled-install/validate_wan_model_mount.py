#!/usr/bin/env python3
"""No-inference Wan model mount/layout validator.

This validator is intentionally narrow. It checks local path shape and expected
file/layout markers only. It does not import torch, diffusers, transformers, or
any model package; it does not hash large model files; it does not create media;
and it does not execute inference.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path


VALIDATOR_VERSION = "ai-video-broll-wan-mount-validator-1"
APPROVED_MODEL_ID = "Wan-AI/Wan2.1-T2V-1.3B"
APPROVED_MODEL_REVISION = "37ec512624d61f7aa208f7ea8140a131f93afc9a"

CANONICAL_PRODUCTION_MOUNT_PREFIX = Path("/opt/reeditpro/model-weights/ai-video-broll")
CONTROLLED_PROOF_CACHE_PREFIX = Path("/tmp/reeditpro-private-model-cache")
CONTROLLED_EVIDENCE_CACHE_PREFIX = Path("/Volumes/backup/reeditpro-model-cache/ai-video-broll")

ORIGINAL_WAN_RUNTIME_ESSENTIAL_FILES = (
    "config.json",
    "diffusion_pytorch_model.safetensors",
    "Wan2.1_VAE.pth",
    "models_t5_umt5-xxl-enc-bf16.pth",
    "google/umt5-xxl/spiece.model",
    "google/umt5-xxl/tokenizer.json",
)

DIFFUSERS_CACHE_MARKERS = (
    "model_index.json",
    "transformer",
    "vae",
    "scheduler",
)

FORBIDDEN_VALUE_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"https?://",
        r"gs://",
        r"s3://",
        r"x-amz-signature",
        r"x-amz-credential",
        r"signature=",
        r"key-pair-id=",
        r"authorization\s*:\s*bearer",
        r"api[_-]?key",
        r"service[_-]?role",
        r"secret",
        r"password",
        r"raw[_-]?prompt",
        r"raw[_-]?chat",
        r"user[_-]?media",
        r"customer[_-]?data",
    )
)


class MountValidationError(RuntimeError):
    """Raised when a mount path cannot be inspected safely."""


@dataclass(frozen=True)
class WanMountValidationResult:
    validatorVersion: str
    modelId: str
    modelRevision: str
    candidateMountPath: str
    pathAllowed: bool
    pathPrefixKind: str
    layout: str
    exists: bool
    runnableWithCurrentProofRunner: bool
    missingRequiredFiles: list[str]
    diffusersMarkersPresent: list[str]
    originalRuntimeEssentialFilesPresent: list[str]
    modelImportsRun: bool
    modelInferenceRun: bool
    generatedVideoCreated: bool
    generatedAssetsCreated: bool
    safeForFutureNoInferenceReview: bool
    reason: str


def _is_relative_to(path: Path, prefix: Path) -> bool:
    try:
        path.resolve().relative_to(prefix.resolve())
        return True
    except ValueError:
        return False


def _reject_forbidden_value(label: str, value: str) -> None:
    for pattern in FORBIDDEN_VALUE_PATTERNS:
        if pattern.search(value):
            raise MountValidationError(f"{label} contains forbidden value shape")


def _classify_allowed_prefix(path: Path) -> str:
    if _is_relative_to(path, CANONICAL_PRODUCTION_MOUNT_PREFIX):
        return "canonical_production_mount_prefix"
    if _is_relative_to(path, CONTROLLED_PROOF_CACHE_PREFIX):
        return "controlled_proof_cache_prefix"
    if _is_relative_to(path, CONTROLLED_EVIDENCE_CACHE_PREFIX):
        return "controlled_evidence_cache_prefix"
    return "disallowed_prefix"


def _normalize_candidate_mount(value: str) -> Path:
    _reject_forbidden_value("candidate mount path", value)
    path = Path(value)
    if not path.is_absolute():
        raise MountValidationError("candidate mount path must be absolute")
    if ".." in path.parts:
        raise MountValidationError("candidate mount path must not contain parent traversal")
    return path


def validate_wan_mount(candidate_mount: str) -> WanMountValidationResult:
    mount_path = _normalize_candidate_mount(candidate_mount)
    prefix_kind = _classify_allowed_prefix(mount_path)
    path_allowed = prefix_kind != "disallowed_prefix"

    if not path_allowed:
        return WanMountValidationResult(
            validatorVersion=VALIDATOR_VERSION,
            modelId=APPROVED_MODEL_ID,
            modelRevision=APPROVED_MODEL_REVISION,
            candidateMountPath=str(mount_path),
            pathAllowed=False,
            pathPrefixKind=prefix_kind,
            layout="disallowed_path",
            exists=False,
            runnableWithCurrentProofRunner=False,
            missingRequiredFiles=["."],
            diffusersMarkersPresent=[],
            originalRuntimeEssentialFilesPresent=[],
            modelImportsRun=False,
            modelInferenceRun=False,
            generatedVideoCreated=False,
            generatedAssetsCreated=False,
            safeForFutureNoInferenceReview=False,
            reason="candidate mount path is outside approved local prefixes",
        )

    exists = mount_path.exists()
    if not exists:
        return WanMountValidationResult(
            validatorVersion=VALIDATOR_VERSION,
            modelId=APPROVED_MODEL_ID,
            modelRevision=APPROVED_MODEL_REVISION,
            candidateMountPath=str(mount_path),
            pathAllowed=True,
            pathPrefixKind=prefix_kind,
            layout="missing_mount",
            exists=False,
            runnableWithCurrentProofRunner=False,
            missingRequiredFiles=["."],
            diffusersMarkersPresent=[],
            originalRuntimeEssentialFilesPresent=[],
            modelImportsRun=False,
            modelInferenceRun=False,
            generatedVideoCreated=False,
            generatedAssetsCreated=False,
            safeForFutureNoInferenceReview=True,
            reason="candidate mount path is allowed but does not exist",
        )

    diffusers_markers_present = [marker for marker in DIFFUSERS_CACHE_MARKERS if (mount_path / marker).exists()]
    original_files_present = [
        relative for relative in ORIGINAL_WAN_RUNTIME_ESSENTIAL_FILES if (mount_path / relative).exists()
    ]

    if "model_index.json" in diffusers_markers_present:
        missing = [marker for marker in DIFFUSERS_CACHE_MARKERS if not (mount_path / marker).exists()]
        return WanMountValidationResult(
            validatorVersion=VALIDATOR_VERSION,
            modelId=APPROVED_MODEL_ID,
            modelRevision=APPROVED_MODEL_REVISION,
            candidateMountPath=str(mount_path),
            pathAllowed=True,
            pathPrefixKind=prefix_kind,
            layout="diffusers_cache_layout",
            exists=True,
            runnableWithCurrentProofRunner=len(missing) == 0,
            missingRequiredFiles=missing,
            diffusersMarkersPresent=diffusers_markers_present,
            originalRuntimeEssentialFilesPresent=original_files_present,
            modelImportsRun=False,
            modelInferenceRun=False,
            generatedVideoCreated=False,
            generatedAssetsCreated=False,
            safeForFutureNoInferenceReview=True,
            reason="diffusers layout markers inspected without imports",
        )

    missing_original = [
        relative for relative in ORIGINAL_WAN_RUNTIME_ESSENTIAL_FILES if not (mount_path / relative).exists()
    ]
    if not missing_original:
        return WanMountValidationResult(
            validatorVersion=VALIDATOR_VERSION,
            modelId=APPROVED_MODEL_ID,
            modelRevision=APPROVED_MODEL_REVISION,
            candidateMountPath=str(mount_path),
            pathAllowed=True,
            pathPrefixKind=prefix_kind,
            layout="original_wan_runtime_essential_cache",
            exists=True,
            runnableWithCurrentProofRunner=False,
            missingRequiredFiles=[],
            diffusersMarkersPresent=diffusers_markers_present,
            originalRuntimeEssentialFilesPresent=original_files_present,
            modelImportsRun=False,
            modelInferenceRun=False,
            generatedVideoCreated=False,
            generatedAssetsCreated=False,
            safeForFutureNoInferenceReview=True,
            reason="original Wan runtime-essential layout requires a future approved adapter or diffusers-format cache",
        )

    return WanMountValidationResult(
        validatorVersion=VALIDATOR_VERSION,
        modelId=APPROVED_MODEL_ID,
        modelRevision=APPROVED_MODEL_REVISION,
        candidateMountPath=str(mount_path),
        pathAllowed=True,
        pathPrefixKind=prefix_kind,
        layout="unknown_cache_layout",
        exists=True,
        runnableWithCurrentProofRunner=False,
        missingRequiredFiles=missing_original,
        diffusersMarkersPresent=diffusers_markers_present,
        originalRuntimeEssentialFilesPresent=original_files_present,
        modelImportsRun=False,
        modelInferenceRun=False,
        generatedVideoCreated=False,
        generatedAssetsCreated=False,
        safeForFutureNoInferenceReview=False,
        reason="mount is neither complete original Wan runtime-essential layout nor complete diffusers layout",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="No-inference Wan model mount/layout validator.")
    parser.add_argument("--candidate-mount", required=True)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        result = validate_wan_mount(args.candidate_mount)
    except MountValidationError as error:
        print(json.dumps({
            "validatorVersion": VALIDATOR_VERSION,
            "modelId": APPROVED_MODEL_ID,
            "modelRevision": APPROVED_MODEL_REVISION,
            "pathAllowed": False,
            "layout": "invalid_input",
            "modelImportsRun": False,
            "modelInferenceRun": False,
            "generatedVideoCreated": False,
            "generatedAssetsCreated": False,
            "safeForFutureNoInferenceReview": False,
            "reason": str(error),
        }, indent=2))
        return 2

    print(json.dumps(asdict(result), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
