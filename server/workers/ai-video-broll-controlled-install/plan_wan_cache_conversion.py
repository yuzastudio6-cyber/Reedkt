#!/usr/bin/env python3
"""No-copy Wan original-cache adapter / Diffusers conversion planner.

This planner uses the no-inference mount validator to inspect layout metadata
and emits future conversion options. It does not import model runtimes, copy or
link model files, hash large weights, create a Diffusers cache, or run
inference.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

from validate_wan_model_mount import (
    APPROVED_MODEL_ID,
    APPROVED_MODEL_REVISION,
    ORIGINAL_WAN_RUNTIME_ESSENTIAL_FILES,
    VALIDATOR_VERSION,
    validate_wan_mount,
)


PLANNER_VERSION = "ai-video-broll-wan-cache-conversion-plan-1"

FUTURE_DIFFUSERS_LAYOUT_REQUIREMENTS = (
    "model_index.json",
    "transformer/",
    "vae/",
    "scheduler/",
    "tokenizer/",
    "text_encoder/",
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


@dataclass(frozen=True)
class ConversionOption:
    optionId: str
    status: str
    description: str
    allowedNow: bool
    requiresModelImportLater: bool
    requiresCopyOrMaterializationLater: bool
    requiresOwnerApproval: bool
    blockers: list[str]


@dataclass(frozen=True)
class WanCacheConversionPlan:
    plannerVersion: str
    validatorVersion: str
    modelId: str
    modelRevision: str
    sourceCachePath: str
    sourceLayout: str
    sourcePathAllowed: bool
    sourceExists: bool
    sourceMissingRequiredFiles: list[str]
    originalRuntimeEssentialFiles: list[str]
    futureDiffusersLayoutRequirements: list[str]
    recommendedOption: str
    options: list[ConversionOption]
    modelWeightsCopiedNow: bool
    diffusersCacheCreatedNow: bool
    symlinksCreatedNow: bool
    modelImportsRun: bool
    modelInferenceRun: bool
    generatedVideoCreated: bool
    generatedAssetsCreated: bool
    safeForFutureOwnerReview: bool
    nextPrompt: str


class ConversionPlanningError(RuntimeError):
    """Raised when conversion planning input is unsafe."""


def _reject_forbidden_value(label: str, value: str) -> None:
    for pattern in FORBIDDEN_VALUE_PATTERNS:
        if pattern.search(value):
            raise ConversionPlanningError(f"{label} contains forbidden value shape")


def _path_exists_without_following_external_runtime(value: str) -> bool:
    return Path(value).exists()


def build_wan_cache_conversion_plan(source_cache: str) -> WanCacheConversionPlan:
    _reject_forbidden_value("source cache path", source_cache)
    validation = validate_wan_mount(source_cache)

    options = [
        ConversionOption(
            optionId="original_cache_adapter",
            status="future_owner_review_required",
            description=(
                "Teach the proof runner to consume the approved original Wan runtime-essential "
                "layout directly, without reformatting the cache."
            ),
            allowedNow=False,
            requiresModelImportLater=True,
            requiresCopyOrMaterializationLater=False,
            requiresOwnerApproval=True,
            blockers=[
                "requires runner adapter contract",
                "requires no-auto-download guard review",
                "requires GPU proof VM quota and runtime owner acceptance",
                "requires no-inference adapter validation before model import",
            ],
        ),
        ConversionOption(
            optionId="diffusers_cache_materialization",
            status="future_owner_review_required",
            description=(
                "Materialize a Diffusers-style cache layout from the approved original cache "
                "only after owner approval, checksum policy, and no-copy/no-symlink decision."
            ),
            allowedNow=False,
            requiresModelImportLater=False,
            requiresCopyOrMaterializationLater=True,
            requiresOwnerApproval=True,
            blockers=[
                "requires approved materialization/copy or symlink policy",
                "requires model_index and component layout source-of-truth",
                "requires checksum/provenance preservation plan",
                "requires cleanup and private cache retention policy",
            ],
        ),
        ConversionOption(
            optionId="defer_until_vm_mount",
            status="available_as_safe_default",
            description=(
                "Keep the validated original cache as evidence and defer runtime layout "
                "materialization until a future approved VM/mount step."
            ),
            allowedNow=True,
            requiresModelImportLater=False,
            requiresCopyOrMaterializationLater=False,
            requiresOwnerApproval=False,
            blockers=[
                "does not make the proof runner runnable",
                "keeps generated video execution blocked",
            ],
        ),
    ]

    if validation.layout != "original_wan_runtime_essential_cache" or validation.missingRequiredFiles:
        recommended = "defer_until_vm_mount"
        safe_for_review = validation.pathAllowed and validation.exists
    else:
        recommended = "original_cache_adapter"
        safe_for_review = True

    return WanCacheConversionPlan(
        plannerVersion=PLANNER_VERSION,
        validatorVersion=VALIDATOR_VERSION,
        modelId=APPROVED_MODEL_ID,
        modelRevision=APPROVED_MODEL_REVISION,
        sourceCachePath=source_cache,
        sourceLayout=validation.layout,
        sourcePathAllowed=validation.pathAllowed,
        sourceExists=_path_exists_without_following_external_runtime(source_cache),
        sourceMissingRequiredFiles=validation.missingRequiredFiles,
        originalRuntimeEssentialFiles=list(ORIGINAL_WAN_RUNTIME_ESSENTIAL_FILES),
        futureDiffusersLayoutRequirements=list(FUTURE_DIFFUSERS_LAYOUT_REQUIREMENTS),
        recommendedOption=recommended,
        options=options,
        modelWeightsCopiedNow=False,
        diffusersCacheCreatedNow=False,
        symlinksCreatedNow=False,
        modelImportsRun=False,
        modelInferenceRun=False,
        generatedVideoCreated=False,
        generatedAssetsCreated=False,
        safeForFutureOwnerReview=safe_for_review,
        nextPrompt=(
            "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-8: author no-inference Wan "
            "original-cache adapter contract, no model import"
        ),
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="No-copy Wan original-cache adapter / Diffusers conversion planner."
    )
    parser.add_argument("--source-cache", required=True)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        plan = build_wan_cache_conversion_plan(args.source_cache)
    except ConversionPlanningError as error:
        print(json.dumps({
            "plannerVersion": PLANNER_VERSION,
            "modelId": APPROVED_MODEL_ID,
            "modelRevision": APPROVED_MODEL_REVISION,
            "modelWeightsCopiedNow": False,
            "diffusersCacheCreatedNow": False,
            "symlinksCreatedNow": False,
            "modelImportsRun": False,
            "modelInferenceRun": False,
            "generatedVideoCreated": False,
            "generatedAssetsCreated": False,
            "safeForFutureOwnerReview": False,
            "reason": str(error),
        }, indent=2))
        return 2

    print(json.dumps(asdict(plan), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
