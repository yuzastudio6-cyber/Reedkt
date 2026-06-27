#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import inspect
import json
import os
import time
import urllib.request
from contextlib import AbstractContextManager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Tuple


MODE = "qwen2_5_vl_cloud_run_gpu_source_spec_fail_closed"
MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct"
MODEL_REVISION = "cc594898137f460bfe9f0759e9844b3ce807cfb5"
MODEL_AGGREGATE_SHA256 = "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b"
RUNTIME_CONTRACT_SCHEMA_VERSION = "qwen2_5_vl_cloud_run_gpu_runtime_request_v1"
MAX_REQUEST_BYTES = 65536

RAW_PROMPT_KEYS = {
    "prompt",
    "raw_prompt",
    "rawPrompt",
    "rawWorkerPrompt",
    "raw_worker_prompt",
    "rawPromptPayload",
    "workerPrompt",
}

REQUIRED_RUNTIME_REQUEST_FIELDS = {
    "schemaVersion",
    "requestId",
    "approvedPlanSnapshotId",
    "approvedPlanSnapshotHash",
    "approvalRecordId",
    "creditReservationId",
    "jobId",
    "queueLease",
    "idempotencyKey",
    "sourceOfTruthRefs",
    "modelPolicy",
    "runtimeGates",
    "task",
}

FALSE_GATE_ENV = {
    "MODEL_DOWNLOADS_ENABLED": "false",
    "RAW_VLM_PROMPT_ENABLED": "false",
    "PROVIDER_EXECUTION_ENABLED": "false",
    "MEDIA_PROCESSING_ENABLED": "false",
    "PUBLIC_OUTPUT_ENABLED": "false",
    "TRACK_A_EXECUTION_ENABLED": "false",
    "QWEN_MODEL_IMPORT_ON_STARTUP": "false",
    "QWEN_INFERENCE_ENABLED": "false",
}

TRUE_GATE_ENV = {
    "QWEN_APPROVED_SNAPSHOT_REQUIRED": "true",
    "QWEN_QUEUE_LEASE_REQUIRED": "true",
}

APPROVED_FIXTURE_INFERENCE_ENV = {
    "QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED": "true",
    "QWEN_INFERENCE_ENABLED": "true",
}

_VLLM_ENGINE: Any = None
_VLLM_VERSION: str | None = None
_VLLM_DROPPED_KWARGS: List[str] = []


RUNTIME_CONTRACT = {
    "schemaVersion": RUNTIME_CONTRACT_SCHEMA_VERSION,
    "status": "contract_defined_execution_disabled",
    "approvedSnapshotRequired": True,
    "queueLeaseRequired": True,
    "idempotencyKeyRequired": True,
    "creditReservationRequired": True,
    "sourceOfTruthRequired": [
        "supabaseRowRefs",
        "privateManifestRefs",
        "checksumRefs",
        "approvedPlanSnapshotRefs",
    ],
    "requiredFields": sorted(REQUIRED_RUNTIME_REQUEST_FIELDS),
    "allowedTaskUseCases": [
        "visual_understanding",
        "broll_candidate_review",
        "frame_asset_qa",
        "caption_visual_consistency_qa",
    ],
    "blockedPayloadFields": sorted(RAW_PROMPT_KEYS),
    "runtimeGatesRequired": {
        "rawVlmPromptAllowed": False,
        "providerExecutionAllowed": False,
        "mediaProcessingAllowed": False,
        "publicOutputAllowed": False,
        "trackAExecutionAllowed": False,
        "modelInferenceEnabled": False,
    },
    "modelPolicyRequired": {
        "modelId": MODEL_ID,
        "modelRevision": MODEL_REVISION,
        "modelAggregateSha256": MODEL_AGGREGATE_SHA256,
        "runtime": "vllm",
        "gpu": "nvidia-l4",
        "servingProfile": "bounded_preview_scale_to_zero",
    },
    "execution": {
        "contractCanExecuteNow": False,
        "modelImportOnStartup": False,
        "modelInferenceEnabled": False,
        "serviceRuntimeRequestExecutes": False,
    },
}


def _env_value(name: str, default: str) -> str:
    return os.environ.get(name, default).strip().lower()


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int, minimum: int, maximum: int) -> int:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        value = int(raw.strip())
    except ValueError as exc:
        raise RuntimeError(f"{name}_must_be_integer") from exc
    if value < minimum or value > maximum:
        raise RuntimeError(f"{name}_outside_allowed_range")
    return value


def _non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _scan_for_raw_prompt_fields(value: Any, path: str = "$") -> List[str]:
    findings: List[str] = []
    if isinstance(value, dict):
        for key, item in value.items():
            item_path = f"{path}.{key}"
            if str(key) in RAW_PROMPT_KEYS:
                findings.append(item_path)
            findings.extend(_scan_for_raw_prompt_fields(item, item_path))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            findings.extend(_scan_for_raw_prompt_fields(item, f"{path}[{index}]"))
    return findings


def validate_runtime_request(payload: Any) -> Tuple[bool, List[str]]:
    reasons: List[str] = []
    if not isinstance(payload, dict):
        return False, ["payload_must_be_json_object"]

    missing = sorted(field for field in REQUIRED_RUNTIME_REQUEST_FIELDS if field not in payload)
    reasons.extend(f"missing_{field}" for field in missing)

    if payload.get("schemaVersion") != RUNTIME_CONTRACT_SCHEMA_VERSION:
        reasons.append("schema_version_mismatch")

    for field in [
        "requestId",
        "approvedPlanSnapshotId",
        "approvedPlanSnapshotHash",
        "approvalRecordId",
        "creditReservationId",
        "jobId",
        "idempotencyKey",
    ]:
        if field in payload and not _non_empty_string(payload.get(field)):
            reasons.append(f"{field}_must_be_non_empty_string")

    queue_lease = payload.get("queueLease")
    if isinstance(queue_lease, dict):
        for field in ["leaseId", "workerId", "expiresAt"]:
            if not _non_empty_string(queue_lease.get(field)):
                reasons.append(f"queueLease.{field}_required")
    elif "queueLease" in payload:
        reasons.append("queueLease_must_be_object")

    source_refs = payload.get("sourceOfTruthRefs")
    if isinstance(source_refs, dict):
        for field in RUNTIME_CONTRACT["sourceOfTruthRequired"]:
            refs = source_refs.get(field)
            if not isinstance(refs, list) or len(refs) == 0:
                reasons.append(f"sourceOfTruthRefs.{field}_must_be_non_empty_array")
    elif "sourceOfTruthRefs" in payload:
        reasons.append("sourceOfTruthRefs_must_be_object")

    model_policy = payload.get("modelPolicy")
    if isinstance(model_policy, dict):
        if model_policy.get("modelId") != MODEL_ID:
            reasons.append("modelPolicy.modelId_mismatch")
        if model_policy.get("modelRevision") != MODEL_REVISION:
            reasons.append("modelPolicy.modelRevision_mismatch")
        if model_policy.get("modelAggregateSha256") != MODEL_AGGREGATE_SHA256:
            reasons.append("modelPolicy.modelAggregateSha256_mismatch")
    elif "modelPolicy" in payload:
        reasons.append("modelPolicy_must_be_object")

    runtime_gates = payload.get("runtimeGates")
    if isinstance(runtime_gates, dict):
        for field, expected in RUNTIME_CONTRACT["runtimeGatesRequired"].items():
            if runtime_gates.get(field) is not expected:
                reasons.append(f"runtimeGates.{field}_must_be_{str(expected).lower()}")
    elif "runtimeGates" in payload:
        reasons.append("runtimeGates_must_be_object")

    task = payload.get("task")
    if isinstance(task, dict):
        if task.get("useCase") not in RUNTIME_CONTRACT["allowedTaskUseCases"]:
            reasons.append("task.useCase_not_allowed")
    elif "task" in payload:
        reasons.append("task_must_be_object")

    raw_prompt_findings = _scan_for_raw_prompt_fields(payload)
    reasons.extend(f"raw_prompt_field_blocked:{finding}" for finding in raw_prompt_findings)

    return len(reasons) == 0, reasons


def build_status() -> Dict[str, Any]:
    false_gate_status = {
        name: _env_value(name, expected) == expected for name, expected in FALSE_GATE_ENV.items()
    }
    true_gate_status = {
        name: _env_value(name, expected) == expected for name, expected in TRUE_GATE_ENV.items()
    }
    approved_fixture_inference_enabled = all(
        _env_value(name, expected) == expected
        for name, expected in APPROVED_FIXTURE_INFERENCE_ENV.items()
    )
    production_false_gate_ok = all(
        status
        for name, status in false_gate_status.items()
        if name not in {"QWEN_MODEL_IMPORT_ON_STARTUP", "QWEN_INFERENCE_ENABLED"}
    )
    model_runtime_gate_ok = (
        false_gate_status["QWEN_MODEL_IMPORT_ON_STARTUP"]
        or approved_fixture_inference_enabled
    ) and (
        false_gate_status["QWEN_INFERENCE_ENABLED"]
        or approved_fixture_inference_enabled
    )
    return {
        "ok": production_false_gate_ok and model_runtime_gate_ok and all(true_gate_status.values()),
        "mode": MODE,
        "modelId": MODEL_ID,
        "modelRevision": MODEL_REVISION,
        "modelAggregateSha256": MODEL_AGGREGATE_SHA256,
        "modelCacheMount": os.environ.get("QWEN_MODEL_CACHE_MOUNT", "/models/qwen2.5-vl-7b-instruct"),
        "approvedFixtureInferenceEnabled": approved_fixture_inference_enabled,
        "modelImportOnStartup": _env_bool("QWEN_MODEL_IMPORT_ON_STARTUP", False),
        "modelInferenceEnabled": _env_bool("QWEN_INFERENCE_ENABLED", False),
        "approvedSnapshotRequired": True,
        "queueLeaseRequired": True,
        "runtimeContract": RUNTIME_CONTRACT,
        "falseGateStatus": false_gate_status,
        "trueGateStatus": true_gate_status,
        "runtimeSideEffects": {
            "modelLoaded": False,
            "inferenceRun": False,
            "providerCallMade": False,
            "workerDispatchMade": False,
            "supabaseTouched": False,
            "sqlExecuted": False,
            "publicArtifactCreated": False,
            "signedUrlCreated": False,
            "creditMutationCreated": False,
        },
    }


class NetworkGuard(AbstractContextManager):
    def __init__(self) -> None:
        self.network_attempted = False
        self._urlopen = None

    def __enter__(self):
        self._urlopen = urllib.request.urlopen

        def blocked_urlopen(*_args: Any, **_kwargs: Any) -> Any:
            self.network_attempted = True
            raise RuntimeError("QWEN_FIXTURE_RUNTIME_NETWORK_BLOCKED")

        urllib.request.urlopen = blocked_urlopen
        return self

    def __exit__(self, exc_type: Any, exc_value: Any, tb: Any) -> bool:
        if self._urlopen is not None:
            urllib.request.urlopen = self._urlopen
        return False


def _supported_llm_kwargs(llm_class: Any, kwargs: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    signature = inspect.signature(llm_class.__init__)
    parameters = signature.parameters
    if any(parameter.kind == inspect.Parameter.VAR_KEYWORD for parameter in parameters.values()):
        return kwargs, []
    filtered: Dict[str, Any] = {}
    dropped: List[str] = []
    for key, value in kwargs.items():
        if key in parameters:
            filtered[key] = value
        else:
            dropped.append(key)
    return filtered, dropped


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

        llm_kwargs = {
            "model": str(model_dir),
            "tokenizer": str(model_dir),
            "trust_remote_code": True,
            "dtype": os.environ.get("QWEN_VLLM_DTYPE", "bfloat16"),
            "max_model_len": int(os.environ.get("QWEN_VLLM_MAX_MODEL_LEN", "4096")),
            "limit_mm_per_prompt": {"image": 1},
            "max_num_seqs": int(os.environ.get("QWEN_VLLM_MAX_NUM_SEQS", "1")),
            "max_num_batched_tokens": int(os.environ.get("QWEN_VLLM_MAX_NUM_BATCHED_TOKENS", "4096")),
            "enforce_eager": _env_bool("QWEN_VLLM_ENFORCE_EAGER", True),
            "gpu_memory_utilization": float(os.environ.get("QWEN_VLLM_GPU_MEMORY_UTILIZATION", "0.86")),
            "mm_processor_cache_gb": float(os.environ.get("QWEN_VLLM_MM_PROCESSOR_CACHE_GB", "0")),
            "disable_log_stats": True,
        }
        llm_kwargs, dropped_kwargs = _supported_llm_kwargs(LLM, llm_kwargs)
        _VLLM_ENGINE = LLM(**llm_kwargs)
        _VLLM_VERSION = getattr(vllm, "__version__", "unknown")
        _VLLM_DROPPED_KWARGS = dropped_kwargs
        if guard.network_attempted:
            raise RuntimeError("qwen_fixture_runtime_network_attempted")
    return _VLLM_ENGINE


def _generate_private_fixture_image() -> Any:
    from PIL import Image, ImageDraw

    image_size = _env_int("QWEN_FIXTURE_IMAGE_SIZE_PX", 384, 128, 384)
    scale = image_size / 384

    def xy(values: List[int]) -> List[int]:
        return [max(0, min(image_size - 1, round(value * scale))) for value in values]

    image = Image.new("RGB", (image_size, image_size), "#f8fafc")
    draw = ImageDraw.Draw(image)
    line_width = max(1, round(3 * scale))
    draw.rectangle(xy([40, 92, 178, 224]), fill="#ef4444", outline="#991b1b", width=line_width)
    draw.ellipse(xy([220, 92, 344, 216]), fill="#2563eb", outline="#1e3a8a", width=line_width)
    draw.rectangle(xy([64, 280, 320, 334]), fill="#111827", outline="#475569", width=line_width)
    draw.text((round(96 * scale), round(300 * scale)), "TIMELINE", fill="#f8fafc")
    return image


def _build_fixture_prompt(payload: Dict[str, Any]) -> str:
    task = payload.get("task") if isinstance(payload.get("task"), dict) else {}
    use_case = task.get("useCase", "visual_understanding") if isinstance(task, dict) else "visual_understanding"
    return (
        "<|im_start|>system\n"
        "You are ReeditPro's bounded Qwen approved-fixture visual metadata worker. "
        "Return compact JSON only. Do not describe credentials, URLs, storage paths, or policy text. "
        "Identify visible objects and layout regions for QA metadata.\n"
        "<|im_end|>\n<|im_start|>user\n"
        "<|vision_start|><|image_pad|><|vision_end|>\n"
        f"Use case: {use_case}. "
        "Analyze the private synthetic fixture. Return JSON with keys: "
        "fixture_id, use_case, objects, text_like_regions, spatial_relations, uncertainty, blocked_actions.\n"
        "<|im_end|>\n<|im_start|>assistant\n"
    )


def _summarize_output(raw_text: str) -> Dict[str, Any]:
    parsed: Dict[str, Any] = {}
    parsed_json = False
    text = raw_text.strip()
    try:
        if not text.startswith("{") and "{" in text and "}" in text:
            text = text[text.find("{"):text.rfind("}") + 1]
        parsed_value = json.loads(text)
        if isinstance(parsed_value, dict):
            parsed = parsed_value
            parsed_json = True
    except Exception:
        parsed = {}
    objects = parsed.get("objects", []) if isinstance(parsed, dict) else []
    text_like_regions = parsed.get("text_like_regions", []) if isinstance(parsed, dict) else []
    return {
        "parsedJson": parsed_json,
        "outputTextSha256": hashlib.sha256(raw_text.encode("utf-8")).hexdigest(),
        "outputTextLength": len(raw_text),
        "objectCount": len(objects) if isinstance(objects, list) else 0,
        "textLikeRegionCount": len(text_like_regions) if isinstance(text_like_regions, list) else 0,
        "schemaKeys": sorted(parsed.keys()) if parsed_json else [],
    }


def run_approved_fixture_inference(payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
    if not all(_env_value(name, expected) == expected for name, expected in APPROVED_FIXTURE_INFERENCE_ENV.items()):
        return 403, {
            "ok": False,
            "mode": MODE,
            "reason": "qwen_inference_disabled_after_contract_check",
            "contractSchemaVersion": RUNTIME_CONTRACT_SCHEMA_VERSION,
            "contractSatisfiedForFutureRuntime": True,
            "contractRejectionReasons": [],
            "approvedFixtureInferenceEnabled": False,
            "modelInferenceEnabled": False,
            "runtimeContractExecutesNow": False,
        }

    started_at = time.monotonic()
    try:
        with NetworkGuard() as guard:
            from vllm import SamplingParams

            llm = _get_vllm_engine()
            prompt = _build_fixture_prompt(payload)
            image = _generate_private_fixture_image()
            sampling = SamplingParams(
                temperature=0.0,
                top_p=1.0,
                max_tokens=int(os.environ.get("QWEN_FIXTURE_MAX_TOKENS", "180")),
            )
            outputs = llm.generate([{
                "prompt": prompt,
                "multi_modal_data": {"image": image},
            }], sampling)
            if guard.network_attempted:
                raise RuntimeError("qwen_fixture_runtime_network_attempted")
        raw_text = outputs[0].outputs[0].text if outputs and outputs[0].outputs else ""
        elapsed_ms = int((time.monotonic() - started_at) * 1000)
        return 200, {
            "ok": True,
            "mode": MODE,
            "reason": "qwen_fixture_inference_smoke_completed",
            "contractSchemaVersion": RUNTIME_CONTRACT_SCHEMA_VERSION,
            "contractSatisfiedForFutureRuntime": True,
            "contractRejectionReasons": [],
            "approvedFixtureInferenceEnabled": True,
            "runtimeContractExecutesNow": True,
            "modelInferenceEnabled": True,
            "modelImportRun": True,
            "modelLoadRun": True,
            "vllmEngineInitialized": True,
            "inferenceRun": True,
            "runtimeVersion": _VLLM_VERSION,
            "droppedRuntimeKwargs": _VLLM_DROPPED_KWARGS,
            "selectedGpu": "nvidia-l4",
            "modelRevision": MODEL_REVISION,
            "modelAggregateSha256": MODEL_AGGREGATE_SHA256,
            "fixtureId": "fixture_mock_qwen_approved_private_frame_001",
            "useCase": payload.get("task", {}).get("useCase") if isinstance(payload.get("task"), dict) else None,
            "elapsedMs": elapsed_ms,
            "metadataOutput": _summarize_output(raw_text),
            "generatedAssetsCreated": False,
            "publicArtifactsCreated": False,
            "signedUrlsCreated": False,
            "betaReady": False,
            "productionReady": False,
        }
    except Exception as exc:
        elapsed_ms = int((time.monotonic() - started_at) * 1000)
        return 500, {
            "ok": False,
            "mode": MODE,
            "reason": "qwen_fixture_inference_smoke_failed",
            "contractSchemaVersion": RUNTIME_CONTRACT_SCHEMA_VERSION,
            "contractSatisfiedForFutureRuntime": True,
            "contractRejectionReasons": [],
            "approvedFixtureInferenceEnabled": True,
            "runtimeContractExecutesNow": False,
            "modelInferenceEnabled": True,
            "modelImportRun": False,
            "modelLoadRun": False,
            "vllmEngineInitialized": False,
            "inferenceRun": False,
            "errorClass": exc.__class__.__name__,
            "errorSummary": str(exc)[:240],
            "elapsedMs": elapsed_ms,
            "generatedAssetsCreated": False,
            "publicArtifactsCreated": False,
            "signedUrlsCreated": False,
            "betaReady": False,
            "productionReady": False,
        }


class Handler(BaseHTTPRequestHandler):
    server_version = "ReeditProQwenSourceSpec/0"

    def _write_json(self, status: int, payload: Dict[str, Any]) -> None:
        encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("cache-control", "no-store")
        self.send_header("content-length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:
        if self.path == "/contract":
            self._write_json(200, {"ok": True, "mode": MODE, "runtimeContract": RUNTIME_CONTRACT})
            return
        if self.path in {"/", "/healthz", "/readyz"}:
            status_payload = build_status()
            self._write_json(200 if status_payload["ok"] else 503, status_payload)
            return
        self._write_json(404, {"ok": False, "mode": MODE, "reason": "not_found"})

    def do_POST(self) -> None:
        content_length = int(self.headers.get("content-length", "0") or "0")
        if content_length > MAX_REQUEST_BYTES:
            self._write_json(
                413,
                {
                    "ok": False,
                    "mode": MODE,
                    "reason": "request_too_large",
                    "maxRequestBytes": MAX_REQUEST_BYTES,
                },
            )
            return

        raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._write_json(
                400,
                {
                    "ok": False,
                    "mode": MODE,
                    "reason": "invalid_json",
                    "contractSchemaVersion": RUNTIME_CONTRACT_SCHEMA_VERSION,
                },
            )
            return

        contract_valid, contract_reasons = validate_runtime_request(payload)
        if contract_valid and all(
            _env_value(name, expected) == expected
            for name, expected in APPROVED_FIXTURE_INFERENCE_ENV.items()
        ):
            status_code, result_payload = run_approved_fixture_inference(payload)
            self._write_json(status_code, result_payload)
            return

        self._write_json(
            403,
            {
                "ok": False,
                "mode": MODE,
                "reason": "qwen_inference_disabled_after_contract_check"
                if contract_valid
                else "qwen_runtime_contract_rejected",
                "contractSchemaVersion": RUNTIME_CONTRACT_SCHEMA_VERSION,
                "contractSatisfiedForFutureRuntime": contract_valid,
                "contractRejectionReasons": contract_reasons,
                "modelInferenceEnabled": False,
                "approvedSnapshotRequired": True,
                "queueLeaseRequired": True,
                "runtimeContractExecutesNow": False,
            },
        )

    def log_message(self, format: str, *args: Any) -> None:
        return


def main() -> None:
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    server.serve_forever()


if __name__ == "__main__":
    main()
