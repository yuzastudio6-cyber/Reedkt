#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
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
    return {
        "ok": all(false_gate_status.values()) and all(true_gate_status.values()),
        "mode": MODE,
        "modelId": MODEL_ID,
        "modelRevision": MODEL_REVISION,
        "modelAggregateSha256": MODEL_AGGREGATE_SHA256,
        "modelCacheMount": os.environ.get("QWEN_MODEL_CACHE_MOUNT", "/models/qwen2.5-vl-7b-instruct"),
        "modelImportOnStartup": False,
        "modelInferenceEnabled": False,
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
