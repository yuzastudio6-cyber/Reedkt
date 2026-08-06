#!/usr/bin/env python3
"""Bounded offline Qwen2.5-VL Caption Design classifier.

The runner consumes one sanitized OCR-geometry document plus one to eight
private JPEG frames. A timed request may also contain no-text segment and word
ranges created by the separate transcript sanitizer. It emits enum-only
generalized classifications. Recognized wording, frame paths, prompts, raw
model output, identities, exact font/color/layout values, and exact timing
instructions never reach stdout or durable state.
"""

from __future__ import annotations

import atexit
import json
import os
import socket
import sys
from pathlib import Path
from typing import Any


STATIC_SCHEMA_VERSION = "reeditpro-reviewed-local-qwen25vl-mlx-caption-design-v1"
TIMED_SCHEMA_VERSION = "reeditpro-reviewed-local-qwen25vl-mlx-caption-design-timed-v1"
FAILURE_SCHEMA_VERSION = "reeditpro-reviewed-local-qwen25vl-mlx-caption-design-failure-v1"
STATIC_CONTEXT_VERSION = "reeditpro-caption-design-sanitized-ocr-context-v1"
TIMED_CONTEXT_VERSION = "reeditpro-caption-design-sanitized-timing-context-v1"
MIN_FRAME_COUNT = 1
MAX_FRAME_COUNT = 8
MAX_FRAME_BYTES = 2 * 1024 * 1024
MAX_CONTEXT_BYTES = 1024 * 1024

CLASSIFICATION_ENUMS: dict[str, set[str]] = {
    "fontCharacter": {"clean_sans", "serif_editorial", "display_expressive", "mixed_or_uncertain"},
    "weightTreatment": {"light_or_regular", "medium_or_bold", "mixed_or_uncertain"},
    "sizeHierarchy": {"single_level", "two_level", "multi_level", "mixed_or_uncertain"},
    "placement": {"upper", "center", "lower", "mixed"},
    "safeZoneBehavior": {"generous", "edge_close", "mixed_or_uncertain"},
    "lineBreakPattern": {"single_line", "two_line", "multi_line", "mixed"},
    "highlightedWordTreatment": {"absent", "limited", "prominent", "uncertain"},
    "colorTreatment": {"restrained_single", "high_contrast_dual", "multicolor", "mixed"},
    "strokeShadowBackground": {"none_or_minimal", "stroke_or_shadow", "background_plate", "mixed"},
    "captionDensity": {"sparse", "balanced", "dense", "mixed"},
    "spacing": {"tight", "balanced", "open", "mixed"},
    "readability": {"high", "moderate", "at_risk", "uncertain"},
}

TIMING_CLASSIFICATION_ENUMS: dict[str, set[str]] = {
    "entryExitTiming": {"cue_bounded", "phrase_hold", "extended_hold", "mixed_or_uncertain"},
    "speechAlignment": {"tight", "phrase_grouped", "loose", "mixed_or_uncertain"},
}

NETWORK_ATTEMPTED = False


def _deny_network(*_args: Any, **_kwargs: Any) -> None:
    global NETWORK_ATTEMPTED
    NETWORK_ATTEMPTED = True
    raise RuntimeError("Reviewed local Caption Design runtime forbids network access.")


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
        raise ValueError("Reviewed local Caption Design requires one to eight bounded frames.")
    frames = [_validate_local_file(value, directory=False, label="Private frame") for value in values]
    if len(set(frames)) != len(frames):
        raise ValueError("Reviewed local Caption Design frame paths must be unique.")
    for frame in frames:
        size = frame.stat().st_size
        if size < 1 or size > MAX_FRAME_BYTES:
            raise ValueError("Reviewed local Caption Design frame size is outside its bounded authority.")
        with frame.open("rb") as handle:
            if handle.read(3) != b"\xff\xd8\xff":
                raise ValueError("Reviewed local Caption Design accepts bounded JPEG frames only.")
    return frames


def _prepare_model_images(frames: list[Path], context_path: Path) -> list[Path]:
    if len(frames) == 1:
        return frames
    from PIL import Image, ImageOps

    columns = 3
    rows = (len(frames) + columns - 1) // columns
    cell_width = 448
    cell_height = 252
    gutter = 8
    sheet_width = columns * cell_width + (columns - 1) * gutter
    sheet_height = rows * cell_height + (rows - 1) * gutter
    sheet = Image.new("RGB", (sheet_width, sheet_height), color=(8, 12, 18))
    try:
        for index, frame_path in enumerate(frames):
            with Image.open(frame_path) as frame:
                sample = ImageOps.fit(
                    frame.convert("RGB"),
                    (cell_width, cell_height),
                    method=Image.Resampling.LANCZOS,
                )
                x = (index % columns) * (cell_width + gutter)
                y = (index // columns) * (cell_height + gutter)
                sheet.paste(sample, (x, y))
        sheet_path = context_path.parent / "private-caption-sequence-sheet.jpg"
        if sheet_path.exists():
            raise ValueError("Ephemeral Caption Design sequence sheet already exists.")
        sheet.save(sheet_path, format="JPEG", quality=90, optimize=True)
        sheet_path.chmod(0o600)
    finally:
        sheet.close()
    resolved = _validate_local_file(str(sheet_path), directory=False, label="Private sequence sheet")
    if resolved.stat().st_size > MAX_FRAME_BYTES:
        resolved.unlink(missing_ok=True)
        raise ValueError("Ephemeral Caption Design sequence sheet exceeds its byte bound.")
    atexit.register(lambda: resolved.unlink(missing_ok=True))
    return [resolved]


def _number(value: Any, minimum: float, maximum: float, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"Sanitized OCR {label} must be numeric.")
    number = float(value)
    if number < minimum or number > maximum:
        raise ValueError(f"Sanitized OCR {label} is outside its bound.")
    return number


def _validate_context(path: Path, frame_count: int) -> dict[str, Any]:
    size = path.stat().st_size
    if size < 2 or size > MAX_CONTEXT_BYTES:
        raise ValueError("Sanitized OCR context is outside its byte bound.")
    value = json.loads(path.read_text(encoding="utf-8"))
    base_keys = {
        "schemaVersion", "frameCount", "regionCount", "frames",
        "exactTextPersisted", "rawOcrOutputPersisted", "speechTimingAvailable",
        "rawTranscriptTextIncluded",
    }
    if not isinstance(value, dict) or value.get("schemaVersion") not in {
        STATIC_CONTEXT_VERSION, TIMED_CONTEXT_VERSION,
    }:
        raise ValueError("Sanitized OCR context has an invalid top-level schema.")
    timed = value["schemaVersion"] == TIMED_CONTEXT_VERSION
    expected_keys = base_keys | ({"transcriptTiming"} if timed else set())
    if set(value) != expected_keys or value["frameCount"] != frame_count:
        raise ValueError("Sanitized OCR context does not match the bounded frame set.")
    if (
        value["exactTextPersisted"] is not False
        or value["rawOcrOutputPersisted"] is not False
        or value["rawTranscriptTextIncluded"] is not False
    ):
        raise ValueError("Sanitized OCR context crossed the no-text boundary.")
    if value["speechTimingAvailable"] is not timed:
        raise ValueError("Sanitized Caption Design timing availability is inconsistent.")
    frames = value["frames"]
    if not isinstance(frames, list) or len(frames) != frame_count:
        raise ValueError("Sanitized OCR frame coverage is invalid.")
    region_total = 0
    for frame_index, frame in enumerate(frames):
        if not isinstance(frame, dict) or set(frame) != {"frameIndex", "sourceTimeSeconds", "textRegions"}:
            raise ValueError("Sanitized OCR frame schema is invalid.")
        if frame["frameIndex"] != frame_index or not isinstance(frame["textRegions"], list):
            raise ValueError("Sanitized OCR frame identity is invalid.")
        _number(frame["sourceTimeSeconds"], 0, 172800, "frame source time")
        if frame_index > 0 and frame["sourceTimeSeconds"] <= frames[frame_index - 1]["sourceTimeSeconds"]:
            raise ValueError("Sanitized OCR frame times must be strictly increasing.")
        if len(frame["textRegions"]) > 16:
            raise ValueError("Sanitized OCR frame exceeds the region bound.")
        for region in frame["textRegions"]:
            if not isinstance(region, dict) or set(region) != {
                "normalizedBounds", "lineCount", "estimatedCharacterCount", "confidence",
            }:
                raise ValueError("Sanitized OCR region schema is invalid.")
            bounds = region["normalizedBounds"]
            if not isinstance(bounds, dict) or set(bounds) != {"x", "y", "width", "height"}:
                raise ValueError("Sanitized OCR bounds schema is invalid.")
            x = _number(bounds["x"], 0, 1, "x")
            y = _number(bounds["y"], 0, 1, "y")
            width = _number(bounds["width"], 0.000001, 1, "width")
            height = _number(bounds["height"], 0.000001, 1, "height")
            if x + width > 1.000001 or y + height > 1.000001:
                raise ValueError("Sanitized OCR bounds leave the normalized frame.")
            _number(region["lineCount"], 1, 8, "line count")
            _number(region["estimatedCharacterCount"], 1, 500, "character count")
            _number(region["confidence"], 0, 1, "confidence")
            region_total += 1
    if value["regionCount"] != region_total:
        raise ValueError("Sanitized OCR region total is invalid.")
    if timed:
        _validate_transcript_timing(value["transcriptTiming"])
    return value


def _validate_transcript_timing(value: Any) -> None:
    expected = {
        "sourceWindowStartSeconds", "sourceWindowEndSeconds", "segmentCount",
        "alignedWordCount", "segments", "exactWordTimingVerified",
        "interpolatedWordTimingUsed", "rawTranscriptTextIncluded",
    }
    if not isinstance(value, dict) or set(value) != expected:
        raise ValueError("Sanitized transcript timing has an invalid schema.")
    start = _number(value["sourceWindowStartSeconds"], 0, 172800, "source window start")
    end = _number(value["sourceWindowEndSeconds"], 0.000001, 172800, "source window end")
    if end <= start:
        raise ValueError("Sanitized transcript timing window is invalid.")
    if (
        value["exactWordTimingVerified"] is not True
        or value["interpolatedWordTimingUsed"] is not False
        or value["rawTranscriptTextIncluded"] is not False
    ):
        raise ValueError("Sanitized transcript timing crossed its authority boundary.")
    segments = value["segments"]
    if not isinstance(segments, list) or not 1 <= len(segments) <= 1000:
        raise ValueError("Sanitized transcript segment coverage is invalid.")
    if value["segmentCount"] != len(segments):
        raise ValueError("Sanitized transcript segment count is inconsistent.")
    word_total = 0
    previous_segment_end = start
    for segment_index, segment in enumerate(segments):
        if not isinstance(segment, dict) or set(segment) != {
            "segmentOrdinal", "startSeconds", "endSeconds", "wordCount", "words",
        }:
            raise ValueError("Sanitized transcript segment schema is invalid.")
        segment_start = _number(segment["startSeconds"], start, end, "segment start")
        segment_end = _number(segment["endSeconds"], start, end, "segment end")
        if segment["segmentOrdinal"] != segment_index + 1 or segment_start < previous_segment_end or segment_end <= segment_start:
            raise ValueError("Sanitized transcript segment order is invalid.")
        previous_segment_end = segment_end
        words = segment["words"]
        if not isinstance(words, list) or not 1 <= len(words) <= 10000 or segment["wordCount"] != len(words):
            raise ValueError("Sanitized transcript word coverage is invalid.")
        previous_word_end = segment_start
        for word_index, word in enumerate(words):
            if not isinstance(word, dict) or set(word) != {"wordOrdinal", "startSeconds", "endSeconds"}:
                raise ValueError("Sanitized transcript word schema is invalid.")
            word_start = _number(word["startSeconds"], segment_start, segment_end, "word start")
            word_end = _number(word["endSeconds"], segment_start, segment_end, "word end")
            if word["wordOrdinal"] != word_index + 1 or word_start < previous_word_end or word_end <= word_start:
                raise ValueError("Sanitized transcript word order is invalid.")
            previous_word_end = word_end
            word_total += 1
    if value["alignedWordCount"] != word_total:
        raise ValueError("Sanitized transcript aligned-word count is inconsistent.")


def _visual_prompt(context: dict[str, Any], frame_count: int, contact_sheet: bool) -> str:
    schema = {key: "|".join(sorted(values)) for key, values in CLASSIFICATION_ENUMS.items()}
    schema["confidence"] = "number from 0.01 through 1.0"
    visual_context = {
        "frameCount": context["frameCount"],
        "regionCount": context["regionCount"],
        "frames": context["frames"],
        "exactTextPersisted": False,
        "rawOcrOutputPersisted": False,
    }
    return "".join([
        f"Analyze these {frame_count} ordered private video-frame samples for generalized Caption Design only. ",
        "They appear in one contact sheet ordered left-to-right across each row, then top-to-bottom. " if contact_sheet else "",
        "Use the accompanying sanitized OCR geometry as supporting evidence: ",
        f"{json.dumps(visual_context, separators=(',', ':'))}. ",
        "Classify only visible font character, weight, hierarchy, placement, edge safety, line-break character, ",
        "highlight treatment, color relationship, stroke/shadow/background support, density, spacing, and readability. ",
        "Do not transcribe visible text. Do not infer an exact font, brand, creator, person, caption wording, exact color, ",
        "exact size, exact layout, animation style, exact entry/exit values, an exact timing map, or a target-video instruction. ",
        "Return one JSON object only, with exactly these keys and allowed values: ",
        f"{json.dumps(schema, separators=(',', ':'))}. ",
        "Use mixed or uncertain values whenever the bounded evidence cannot prove a stable principle. ",
        "Do not add explanations, markdown, arrays, nested objects, or extra keys.",
    ])


def _timing_prompt(context: dict[str, Any], frame_count: int, contact_sheet: bool) -> str:
    schema = {key: "|".join(sorted(values)) for key, values in TIMING_CLASSIFICATION_ENUMS.items()}
    schema["timingConfidence"] = "number from 0.01 through 1.0"
    timing_context = {
        "frameTimesSeconds": [frame["sourceTimeSeconds"] for frame in context["frames"]],
        "transcriptTiming": context["transcriptTiming"],
        "rawTranscriptTextIncluded": False,
        "exactWordTimingVerified": True,
        "interpolatedWordTimingUsed": False,
    }
    return "".join([
        f"Analyze these {frame_count} ordered private video-frame samples only for generalized caption visibility timing. ",
        "They appear in one contact sheet ordered left-to-right across each row, then top-to-bottom. " if contact_sheet else "",
        "Use the no-text exact speech timing and ordered frame times as supporting evidence: ",
        f"{json.dumps(timing_context, separators=(',', ':'))}. ",
        "Classify only whether caption visibility is cue-bounded, phrase-held, extended-held, or mixed/uncertain, ",
        "and whether visible caption changes align tightly, by phrase, loosely, or inconsistently with speech. ",
        "Do not transcribe text. Do not infer animation style, exact entry or exit times, exact timing maps, exact wording, ",
        "speaker identity, or any instruction for a target video. ",
        "Return one JSON object only, with exactly these keys and allowed values: ",
        f"{json.dumps(schema, separators=(',', ':'))}. ",
        "Use mixed_or_uncertain whenever the bounded evidence cannot prove a stable principle. ",
        "Do not add explanations, markdown, arrays, nested objects, or extra keys.",
    ])


def _extract_object(text: str) -> dict[str, Any]:
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("Qwen Caption Design output did not contain one JSON object.")
    value = json.loads(text[start : end + 1])
    if not isinstance(value, dict):
        raise ValueError("Qwen Caption Design output was not one JSON object.")
    return value


def _extract_visual_json(text: str) -> dict[str, Any]:
    value = _extract_object(text)
    expected = set(CLASSIFICATION_ENUMS) | {"confidence"}
    if not expected.issubset(value):
        raise ValueError("Qwen Caption Design visual output omitted required enum fields.")
    reduced = {key: value[key] for key in expected}
    for key, allowed in CLASSIFICATION_ENUMS.items():
        if reduced.get(key) not in allowed:
            raise ValueError(f"Qwen Caption Design output contains an invalid {key} classification.")
    confidence = reduced.get("confidence")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
        raise ValueError("Qwen Caption Design confidence must be numeric.")
    if not 0.01 <= float(confidence) <= 1:
        raise ValueError("Qwen Caption Design confidence is outside its bound.")
    reduced["confidence"] = round(float(confidence), 6)
    return reduced


def _extract_timing_json(text: str) -> dict[str, Any]:
    value = _extract_object(text)
    expected = set(TIMING_CLASSIFICATION_ENUMS) | {"timingConfidence"}
    if not expected.issubset(value):
        raise ValueError("Qwen Caption Design timing output omitted required enum fields.")
    reduced = {key: value[key] for key in expected}
    for key, allowed in TIMING_CLASSIFICATION_ENUMS.items():
        if reduced.get(key) not in allowed:
            raise ValueError(f"Qwen Caption Design output contains an invalid {key} classification.")
    confidence = reduced.get("timingConfidence")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
        raise ValueError("Qwen Caption Design timing confidence must be numeric.")
    if not 0.01 <= float(confidence) <= 1:
        raise ValueError("Qwen Caption Design timing confidence is outside its bound.")
    reduced["timingConfidence"] = round(float(confidence), 6)
    return reduced


def _emit_reduced_failure(stage: str) -> None:
    print(json.dumps({
        "schemaVersion": FAILURE_SCHEMA_VERSION,
        "failureStage": stage,
        "semanticSpecialistModelExecuted": True,
        "rawModelOutputPersisted": False,
        "rawFramesPersisted": False,
        "rawOcrOutputPersisted": False,
        "recognizedTextPersisted": False,
        "rawTranscriptTextPersisted": False,
        "networkAttempted": NETWORK_ATTEMPTED,
        "providerCallMade": False,
    }, separators=(",", ":")))


def _safe_failure_stage(prefix: str, error: Exception) -> str:
    message = str(error)
    if "omitted required enum fields" in message:
        return f"{prefix}_required_fields_missing"
    if "invalid" in message and "classification" in message:
        return f"{prefix}_enum_invalid"
    if "confidence" in message:
        return f"{prefix}_confidence_invalid"
    return f"{prefix}_json_invalid"


def main() -> None:
    if len(sys.argv) < 4:
        raise ValueError(
            "Usage: qwen25vl-mlx-classify-caption-design.py MODEL_PATH OCR_CONTEXT FRAME_1 [FRAME_2 ...]"
        )
    _enforce_offline_runtime()
    model_path = _validate_local_file(sys.argv[1], directory=True, label="Qwen model")
    context_path = _validate_local_file(sys.argv[2], directory=False, label="Sanitized OCR context")
    frames = _validate_frames(sys.argv[3:])
    context = _validate_context(context_path, len(frames))
    timed = context["schemaVersion"] == TIMED_CONTEXT_VERSION
    model_images = _prepare_model_images(frames, context_path)
    contact_sheet = len(model_images) == 1 and len(frames) > 1

    from mlx_vlm import generate, load
    from mlx_vlm.prompt_utils import apply_chat_template

    model, processor = load(str(model_path))
    formatted = apply_chat_template(
        processor,
        model.config,
        _visual_prompt(context, len(frames), contact_sheet),
        num_images=len(model_images),
    )
    generated = generate(
        model,
        processor,
        formatted,
        image=[str(frame) for frame in model_images],
        max_tokens=420,
        temperature=0.0,
        verbose=False,
        resize_shape=(896, 448) if contact_sheet else (448, 448),
    )
    try:
        reduced = _extract_visual_json(generated.text)
    except (ValueError, json.JSONDecodeError) as error:
        _emit_reduced_failure(_safe_failure_stage("visual", error))
        return
    timing_reduced: dict[str, Any] | None = None
    if timed:
        timing_formatted = apply_chat_template(
            processor,
            model.config,
            _timing_prompt(context, len(frames), contact_sheet),
            num_images=len(model_images),
        )
        timing_generated = generate(
            model,
            processor,
            timing_formatted,
            image=[str(frame) for frame in model_images],
            max_tokens=160,
            temperature=0.0,
            verbose=False,
            resize_shape=(896, 448) if contact_sheet else (448, 448),
        )
        try:
            timing_reduced = _extract_timing_json(timing_generated.text)
        except (ValueError, json.JSONDecodeError) as error:
            _emit_reduced_failure(_safe_failure_stage("timing", error))
            return
    classifications = {key: reduced[key] for key in CLASSIFICATION_ENUMS}
    classifications["confidence"] = reduced["confidence"]
    result = {
        "schemaVersion": TIMED_SCHEMA_VERSION if timed else STATIC_SCHEMA_VERSION,
        "profile": "caption_design_timed" if timed else "caption_design",
        "framesAnalyzed": len(frames),
        "ocrRegionsAnalyzed": context["regionCount"],
        "classifications": classifications,
        "semanticSpecialistModelExecuted": True,
        "ocrEngineExecutedByCaptionDesignAnalyzer": False,
        "rawModelOutputPersisted": False,
        "rawFramesPersisted": False,
        "rawOcrOutputPersisted": False,
        "recognizedTextPersisted": False,
        "exactVisibleTextRetained": False,
        "exactFontIdentityClaimed": False,
        "identityAnalysisPerformed": False,
        "externalUrlFetched": False,
        "networkAttempted": NETWORK_ATTEMPTED,
        "providerCallMade": False,
    }
    if timed:
        if timing_reduced is None:
            raise ValueError("Qwen Caption Design timing classification was not executed.")
        result.update({
            "transcriptSegmentsAnalyzed": context["transcriptTiming"]["segmentCount"],
            "alignedWordsAnalyzed": context["transcriptTiming"]["alignedWordCount"],
            "timingClassifications": {
                "entryExitTiming": timing_reduced["entryExitTiming"],
                "speechAlignment": timing_reduced["speechAlignment"],
                "confidence": timing_reduced["timingConfidence"],
            },
            "transcriptRuntimeExecutedByCaptionDesignAnalyzer": False,
            "privateTranscriptTimingRead": True,
            "rawTranscriptTextRead": False,
            "rawTranscriptTextPersisted": False,
            "exactAnimationOrTimingInferred": False,
            "generalizedEntryExitTimingClassified": True,
            "generalizedSpeechAlignmentClassified": True,
            "animationStyleClassified": False,
        })
    else:
        result["animationOrTimingInferred"] = False
    print(json.dumps(result, separators=(",", ":")))


if __name__ == "__main__":
    main()
