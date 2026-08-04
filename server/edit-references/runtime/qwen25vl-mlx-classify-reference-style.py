#!/usr/bin/env python3
"""Bounded offline Qwen2.5-VL reference-style classifier.

This internal-test runner accepts only local JPEG samples and emits an
enum-only reduction for one specialist profile. Free-form model output,
prompts, paths, pixels, visible wording, identities, exact colors, layouts,
and timing values are never written to durable state or stdout.
"""

from __future__ import annotations

import json
import os
import socket
import sys
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "reeditpro-reviewed-local-qwen25vl-mlx-reference-style-v1"
MIN_FRAME_COUNT = 2
MAX_FRAME_COUNT = 8
MAX_FRAME_BYTES = 2 * 1024 * 1024

PROFILE_ENUMS: dict[str, dict[str, set[str]]] = {
    "color_treatment": {
        "paletteRelationship": {
            "restrained_neutral", "warm_cohesive", "cool_cohesive",
            "high_chroma_contrast", "mixed_varied",
        },
        "temperatureCharacter": {"warm", "cool", "neutral", "mixed"},
        "whiteBalanceCharacter": {"balanced", "warm_cast", "cool_cast", "mixed_or_uncertain"},
        "contrastStructure": {"soft", "balanced", "strong", "mixed"},
        "saturationVibrance": {"restrained", "natural", "vivid", "mixed"},
        "lumaDistribution": {"low_key", "high_key", "balanced", "mixed"},
        "highlightRolloff": {"soft", "abrupt", "mixed_or_uncertain"},
        "shadowTreatment": {"open", "deep", "balanced", "mixed"},
        "sceneConsistency": {"consistent", "intentionally_varied", "inconsistent", "uncertain"},
        "overallColorCharacter": {
            "clean_natural", "premium_clean", "warm_lifestyle", "cinematic_contrast",
            "documentary_neutral", "bright_social", "moody_dramatic", "muted_editorial",
            "high_key_clean", "mixed_custom",
        },
    },
    "graphics_motion": {
        "iconsPresence": {"none", "restrained", "prominent", "uncertain"},
        "spacingDensity": {"tight", "balanced", "open", "mixed"},
        "layoutHierarchy": {"single_focus", "two_level", "layered", "full_frame", "mixed"},
        "overlayPlacement": {
            "upper", "lower", "edge_anchored", "centered", "distributed", "mixed",
        },
    },
}

NETWORK_ATTEMPTED = False


def _deny_network(*_args: Any, **_kwargs: Any) -> None:
    global NETWORK_ATTEMPTED
    NETWORK_ATTEMPTED = True
    raise RuntimeError("Reviewed local Qwen runtime forbids network access.")


def _enforce_offline_runtime() -> None:
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    os.environ["TOKENIZERS_PARALLELISM"] = "false"
    socket.socket.connect = _deny_network  # type: ignore[method-assign]
    socket.create_connection = _deny_network  # type: ignore[assignment]


def _validate_local_file(value: str, *, directory: bool, label: str) -> Path:
    path = Path(value)
    if not path.is_absolute() or path.is_symlink():
        raise ValueError(f"{label} must be one absolute, non-symlinked local path.")
    resolved = path.resolve(strict=True)
    if resolved != path:
        raise ValueError(f"{label} must not use an aliased path.")
    if directory and not resolved.is_dir():
        raise ValueError(f"{label} must be a directory.")
    if not directory and not resolved.is_file():
        raise ValueError(f"{label} must be a file.")
    return resolved


def _validate_frames(values: list[str]) -> list[Path]:
    if not MIN_FRAME_COUNT <= len(values) <= MAX_FRAME_COUNT:
        raise ValueError("Reviewed local Qwen requires two to eight bounded frames.")
    frames = [_validate_local_file(value, directory=False, label="Private frame") for value in values]
    if len(set(frames)) != len(frames):
        raise ValueError("Reviewed local Qwen frame paths must be unique.")
    for frame in frames:
        size = frame.stat().st_size
        if size < 1 or size > MAX_FRAME_BYTES:
            raise ValueError("Reviewed local Qwen frame size is outside its bounded authority.")
        with frame.open("rb") as handle:
            if handle.read(3) != b"\xff\xd8\xff":
                raise ValueError("Reviewed local Qwen accepts bounded JPEG frames only.")
    return frames


def _prompt(profile: str, frame_count: int) -> str:
    enums = PROFILE_ENUMS[profile]
    schema = {key: "|".join(sorted(values)) for key, values in enums.items()}
    schema["confidence"] = "number from 0.01 through 1.0"
    specialist_direction = (
        "Classify only generalized tonal relationships and color character visible across the samples. "
        "Do not infer skin tone, brand colors, exact palette values, grade settings, transforms, or reusable assets. "
        if profile == "color_treatment"
        else
        "Classify only generalized icon presence, spacing density, layout hierarchy, and overlay placement. "
        "Do not transcribe text or infer motion timing, entry or exit behavior, transitions, UI identity, or brand identity. "
    )
    return (
        f"Analyze these {frame_count} ordered samples from one video. "
        f"{specialist_direction}"
        "Return one JSON object only, with exactly these keys and allowed values: "
        f"{json.dumps(schema, separators=(',', ':'))}. "
        "Use a mixed or uncertain value when the bounded samples cannot prove a stable principle. "
        "Do not identify or describe a person, creator, brand, logo, copyrighted asset, exact layout, "
        "exact color, visible wording, timing value, camera path, or animation path. "
        "Do not add explanations, markdown, arrays, nested objects, or extra keys."
    )


def _extract_json(text: str, profile: str) -> dict[str, Any]:
    enums = PROFILE_ENUMS[profile]
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("Qwen specialist output did not contain one JSON object.")
    value = json.loads(text[start : end + 1])
    if not isinstance(value, dict) or set(value) != set(enums) | {"confidence"}:
        raise ValueError("Qwen specialist output did not match the exact enum schema.")
    for key, allowed in enums.items():
        if value.get(key) not in allowed:
            raise ValueError(f"Qwen specialist output contains an invalid {key} classification.")
    confidence = value.get("confidence")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
        raise ValueError("Qwen specialist output confidence must be numeric.")
    if not 0.01 <= float(confidence) <= 1:
        raise ValueError("Qwen specialist output confidence is outside its bound.")
    value["confidence"] = round(float(confidence), 6)
    return value


def main() -> None:
    if len(sys.argv) < 5:
        raise ValueError(
            "Usage: qwen25vl-mlx-classify-reference-style.py PROFILE MODEL_PATH FRAME_1 FRAME_2 [...]"
        )
    profile = sys.argv[1]
    if profile not in PROFILE_ENUMS:
        raise ValueError("Reviewed local Qwen specialist profile is not supported.")
    _enforce_offline_runtime()
    model_path = _validate_local_file(sys.argv[2], directory=True, label="Qwen model")
    frames = _validate_frames(sys.argv[3:])

    from mlx_vlm import generate, load
    from mlx_vlm.prompt_utils import apply_chat_template

    model, processor = load(str(model_path))
    formatted = apply_chat_template(
        processor,
        model.config,
        _prompt(profile, len(frames)),
        num_images=len(frames),
    )
    generated = generate(
        model,
        processor,
        formatted,
        image=[str(frame) for frame in frames],
        max_tokens=320,
        temperature=0.0,
        verbose=False,
        resize_shape=(384, 384),
    )
    result = {
        "schemaVersion": SCHEMA_VERSION,
        "profile": profile,
        "framesAnalyzed": len(frames),
        "classifications": _extract_json(generated.text, profile),
        "semanticSpecialistModelExecuted": True,
        "rawModelOutputPersisted": False,
        "rawFramesPersisted": False,
        "exactVisibleTextRetained": False,
        "identityAnalysisPerformed": False,
        "externalUrlFetched": False,
        "networkAttempted": NETWORK_ATTEMPTED,
        "providerCallMade": False,
    }
    print(json.dumps(result, separators=(",", ":")))


if __name__ == "__main__":
    main()
