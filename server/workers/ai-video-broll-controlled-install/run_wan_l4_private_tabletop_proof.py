#!/usr/bin/env python3
"""Fail-closed private Wan L4 tabletop proof runner.

This runner is source only until a later approved execution gate runs it on the
private proof VM. It validates the approved envelope first, refuses ad hoc
inputs, and blocks before model imports when the cache layout is not an
approved runnable layout.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


RUNNER_VERSION = "ai-video-broll-gen-9j-runner-author-1"
APPROVED_MODEL_ID = "Wan-AI/Wan2.1-T2V-1.3B"
APPROVED_MODEL_REVISION = "37ec512624d61f7aa208f7ea8140a131f93afc9a"
APPROVED_FIXTURE = "non-user-media-tabletop"
MODEL_CACHE_PREFIX = Path("/tmp/reeditpro-private-model-cache")
OUTPUT_PREFIX = Path("/tmp/reeditpro-private-proof-output")
HF_HOME_PREFIX = Path("/tmp/reeditpro-private-hf-home")
MAX_RUNTIME_MINUTES = 60

REQUIRED_OFFLINE_ENV = {
    "HF_HUB_OFFLINE": "1",
    "TRANSFORMERS_OFFLINE": "1",
    "DIFFUSERS_OFFLINE": "1",
}

ORIGINAL_WAN_CACHE_FILES = (
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

FORBIDDEN_VALUE_PATTERNS = (
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"[a-z]+://",
        r"x-amz-signature",
        r"x-amz-credential",
        r"signature=",
        r"key-pair-id=",
        r"authorization\s*:\s*bearer",
        r"api[_-]?key",
        r"service[_-]?role",
        r"google_application_credentials",
        r"\.json$",
        r"user[_-]?media",
        r"customer[_-]?data",
        r"raw[_-]?chat",
        r"raw[_-]?prompt",
    )
)

TABLETOP_PROMPT = (
    "Neutral sunlit ceramic mug on a plain warm white tabletop, slow gentle "
    "camera drift, realistic stock-style B-roll, soft natural shadows, no "
    "people, no faces, no logos, no brands, no readable text, no copyrighted "
    "characters, no audio."
)
TABLETOP_NEGATIVE_PROMPT = (
    "people, faces, minors, public figures, logos, brands, readable text, "
    "watermark, copyrighted character, violent content, sexual content, "
    "documentary evidence, user media, audio"
)


class ProofValidationError(RuntimeError):
    """Raised when the runner envelope fails before any model work."""


@dataclass(frozen=True)
class CacheLayout:
    layout: str
    runnable_with_current_runner: bool
    missing_required_files: list[str]
    reason: str


@dataclass(frozen=True)
class EnvelopeValidation:
    runner_version: str
    model_id: str
    model_revision: str
    fixture: str
    offline_model_cache: str
    output_dir: str
    evidence_json: str
    max_runtime_minutes: int
    offline_environment_ok: bool
    cache_layout: CacheLayout
    future_execution_flag_present: bool
    proof_execution_allowed_by_this_source: bool


def _is_relative_to(path: Path, prefix: Path) -> bool:
    try:
        path.resolve().relative_to(prefix.resolve())
        return True
    except ValueError:
        return False


def _reject_forbidden_value(label: str, value: str) -> None:
    for pattern in FORBIDDEN_VALUE_PATTERNS:
        if pattern.search(value):
            raise ProofValidationError(f"{label} contains forbidden value shape")


def _require_prefixed_path(label: str, value: str, prefix: Path) -> Path:
    _reject_forbidden_value(label, value)
    path = Path(value)
    if not path.is_absolute():
        raise ProofValidationError(f"{label} must be an absolute path")
    if ".." in path.parts:
        raise ProofValidationError(f"{label} must not contain parent traversal")
    if not _is_relative_to(path, prefix):
        raise ProofValidationError(f"{label} must stay under {prefix}")
    return path


def inspect_cache_layout(cache_dir: Path) -> CacheLayout:
    if not cache_dir.exists():
        return CacheLayout(
            layout="missing_cache",
            runnable_with_current_runner=False,
            missing_required_files=["."],
            reason="offline model cache path does not exist",
        )

    diffusers_markers_present = [marker for marker in DIFFUSERS_CACHE_MARKERS if (cache_dir / marker).exists()]
    if "model_index.json" in diffusers_markers_present:
        missing = [marker for marker in DIFFUSERS_CACHE_MARKERS if not (cache_dir / marker).exists()]
        return CacheLayout(
            layout="diffusers_cache_layout",
            runnable_with_current_runner=len(missing) == 0,
            missing_required_files=missing,
            reason="diffusers marker files detected",
        )

    missing_original = [relative for relative in ORIGINAL_WAN_CACHE_FILES if not (cache_dir / relative).exists()]
    if not missing_original:
        return CacheLayout(
            layout="original_wan_runtime_essential_cache",
            runnable_with_current_runner=False,
            missing_required_files=[],
            reason=(
                "approved cache is original Wan runtime-essential layout; "
                "runner requires a future approved adapter or Diffusers-format cache"
            ),
        )

    return CacheLayout(
        layout="unknown_cache_layout",
        runnable_with_current_runner=False,
        missing_required_files=missing_original,
        reason="cache is neither approved original Wan layout nor Diffusers layout",
    )


def validate_envelope(args: argparse.Namespace, environ: dict[str, str] | None = None) -> EnvelopeValidation:
    env = environ if environ is not None else dict(os.environ)

    if args.model_id != APPROVED_MODEL_ID:
        raise ProofValidationError("model id is not approved")
    if args.model_revision != APPROVED_MODEL_REVISION:
        raise ProofValidationError("model revision is not approved")
    if args.fixture != APPROVED_FIXTURE:
        raise ProofValidationError("fixture is not approved")
    if not 1 <= args.max_runtime_minutes <= MAX_RUNTIME_MINUTES:
        raise ProofValidationError("max runtime is outside the approved cap")

    cache_dir = _require_prefixed_path("offline model cache", args.offline_model_cache, MODEL_CACHE_PREFIX)
    output_dir = _require_prefixed_path("output dir", args.output_dir, OUTPUT_PREFIX)
    evidence_json = _require_prefixed_path("evidence json", args.evidence_json, OUTPUT_PREFIX)
    if not _is_relative_to(evidence_json, output_dir):
        raise ProofValidationError("evidence json must stay under output dir")

    missing_env = [
        f"{name}={expected}"
        for name, expected in REQUIRED_OFFLINE_ENV.items()
        if env.get(name) != expected
    ]
    hf_home = env.get("HF_HOME", "")
    if not hf_home:
        missing_env.append("HF_HOME")
    else:
        hf_home_path = Path(hf_home)
        if not hf_home_path.is_absolute() or not _is_relative_to(hf_home_path, HF_HOME_PREFIX):
            missing_env.append("HF_HOME under /tmp/reeditpro-private-hf-home")
    if missing_env:
        raise ProofValidationError(f"offline environment is incomplete: {', '.join(missing_env)}")

    cache_layout = inspect_cache_layout(cache_dir)
    return EnvelopeValidation(
        runner_version=RUNNER_VERSION,
        model_id=args.model_id,
        model_revision=args.model_revision,
        fixture=args.fixture,
        offline_model_cache=str(cache_dir),
        output_dir=str(output_dir),
        evidence_json=str(evidence_json),
        max_runtime_minutes=args.max_runtime_minutes,
        offline_environment_ok=True,
        cache_layout=cache_layout,
        future_execution_flag_present=bool(args.allow_approved_local_proof_execution),
        proof_execution_allowed_by_this_source=(
            bool(args.allow_approved_local_proof_execution) and cache_layout.runnable_with_current_runner
        ),
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fail-closed Wan L4 private tabletop proof runner envelope validator."
    )
    parser.add_argument("--offline-model-cache", required=True)
    parser.add_argument("--fixture", required=True)
    parser.add_argument("--max-runtime-minutes", required=True, type=int)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--evidence-json", required=True)
    parser.add_argument("--model-id", default=APPROVED_MODEL_ID)
    parser.add_argument("--model-revision", default=APPROVED_MODEL_REVISION)
    parser.add_argument(
        "--allow-approved-local-proof-execution",
        action="store_true",
        help="Future execution gate flag. Without this, the runner validates then refuses.",
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Validate the envelope and print sanitized JSON without model imports.",
    )
    return parser


def run_future_diffusers_proof(validation: EnvelopeValidation) -> dict[str, object]:
    """Run the future proof only when a later gate has satisfied every guard.

    Heavy imports are intentionally local to this function so static validation
    and source review do not require model packages.
    """

    if not validation.proof_execution_allowed_by_this_source:
        raise ProofValidationError("proof execution is not allowed by validated envelope")

    # Import only after all guards pass and only in a future approved execution gate.
    import torch  # type: ignore[import-not-found]  # noqa: PLC0415
    from diffusers import WanPipeline  # type: ignore[import-not-found]  # noqa: PLC0415

    pipe = WanPipeline.from_pretrained(
        validation.offline_model_cache,
        torch_dtype=torch.bfloat16,
        local_files_only=True,
    )
    pipe.enable_model_cpu_offload()
    frames = pipe(
        prompt=TABLETOP_PROMPT,
        negative_prompt=TABLETOP_NEGATIVE_PROMPT,
        num_frames=33,
    ).frames[0]

    frame_count = len(frames)
    first_frame_size = list(frames[0].size) if frames else []
    return {
        "runnerVersion": validation.runner_version,
        "modelId": validation.model_id,
        "modelRevision": validation.model_revision,
        "fixture": validation.fixture,
        "generatedFrameCount": frame_count,
        "firstFrameSize": first_frame_size,
        "generatedVideoCreated": False,
        "mediaEncodingRun": False,
        "ffmpegRun": False,
    }


def write_evidence(evidence_path: str, payload: dict[str, object]) -> None:
    path = Path(evidence_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main(argv: Iterable[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)

    try:
        validation = validate_envelope(args)
        validation_payload = asdict(validation)
        if args.validate_only or not args.allow_approved_local_proof_execution:
            validation_payload.update(
                {
                    "status": "validated_but_execution_refused_fail_closed",
                    "modelInferenceRun": False,
                    "generatedFramesCreated": False,
                    "generatedVideoCreated": False,
                }
            )
            print(json.dumps(validation_payload, indent=2, sort_keys=True))
            return 78

        if not validation.cache_layout.runnable_with_current_runner:
            validation_payload.update(
                {
                    "status": "blocked_cache_layout_not_runnable",
                    "modelInferenceRun": False,
                    "generatedFramesCreated": False,
                    "generatedVideoCreated": False,
                }
            )
            print(json.dumps(validation_payload, indent=2, sort_keys=True))
            return 78

        proof_payload = run_future_diffusers_proof(validation)
        write_evidence(validation.evidence_json, proof_payload)
        print(json.dumps(proof_payload, indent=2, sort_keys=True))
        return 0
    except ProofValidationError as exc:
        print(
            json.dumps(
                {
                    "status": "blocked_before_model_work",
                    "runnerVersion": RUNNER_VERSION,
                    "reason": str(exc),
                    "modelInferenceRun": False,
                    "generatedFramesCreated": False,
                    "generatedVideoCreated": False,
                },
                indent=2,
                sort_keys=True,
            ),
            file=sys.stderr,
        )
        return 78


if __name__ == "__main__":
    raise SystemExit(main())
