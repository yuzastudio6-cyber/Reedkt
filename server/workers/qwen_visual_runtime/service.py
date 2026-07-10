#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import hashlib
import inspect
import io
import json
import os
import sys
import time
import urllib.request
from contextlib import AbstractContextManager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Tuple


MODE = "reeditpro_qwen_private_source_visual_understanding_v1"
REQUEST_SCHEMA_VERSION = "reeditpro-visual-understanding-request-v1"
RESPONSE_SCHEMA_VERSION = "reeditpro-visual-understanding-v1"
MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct"
MODEL_REVISION = "cc594898137f460bfe9f0759e9844b3ce807cfb5"
MODEL_AGGREGATE_SHA256 = "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b"
MAX_REQUEST_BYTES = 24 * 1024 * 1024
MAX_FRAME_BYTES = 2 * 1024 * 1024
MAX_FRAMES = 8
MAX_LIST_ITEMS = 40

BLOCKED_KEYS = {
    "prompt",
    "rawPrompt",
    "raw_prompt",
    "workerPrompt",
    "worker_prompt",
    "apiKey",
    "api_key",
    "authorization",
    "token",
    "signedUrl",
    "signed_url",
}
ALLOWED_ANALYSIS_CATEGORIES = {
    "visible_subjects",
    "visible_objects",
    "screen_text_regions",
    "composition_risks",
    "safe_zones",
    "broll_opportunities",
    "caption_observations",
    "style_observations",
}
FRAME_REQUIRED_KEYS = {
    "summary",
    "visible_subjects",
    "visible_objects",
    "text_like_regions",
    "safe_zones",
    "composition_risks",
    "broll_opportunities",
    "caption_observations",
    "style_observations",
    "uncertainty",
}

_VLLM_ENGINE: Any = None
_VLLM_VERSION: str | None = None
_VLLM_DROPPED_KWARGS: List[str] = []


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _non_empty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _scan_blocked_keys(value: Any, path: str = "$") -> List[str]:
    findings: List[str] = []
    if isinstance(value, dict):
        for key, nested in value.items():
            nested_path = f"{path}.{key}"
            if str(key) in BLOCKED_KEYS:
                findings.append(nested_path)
            findings.extend(_scan_blocked_keys(nested, nested_path))
    elif isinstance(value, list):
        for index, nested in enumerate(value):
            findings.extend(_scan_blocked_keys(nested, f"{path}[{index}]"))
    return findings


def validate_request(payload: Any) -> Tuple[bool, List[str]]:
    reasons: List[str] = []
    if not isinstance(payload, dict):
        return False, ["payload_must_be_object"]
    if payload.get("schemaVersion") != REQUEST_SCHEMA_VERSION:
        reasons.append("schema_version_mismatch")
    for key in ["requestId", "workspaceId", "projectId", "editSessionId", "mediaAssetId"]:
        if not _non_empty(payload.get(key)):
            reasons.append(f"{key}_required")

    task = payload.get("task")
    if not isinstance(task, dict):
        reasons.append("task_required")
    else:
        if task.get("useCase") not in {"source_edit_planning", "reference_style_analysis"}:
            reasons.append("task_use_case_not_allowed")
        if task.get("outputMode") != "structured_metadata_only":
            reasons.append("task_output_mode_not_allowed")
        categories = task.get("analysisCategories")
        if not isinstance(categories, list) or not categories:
            reasons.append("analysis_categories_required")
        elif any(category not in ALLOWED_ANALYSIS_CATEGORIES for category in categories):
            reasons.append("analysis_category_not_allowed")

    safety = payload.get("safety")
    required_safety = {
        "privateInputOnly": True,
        "rawPromptIncluded": False,
        "generatedAssetsAllowed": False,
        "publicArtifactsAllowed": False,
        "signedUrlsAllowed": False,
    }
    if not isinstance(safety, dict):
        reasons.append("safety_contract_required")
    else:
        for key, expected in required_safety.items():
            if safety.get(key) is not expected:
                reasons.append(f"safety_{key}_must_be_{str(expected).lower()}")

    frames = payload.get("frames")
    if not isinstance(frames, list) or not frames:
        reasons.append("frames_required")
    elif len(frames) > MAX_FRAMES:
        reasons.append("too_many_frames")
    else:
        seen_ids: set[str] = set()
        for index, frame in enumerate(frames):
            if not isinstance(frame, dict):
                reasons.append(f"frame_{index}_must_be_object")
                continue
            frame_id = frame.get("frameId")
            if not _non_empty(frame_id):
                reasons.append(f"frame_{index}_id_required")
            elif frame_id in seen_ids:
                reasons.append(f"frame_{index}_id_duplicate")
            else:
                seen_ids.add(frame_id)
            if frame.get("contentType") != "image/jpeg":
                reasons.append(f"frame_{index}_content_type_not_allowed")
            checksum = frame.get("checksumSha256")
            if not isinstance(checksum, str) or len(checksum) != 64:
                reasons.append(f"frame_{index}_checksum_invalid")
            if not _non_empty(frame.get("imageBase64")):
                reasons.append(f"frame_{index}_bytes_required")
            time_seconds = frame.get("timeSeconds")
            if time_seconds is not None and (not isinstance(time_seconds, (int, float)) or time_seconds < 0):
                reasons.append(f"frame_{index}_time_invalid")

    reasons.extend(f"blocked_field:{path}" for path in _scan_blocked_keys(payload))
    return len(reasons) == 0, reasons


def decode_frames(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    from PIL import Image

    decoded: List[Dict[str, Any]] = []
    for frame in payload["frames"]:
        try:
            raw = base64.b64decode(frame["imageBase64"], validate=True)
        except Exception as exc:
            raise ValueError(f"frame_base64_invalid:{frame['frameId']}") from exc
        if len(raw) > MAX_FRAME_BYTES:
            raise ValueError(f"frame_too_large:{frame['frameId']}")
        checksum = hashlib.sha256(raw).hexdigest()
        if checksum != frame["checksumSha256"]:
            raise ValueError(f"frame_checksum_mismatch:{frame['frameId']}")
        try:
            image = Image.open(io.BytesIO(raw))
            image.verify()
            image = Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception as exc:
            raise ValueError(f"frame_jpeg_invalid:{frame['frameId']}") from exc
        if image.width > 2048 or image.height > 2048:
            raise ValueError(f"frame_dimensions_exceed_limit:{frame['frameId']}")
        decoded.append({
            "frameId": frame["frameId"],
            "timeSeconds": frame.get("timeSeconds"),
            "image": image,
        })
    return decoded


class NetworkGuard(AbstractContextManager):
    def __init__(self) -> None:
        self.network_attempted = False
        self._urlopen = None

    def __enter__(self):
        self._urlopen = urllib.request.urlopen

        def blocked_urlopen(*_args: Any, **_kwargs: Any) -> Any:
            self.network_attempted = True
            raise RuntimeError("qwen_visual_runtime_network_blocked")

        urllib.request.urlopen = blocked_urlopen
        return self

    def __exit__(self, exc_type: Any, exc_value: Any, tb: Any) -> bool:
        if self._urlopen is not None:
            urllib.request.urlopen = self._urlopen
        return False


def _get_vllm_engine() -> Any:
    global _VLLM_DROPPED_KWARGS, _VLLM_ENGINE, _VLLM_VERSION
    if _VLLM_ENGINE is not None:
        return _VLLM_ENGINE
    model_dir = Path(os.environ.get("QWEN_MODEL_CACHE_MOUNT", "/models/qwen2.5-vl-7b-instruct"))
    if not model_dir.exists():
        raise RuntimeError("qwen_model_cache_mount_missing")
    with NetworkGuard() as guard:
        import vllm
        from vllm import LLM

        kwargs = {
            "model": str(model_dir),
            "tokenizer": str(model_dir),
            "trust_remote_code": True,
            "dtype": os.environ.get("QWEN_VLLM_DTYPE", "bfloat16"),
            "max_model_len": int(os.environ.get("QWEN_VLLM_MAX_MODEL_LEN", "4096")),
            "limit_mm_per_prompt": {"image": 1},
            "max_num_seqs": 1,
            "max_num_batched_tokens": int(os.environ.get("QWEN_VLLM_MAX_NUM_BATCHED_TOKENS", "4096")),
            "enforce_eager": _env_bool("QWEN_VLLM_ENFORCE_EAGER", True),
            "gpu_memory_utilization": float(os.environ.get("QWEN_VLLM_GPU_MEMORY_UTILIZATION", "0.86")),
            "mm_processor_cache_gb": 0,
            "disable_log_stats": True,
        }
        signature = inspect.signature(LLM.__init__)
        accepts_kwargs = any(item.kind == inspect.Parameter.VAR_KEYWORD for item in signature.parameters.values())
        dropped = [] if accepts_kwargs else [key for key in kwargs if key not in signature.parameters]
        filtered = kwargs if accepts_kwargs else {key: value for key, value in kwargs.items() if key in signature.parameters}
        _VLLM_ENGINE = LLM(**filtered)
        _VLLM_VERSION = getattr(vllm, "__version__", "unknown")
        _VLLM_DROPPED_KWARGS = dropped
        if guard.network_attempted:
            raise RuntimeError("qwen_visual_runtime_network_attempted")
    return _VLLM_ENGINE


def build_frame_prompt(frame_id: str, time_seconds: float | None, analysis_role: str) -> str:
    timestamp = f"{time_seconds:.3f}s" if isinstance(time_seconds, (int, float)) else "unknown"
    return (
        "<|im_start|>system\n"
        "You are ReEditPro's private source-frame evidence extractor. Return exactly one JSON object and no prose or markdown. "
        "Describe only what is visible. Never infer identity, sensitive traits, hidden events, credentials, URLs, or unsupported story facts. "
        "Do not make edit decisions. Use concise evidence phrases suitable for a later professional planner. "
        "For caption observations, describe only visible typography, case, line count, placement, outline or shadow, colors, and highlighted-word treatment. "
        "For style observations, describe only visible composition, density, graphic language, and restrained motion evidence inferable from frame differences.\n"
        "<|im_end|>\n<|im_start|>user\n"
        "<|vision_start|><|image_pad|><|vision_end|>\n"
        f"Frame ID: {frame_id}. Source time: {timestamp}. "
        "Return these exact keys: summary, visible_subjects, visible_objects, text_like_regions, safe_zones, "
        "composition_risks, broll_opportunities, caption_observations, style_observations, uncertainty. All keys except summary must be arrays of short strings. "
        "A b-roll opportunity is only a visible topic or object that may deserve supporting evidence later; do not invent or request an asset.\n"
        f"Analysis role: {analysis_role}. A reference is inspiration evidence only; never recommend exact copying.\n"
        "<|im_end|>\n<|im_start|>assistant\n"
    )


def _extract_json(raw_text: str) -> Dict[str, Any]:
    text = raw_text.strip()
    if text.startswith("```"):
        text = text[text.find("\n") + 1:] if "\n" in text else text[3:]
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3]
    decoder = json.JSONDecoder()
    for start in [index for index, char in enumerate(text) if char == "{"]:
        try:
            value, _ = decoder.raw_decode(text[start:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            return value
    raise ValueError("qwen_visual_json_object_not_found")


def _clean_list(value: Any, maximum: int = MAX_LIST_ITEMS) -> List[str]:
    if not isinstance(value, list):
        return []
    cleaned: List[str] = []
    for item in value:
        if _non_empty(item):
            normalized = " ".join(str(item).strip().split())[:400]
            if normalized not in cleaned:
                cleaned.append(normalized)
        if len(cleaned) >= maximum:
            break
    return cleaned


def normalize_frame_result(parsed: Dict[str, Any], frame: Dict[str, Any]) -> Dict[str, Any]:
    missing = FRAME_REQUIRED_KEYS.difference(parsed.keys())
    if missing:
        raise ValueError(f"qwen_visual_frame_schema_missing:{','.join(sorted(missing))}")
    summary = parsed.get("summary")
    if not _non_empty(summary):
        raise ValueError("qwen_visual_frame_summary_required")
    return {
        "frameId": frame["frameId"],
        "timeSeconds": frame.get("timeSeconds"),
        "summary": " ".join(str(summary).strip().split())[:1200],
        "visibleSubjects": _clean_list(parsed.get("visible_subjects"), 30),
        "visibleObjects": _clean_list(parsed.get("visible_objects"), 40),
        "textLikeRegions": _clean_list(parsed.get("text_like_regions"), 30),
        "safeZones": _clean_list(parsed.get("safe_zones"), 30),
        "compositionRisks": _clean_list(parsed.get("composition_risks"), 30),
        "brollOpportunities": _clean_list(parsed.get("broll_opportunities"), 30),
        "captionObservations": _clean_list(parsed.get("caption_observations"), 30),
        "styleObservations": _clean_list(parsed.get("style_observations"), 30),
        "uncertainty": _clean_list(parsed.get("uncertainty"), 30),
    }


def _unique_from_frames(frames: List[Dict[str, Any]], key: str, maximum: int) -> List[str]:
    return _clean_list([item for frame in frames for item in frame.get(key, [])], maximum)


def run_analysis(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    if not _env_bool("QWEN_REAL_FRAME_ANALYSIS_ENABLED") or not _env_bool("QWEN_INFERENCE_ENABLED"):
        return 403, {"ok": False, "reason": "qwen_real_frame_analysis_disabled"}
    started = time.monotonic()
    try:
        from vllm import SamplingParams

        decoded_frames = decode_frames(payload)
        llm = _get_vllm_engine()
        frame_evidence: List[Dict[str, Any]] = []
        for frame in decoded_frames:
            with NetworkGuard() as guard:
                outputs = llm.generate([{
                    "prompt": build_frame_prompt(frame["frameId"], frame.get("timeSeconds"), payload["task"]["useCase"]),
                    "multi_modal_data": {"image": frame["image"]},
                }], SamplingParams(temperature=0.0, top_p=1.0, max_tokens=420))
                if guard.network_attempted:
                    raise RuntimeError("qwen_visual_runtime_network_attempted")
            raw_text = outputs[0].outputs[0].text if outputs and outputs[0].outputs else ""
            frame_evidence.append(normalize_frame_result(_extract_json(raw_text), frame))
        summaries = [
            f"{frame.get('timeSeconds', 'unknown')}s: {frame['summary']}"
            for frame in frame_evidence
        ]
        return 200, {
            "schemaVersion": RESPONSE_SCHEMA_VERSION,
            "summary": " ".join(summaries)[:4000],
            "visibleSubjects": _unique_from_frames(frame_evidence, "visibleSubjects", 80),
            "visibleObjects": _unique_from_frames(frame_evidence, "visibleObjects", 120),
            "screenTextRegions": _unique_from_frames(frame_evidence, "textLikeRegions", 80),
            "compositionRisks": _unique_from_frames(frame_evidence, "compositionRisks", 80),
            "brollOpportunities": _unique_from_frames(frame_evidence, "brollOpportunities", 80),
            "captionObservations": _unique_from_frames(frame_evidence, "captionObservations", 80),
            "styleObservations": _unique_from_frames(frame_evidence, "styleObservations", 80),
            "frameEvidence": [{
                "frameId": frame["frameId"],
                "timeSeconds": frame.get("timeSeconds"),
                "summary": frame["summary"],
                "visibleSubjects": frame["visibleSubjects"],
                "visibleObjects": frame["visibleObjects"],
                "textLikeRegions": frame["textLikeRegions"],
                "safeZones": frame["safeZones"],
                "uncertainty": frame["uncertainty"],
            } for frame in frame_evidence],
            "model": {"modelId": MODEL_ID, "modelRevision": MODEL_REVISION, "modelAggregateSha256": MODEL_AGGREGATE_SHA256},
            "generatedAssetsCreated": False,
            "publicArtifactsCreated": False,
            "signedUrlsCreated": False,
            "runtime": {
                "elapsedMs": int((time.monotonic() - started) * 1000),
                "vllmVersion": _VLLM_VERSION,
                "droppedRuntimeKwargs": _VLLM_DROPPED_KWARGS,
                "modelAggregateSha256": MODEL_AGGREGATE_SHA256,
            },
        }
    except Exception as exc:
        return 500, {
            "ok": False,
            "reason": "qwen_real_frame_analysis_failed",
            "errorClass": exc.__class__.__name__,
            "errorSummary": str(exc)[:240],
            "generatedAssetsCreated": False,
            "publicArtifactsCreated": False,
            "signedUrlsCreated": False,
        }


def build_status() -> Dict[str, Any]:
    return {
        "ok": True,
        "mode": MODE,
        "requestSchemaVersion": REQUEST_SCHEMA_VERSION,
        "responseSchemaVersion": RESPONSE_SCHEMA_VERSION,
        "modelId": MODEL_ID,
        "modelRevision": MODEL_REVISION,
        "modelAggregateSha256": MODEL_AGGREGATE_SHA256,
        "realFrameAnalysisEnabled": _env_bool("QWEN_REAL_FRAME_ANALYSIS_ENABLED"),
        "modelInferenceEnabled": _env_bool("QWEN_INFERENCE_ENABLED"),
        "privateFramesOnly": True,
        "rawPromptAllowed": False,
        "generatedAssetsAllowed": False,
        "publicArtifactsAllowed": False,
        "signedUrlsAllowed": False,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "ReEditProQwenVisual/1"

    def _write_json(self, status: int, payload: Dict[str, Any]) -> None:
        encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("cache-control", "no-store")
        self.send_header("content-length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:
        if self.path in {"/", "/healthz", "/readyz"}:
            self._write_json(200, build_status())
            return
        self._write_json(404, {"ok": False, "reason": "not_found"})

    def do_POST(self) -> None:
        content_length = int(self.headers.get("content-length", "0") or "0")
        if content_length <= 0 or content_length > MAX_REQUEST_BYTES:
            self._write_json(413, {"ok": False, "reason": "request_size_invalid"})
            return
        try:
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._write_json(400, {"ok": False, "reason": "invalid_json"})
            return
        valid, reasons = validate_request(payload)
        if not valid:
            self._write_json(400, {"ok": False, "reason": "request_contract_rejected", "reasons": reasons})
            return
        status, result = run_analysis(payload)
        self._write_json(status, result)

    def log_message(self, format: str, *args: Any) -> None:
        return


def self_test() -> int:
    payload = {
        "schemaVersion": REQUEST_SCHEMA_VERSION,
        "requestId": "self-test",
        "workspaceId": "workspace",
        "projectId": "project",
        "editSessionId": "edit",
        "mediaAssetId": "asset",
        "task": {
            "useCase": "source_edit_planning",
            "outputMode": "structured_metadata_only",
            "analysisCategories": sorted(ALLOWED_ANALYSIS_CATEGORIES),
        },
        "frames": [{
            "frameId": "frame-1",
            "timeSeconds": 1.25,
            "contentType": "image/jpeg",
            "checksumSha256": "0" * 64,
            "imageBase64": "AA==",
        }],
        "safety": {
            "privateInputOnly": True,
            "rawPromptIncluded": False,
            "generatedAssetsAllowed": False,
            "publicArtifactsAllowed": False,
            "signedUrlsAllowed": False,
        },
    }
    valid, reasons = validate_request(payload)
    if not valid or reasons:
        raise AssertionError(f"valid contract rejected: {reasons}")
    unsafe = json.loads(json.dumps(payload))
    unsafe["prompt"] = "blocked"
    valid, reasons = validate_request(unsafe)
    if valid or not any(reason.startswith("blocked_field:") for reason in reasons):
        raise AssertionError("raw prompt field was not rejected")
    normalized = normalize_frame_result({
        "summary": "A presenter stands center frame.",
        "visible_subjects": ["presenter"],
        "visible_objects": ["desk"],
        "text_like_regions": [],
        "safe_zones": ["upper right"],
        "composition_risks": ["face occupies center"],
        "broll_opportunities": ["desk setup"],
        "caption_observations": [],
        "style_observations": ["clean centered composition"],
        "uncertainty": [],
    }, {"frameId": "frame-1", "timeSeconds": 1.25})
    if normalized["frameId"] != "frame-1" or normalized["visibleSubjects"] != ["presenter"]:
        raise AssertionError("frame normalization failed")
    print(json.dumps({"ok": True, "status": "qwen_visual_worker_contract_passed"}, sort_keys=True))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    port = int(os.environ.get("PORT", "8080"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
