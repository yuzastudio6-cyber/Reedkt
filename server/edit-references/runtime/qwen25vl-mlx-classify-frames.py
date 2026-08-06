#!/usr/bin/env python3
"""Bounded, path-private Qwen2.5-VL frame classifier for internal testing.

The model sees only the supplied local JPEGs. Its free-form response exists in
process memory long enough to validate and reduce it to enum-only evidence; the
response, prompt, paths, pixels, visible wording, and identity guesses are never
written to stdout or durable study state.
"""

from __future__ import annotations

import json
import os
import socket
import sys
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "reeditpro-reviewed-local-qwen25vl-mlx-visual-v1"
MIN_FRAME_COUNT = 2
MAX_FRAME_COUNT = 8
MAX_FRAME_BYTES = 2 * 1024 * 1024

ENUMS: dict[str, set[str]] = {
    "compositionHierarchy": {
        "single_focal_point",
        "balanced_multi_region",
        "layered_depth",
        "asymmetric_focus",
        "full_frame_field",
    },
    "framingShotScale": {
        "wide_context",
        "medium_subject",
        "close_detail",
        "mixed_scales",
        "graphic_canvas",
    },
    "subjectPlacement": {
        "centered",
        "rule_of_thirds",
        "edge_anchored",
        "distributed",
        "no_clear_subject",
    },
    "cameraBehavior": {
        "stable",
        "reframed_between_samples",
        "dynamic_change",
        "uncertain_from_samples",
    },
    "sceneRhythm": {
        "stable_hold",
        "measured_changes",
        "frequent_changes",
        "uncertain_from_samples",
    },
    "visualDensity": {"low", "medium", "high"},
    "brollPattern": {
        "primary_subject_dominant",
        "support_visual_dominant",
        "alternating",
        "uncertain",
    },
    "transitionLanguage": {
        "hard_visual_change",
        "continuous_visual_flow",
        "mixed_or_varied",
        "uncertain_from_samples",
    },
    "visibleTextOverlay": {"none", "restrained", "prominent", "uncertain"},
    "graphicOverlayLanguage": {"none", "restrained", "prominent", "uncertain"},
    "tonalCharacter": {
        "predominantly_dark",
        "predominantly_light",
        "balanced_or_mixed",
    },
    "contrastCharacter": {"low", "medium", "high"},
    "lightingCharacter": {"soft", "directional", "flat", "mixed_or_uncertain"},
    "visualStorytelling": {
        "speaker_led",
        "demonstration",
        "montage",
        "atmospheric",
        "graphic_led",
        "mixed",
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


def _prompt(frame_count: int) -> str:
    schema = {key: "|".join(sorted(values)) for key, values in ENUMS.items()}
    schema["confidence"] = "number from 0.01 through 1.0"
    return (
        f"Analyze these {frame_count} ordered samples from one video. "
        "Classify only generalized, reusable visual principles. Return one JSON object only, "
        f"with exactly these keys and allowed values: {json.dumps(schema, separators=(',', ':'))}. "
        "Infer sequence-level camera, rhythm, and transition fields conservatively from differences "
        "between the ordered samples; use an uncertain value when the samples cannot prove them. "
        "Do not transcribe or quote visible text. Do not identify or describe a person, creator, brand, "
        "logo, copyrighted asset, exact layout, exact color, camera path, or exact transition timing. "
        "Do not add explanations, markdown, arrays, nested objects, or extra keys."
    )


def _extract_json(text: str) -> dict[str, Any]:
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("Qwen visual output did not contain one JSON object.")
    value = json.loads(text[start : end + 1])
    if not isinstance(value, dict) or set(value) != set(ENUMS) | {"confidence"}:
        raise ValueError("Qwen visual output did not match the exact enum schema.")
    for key, allowed in ENUMS.items():
        if value.get(key) not in allowed:
            raise ValueError(f"Qwen visual output contains an invalid {key} classification.")
    confidence = value.get("confidence")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
        raise ValueError("Qwen visual output confidence must be numeric.")
    if not 0.01 <= float(confidence) <= 1:
        raise ValueError("Qwen visual output confidence is outside its bound.")
    value["confidence"] = round(float(confidence), 6)
    return value


def main() -> None:
    if len(sys.argv) < 4:
        raise ValueError("Usage: qwen25vl-mlx-classify-frames.py MODEL_PATH FRAME_1 FRAME_2 [...]")
    _enforce_offline_runtime()
    model_path = _validate_local_file(sys.argv[1], directory=True, label="Qwen model")
    frames = _validate_frames(sys.argv[2:])

    from mlx_vlm import generate, load
    from mlx_vlm.prompt_utils import apply_chat_template

    model, processor = load(str(model_path))
    prompt = _prompt(len(frames))
    formatted = apply_chat_template(
        processor,
        model.config,
        prompt,
        num_images=len(frames),
    )
    generated = generate(
        model,
        processor,
        formatted,
        image=[str(frame) for frame in frames],
        max_tokens=360,
        temperature=0.0,
        verbose=False,
        resize_shape=(384, 384),
    )
    classifications = _extract_json(generated.text)
    result = {
        "schemaVersion": SCHEMA_VERSION,
        "framesAnalyzed": len(frames),
        "classifications": classifications,
        "semanticVisualModelExecuted": True,
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
