#!/usr/bin/env python3
"""No-inference Wan original-cache adapter contract builder.

This helper turns a validated original Wan cache layout into a structured
adapter contract for future review. It does not import model runtimes, read
large weight contents, copy files, create symlinks, or run inference.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path

from plan_wan_cache_conversion import build_wan_cache_conversion_plan
from validate_wan_model_mount import APPROVED_MODEL_ID, APPROVED_MODEL_REVISION


CONTRACT_VERSION = "ai-video-broll-wan-original-cache-adapter-contract-1"

ADAPTER_INPUT_ROLE_MAP = (
    ("config.json", "pipeline_config_metadata", "metadata_only"),
    ("diffusion_pytorch_model.safetensors", "transformer_diffusion_weight", "future_model_weight"),
    ("Wan2.1_VAE.pth", "vae_weight", "future_model_weight"),
    ("models_t5_umt5-xxl-enc-bf16.pth", "text_encoder_weight", "future_model_weight"),
    ("google/umt5-xxl/spiece.model", "tokenizer_sentencepiece_model", "future_tokenizer_asset"),
    ("google/umt5-xxl/tokenizer.json", "tokenizer_json", "future_tokenizer_asset"),
)


@dataclass(frozen=True)
class AdapterInput:
    relativePath: str
    adapterRole: str
    materializationClass: str
    exists: bool
    sizeBytesKnown: bool
    sizeBytes: int | None
    contentsRead: bool


@dataclass(frozen=True)
class WanOriginalCacheAdapterContract:
    contractVersion: str
    modelId: str
    modelRevision: str
    sourceCachePath: str
    sourceLayout: str
    recommendedConversionOption: str
    adapterStatus: str
    adapterAllowedNow: bool
    validForNoInferenceReview: bool
    requiredInputs: list[AdapterInput]
    missingInputs: list[str]
    futureRuntimeRequirements: list[str]
    modelWeightsCopiedNow: bool
    diffusersCacheCreatedNow: bool
    symlinksCreatedNow: bool
    modelImportsRun: bool
    modelInferenceRun: bool
    generatedVideoCreated: bool
    generatedAssetsCreated: bool
    nextPrompt: str


def _adapter_input(cache_path: Path, relative_path: str, adapter_role: str, materialization_class: str) -> AdapterInput:
    file_path = cache_path / relative_path
    exists = file_path.exists()
    size = file_path.stat().st_size if exists and file_path.is_file() else None
    return AdapterInput(
        relativePath=relative_path,
        adapterRole=adapter_role,
        materializationClass=materialization_class,
        exists=exists,
        sizeBytesKnown=size is not None,
        sizeBytes=size,
        contentsRead=False,
    )


def build_wan_original_cache_adapter_contract(source_cache: str) -> WanOriginalCacheAdapterContract:
    conversion_plan = build_wan_cache_conversion_plan(source_cache)
    cache_path = Path(source_cache)
    inputs = [
        _adapter_input(cache_path, relative_path, adapter_role, materialization_class)
        for relative_path, adapter_role, materialization_class in ADAPTER_INPUT_ROLE_MAP
    ]
    missing = [item.relativePath for item in inputs if not item.exists]
    valid_for_review = (
        conversion_plan.sourcePathAllowed
        and conversion_plan.sourceExists
        and conversion_plan.sourceLayout == "original_wan_runtime_essential_cache"
        and not missing
    )

    return WanOriginalCacheAdapterContract(
        contractVersion=CONTRACT_VERSION,
        modelId=APPROVED_MODEL_ID,
        modelRevision=APPROVED_MODEL_REVISION,
        sourceCachePath=source_cache,
        sourceLayout=conversion_plan.sourceLayout,
        recommendedConversionOption=conversion_plan.recommendedOption,
        adapterStatus="future_owner_review_required",
        adapterAllowedNow=False,
        validForNoInferenceReview=valid_for_review,
        requiredInputs=inputs,
        missingInputs=missing,
        futureRuntimeRequirements=[
            "approved adapter implementation inside proof runner",
            "no-auto-download guards",
            "offline environment guards",
            "GPU quota and VM/runtime owner acceptance",
            "pre-import adapter validation",
            "private proof output and QA evidence",
        ],
        modelWeightsCopiedNow=False,
        diffusersCacheCreatedNow=False,
        symlinksCreatedNow=False,
        modelImportsRun=False,
        modelInferenceRun=False,
        generatedVideoCreated=False,
        generatedAssetsCreated=False,
        nextPrompt=(
            "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-9: integrate Wan original-cache "
            "adapter validation into proof runner, no model import"
        ),
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="No-inference Wan original-cache adapter contract builder.")
    parser.add_argument("--source-cache", required=True)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    contract = build_wan_original_cache_adapter_contract(args.source_cache)
    print(json.dumps(asdict(contract), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
