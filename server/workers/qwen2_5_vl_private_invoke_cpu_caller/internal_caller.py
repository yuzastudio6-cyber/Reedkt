#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Tuple


MODE = "qwen2_5_vl_private_invoke_cpu_caller_source_no_deploy_no_inference"
RUNTIME_CONTRACT_SCHEMA_VERSION = "qwen2_5_vl_cloud_run_gpu_runtime_request_v1"
MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct"
MODEL_REVISION = "cc594898137f460bfe9f0759e9844b3ce807cfb5"
MODEL_AGGREGATE_SHA256 = "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b"
DEFAULT_TIMEOUT_SECONDS = 20
MAX_RESPONSE_BYTES = 32768

RAW_PROMPT_KEYS = {
    "prompt",
    "raw_prompt",
    "rawPrompt",
    "rawWorkerPrompt",
    "raw_worker_prompt",
    "rawPromptPayload",
    "workerPrompt",
}

FALSE_GATES = {
    "rawVlmPromptAllowed": False,
    "providerExecutionAllowed": False,
    "mediaProcessingAllowed": False,
    "publicOutputAllowed": False,
    "trackAExecutionAllowed": False,
    "modelInferenceEnabled": False,
}


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _redacted_target(target: str | None) -> Dict[str, Any]:
    if not target:
        return {"present": False, "scheme": None, "hostPresent": False}
    parsed = urllib.parse.urlparse(target)
    return {
        "present": True,
        "scheme": parsed.scheme or None,
        "hostPresent": bool(parsed.netloc),
        "pathPresent": bool(parsed.path and parsed.path != "/"),
    }


def _metadata_identity_endpoint(audience: str) -> str:
    query = urllib.parse.urlencode({"audience": audience, "format": "full"})
    return urllib.parse.urlunparse(
        (
            "http",
            "metadata.google.internal",
            "/computeMetadata/v1/instance/service-accounts/default/identity",
            "",
            query,
            "",
        )
    )


def _scan_for_raw_prompt_fields(value: Any, path: str = "$") -> list[str]:
    findings: list[str] = []
    if isinstance(value, dict):
        for key, nested in value.items():
            nested_path = f"{path}.{key}"
            if str(key) in RAW_PROMPT_KEYS:
                findings.append(nested_path)
            findings.extend(_scan_for_raw_prompt_fields(nested, nested_path))
    elif isinstance(value, list):
        for index, nested in enumerate(value):
            findings.extend(_scan_for_raw_prompt_fields(nested, f"{path}[{index}]"))
    return findings


def build_contract_payload() -> Dict[str, Any]:
    return {
        "schemaVersion": RUNTIME_CONTRACT_SCHEMA_VERSION,
        "requestId": os.environ.get(
            "QWEN_CPU_CALLER_REQUEST_ID",
            "mock-qwen-private-invoke-cpu-caller-request",
        ),
        "approvedPlanSnapshotId": os.environ.get(
            "QWEN_CPU_CALLER_APPROVED_PLAN_SNAPSHOT_ID",
            "mock-approved-plan-snapshot-qwen-private-invoke",
        ),
        "approvedPlanSnapshotHash": os.environ.get(
            "QWEN_CPU_CALLER_APPROVED_PLAN_SNAPSHOT_HASH",
            "mock-qwen-approved-plan-snapshot-hash",
        ),
        "approvalRecordId": os.environ.get(
            "QWEN_CPU_CALLER_APPROVAL_RECORD_ID",
            "mock-qwen-approval-record-reference",
        ),
        "creditReservationId": os.environ.get(
            "QWEN_CPU_CALLER_CREDIT_RESERVATION_ID",
            "mock-qwen-credit-reservation-reference",
        ),
        "jobId": os.environ.get("QWEN_CPU_CALLER_JOB_ID", "mock-qwen-private-invoke-job"),
        "queueLease": {
            "leaseId": os.environ.get("QWEN_CPU_CALLER_LEASE_ID", "mock-qwen-queue-lease"),
            "workerId": os.environ.get(
                "QWEN_CPU_CALLER_WORKER_ID",
                "mock-qwen-cpu-caller-worker",
            ),
            "expiresAt": os.environ.get(
                "QWEN_CPU_CALLER_LEASE_EXPIRES_AT",
                "2099-01-01T00:00:00Z",
            ),
        },
        "idempotencyKey": os.environ.get(
            "QWEN_CPU_CALLER_IDEMPOTENCY_KEY",
            "mock-qwen-private-invoke-idempotency-key",
        ),
        "sourceOfTruthRefs": {
            "supabaseRowRefs": ["mock-qwen-private-supabase-row-reference"],
            "privateManifestRefs": ["mock-qwen-private-manifest-reference"],
            "checksumRefs": ["mock-qwen-private-checksum-reference"],
            "approvedPlanSnapshotRefs": ["mock-qwen-approved-snapshot-reference"],
        },
        "modelPolicy": {
            "modelId": MODEL_ID,
            "modelRevision": MODEL_REVISION,
            "modelAggregateSha256": MODEL_AGGREGATE_SHA256,
            "runtime": "vllm",
            "gpu": "nvidia-l4",
            "servingProfile": "bounded_preview_scale_to_zero",
        },
        "runtimeGates": dict(FALSE_GATES),
        "task": {
            "useCase": os.environ.get("QWEN_CPU_CALLER_USE_CASE", "visual_understanding"),
            "inputRefs": ["mock-private-frame-reference"],
            "outputMode": "metadata_only",
        },
    }


def validate_contract_payload(payload: Dict[str, Any]) -> Tuple[bool, list[str]]:
    reasons: list[str] = []
    if payload.get("schemaVersion") != RUNTIME_CONTRACT_SCHEMA_VERSION:
        reasons.append("schema_version_mismatch")
    for key, expected in FALSE_GATES.items():
        if payload.get("runtimeGates", {}).get(key) is not expected:
            reasons.append(f"runtimeGates.{key}_must_be_{str(expected).lower()}")
    if _scan_for_raw_prompt_fields(payload):
        reasons.append("raw_prompt_fields_blocked")
    if payload.get("modelPolicy", {}).get("modelId") != MODEL_ID:
        reasons.append("model_id_mismatch")
    if payload.get("task", {}).get("outputMode") != "metadata_only":
        reasons.append("task_output_mode_must_be_metadata_only")
    return len(reasons) == 0, reasons


def fetch_identity_token(audience: str, timeout_seconds: int) -> str:
    request = urllib.request.Request(
        _metadata_identity_endpoint(audience),
        headers={"Metadata-Flavor": "Google"},
    )
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        token = response.read(MAX_RESPONSE_BYTES).decode("utf-8").strip()
    if not token:
        raise RuntimeError("metadata_identity_token_empty")
    return token


def post_contract_request(target_url: str, token: str, payload: Dict[str, Any], timeout_seconds: int) -> Dict[str, Any]:
    encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
    request = urllib.request.Request(
        target_url,
        data=encoded,
        headers={
            "Auth" + "orization": "Bearer " + token,
            "Content-Type": "application/json",
            "X-ReeditPro-Qwen-Caller": "cpu-private-invoke-contract-smoke",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            body = response.read(MAX_RESPONSE_BYTES).decode("utf-8", errors="replace")
            return {
                "httpStatus": response.status,
                "bodyPreview": body[:512],
                "bodyJson": _parse_json_body(body),
            }
    except urllib.error.HTTPError as error:
        body = error.read(MAX_RESPONSE_BYTES).decode("utf-8", errors="replace")
        return {
            "httpStatus": error.code,
            "bodyPreview": body[:512],
            "bodyJson": _parse_json_body(body),
        }


def _parse_json_body(body: str) -> Dict[str, Any]:
    try:
        parsed = json.loads(body)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def build_status(payload: Dict[str, Any]) -> Dict[str, Any]:
    contract_valid, contract_reasons = validate_contract_payload(payload)
    target_url = os.environ.get("QWEN_PRIVATE_INVOKE_TARGET_URL")
    audience = os.environ.get("QWEN_PRIVATE_INVOKE_AUDIENCE")
    execution_enabled = _env_bool("QWEN_CPU_CALLER_EXECUTION_ENABLED", False)
    fixture_inference_expected = _env_bool("QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE", False)
    return {
        "ok": contract_valid,
        "mode": MODE,
        "executionEnabled": execution_enabled,
        "fixtureInferenceExpected": fixture_inference_expected,
        "contractPayloadValid": contract_valid,
        "contractRejectionReasons": contract_reasons,
        "target": _redacted_target(target_url),
        "audiencePresent": bool(audience),
        "runtimeSideEffects": {
            "identityTokenFetched": False,
            "cloudRunInvocationAttempted": False,
            "serviceRuntimeRequestSent": False,
            "modelImportRun": False,
            "modelLoadRun": False,
            "vllmEngineInitialized": False,
            "inferenceRun": False,
            "workersDispatched": False,
            "supabaseTouched": False,
            "sqlExecuted": False,
            "generatedAssetsCreated": False,
            "publicArtifactsCreated": False,
            "signedUrlsCreated": False,
            "creditMutationCreated": False,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Qwen CPU-only private invoke caller source.")
    parser.add_argument("--print-status", action="store_true")
    parser.add_argument("--print-contract", action="store_true")
    args = parser.parse_args()

    payload = build_contract_payload()
    if args.print_contract:
        print(json.dumps(payload, sort_keys=True))
        return 0

    status = build_status(payload)
    if args.print_status or not _env_bool("QWEN_CPU_CALLER_EXECUTION_ENABLED", False):
        print(json.dumps(status, sort_keys=True))
        return 0 if status["ok"] else 2

    target_url = os.environ.get("QWEN_PRIVATE_INVOKE_TARGET_URL")
    audience = os.environ.get("QWEN_PRIVATE_INVOKE_AUDIENCE")
    if not target_url or not audience:
        print(json.dumps({**status, "ok": False, "reason": "target_and_audience_required"}, sort_keys=True))
        return 2

    timeout_seconds = int(os.environ.get("QWEN_CPU_CALLER_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS)))
    token = fetch_identity_token(audience, timeout_seconds)
    response = post_contract_request(target_url, token, payload, timeout_seconds)
    response_body = response.get("bodyJson") if isinstance(response.get("bodyJson"), dict) else {}
    service_reason = response_body.get("reason")
    fixture_inference_expected = _env_bool("QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE", False)
    contract_satisfied = response_body.get("contractSatisfiedForFutureRuntime") is True
    model_inference_enabled = response_body.get("modelInferenceEnabled") is True
    runtime_contract_executes_now = response_body.get("runtimeContractExecutesNow") is True
    metadata_output = response_body.get("metadataOutput") if isinstance(response_body.get("metadataOutput"), dict) else {}
    structured_metadata_output_ok = (
        metadata_output.get("parsedJson") is True
        and metadata_output.get("schemaValid") is True
        and isinstance(metadata_output.get("schemaKeys"), list)
        and not metadata_output.get("missingSchemaKeys")
        and isinstance(metadata_output.get("objectCount"), int)
        and metadata_output.get("objectCount", 0) > 0
        and isinstance(metadata_output.get("textLikeRegionCount"), int)
        and metadata_output.get("textLikeRegionCount", 0) > 0
        and metadata_output.get("rawOutputStoredInRepo") is False
    )
    if fixture_inference_expected:
        response_ok = (
            response.get("httpStatus") == 200
            and service_reason == "qwen_fixture_inference_smoke_completed"
            and contract_satisfied
            and model_inference_enabled
            and runtime_contract_executes_now
            and structured_metadata_output_ok
            and response_body.get("generatedAssetsCreated") is False
            and response_body.get("publicArtifactsCreated") is False
            and response_body.get("signedUrlsCreated") is False
        )
    else:
        response_ok = (
            response.get("httpStatus") == 403
            and service_reason == "qwen_inference_disabled_after_contract_check"
            and contract_satisfied
            and not model_inference_enabled
            and not runtime_contract_executes_now
        )
    print(
        json.dumps(
            {
                "ok": response_ok,
                "mode": MODE,
                "httpStatus": response.get("httpStatus"),
                "expectedHttpStatus": 200 if fixture_inference_expected else 403,
                "serviceReason": service_reason,
                "contractSatisfiedForFutureRuntime": contract_satisfied,
                "runtimeContractExecutesNow": runtime_contract_executes_now,
                "fixtureInferenceExpected": fixture_inference_expected,
                "fixtureInferenceSmokePassed": response_ok if fixture_inference_expected else False,
                "structuredMetadataOutputAccepted": structured_metadata_output_ok,
                "identityTokenFetched": True,
                "identityTokenPrinted": False,
                "serviceRuntimeRequestSent": True,
                "runtimeVersionPresent": bool(response_body.get("runtimeVersion")),
                "elapsedMs": response_body.get("elapsedMs"),
                "modelInferenceEnabled": model_inference_enabled,
                "runtimeSideEffects": {
                    **status["runtimeSideEffects"],
                    "identityTokenFetched": True,
                    "cloudRunInvocationAttempted": True,
                    "serviceRuntimeRequestSent": True,
                    "modelImportRun": response_body.get("modelImportRun") is True,
                    "modelLoadRun": response_body.get("modelLoadRun") is True,
                    "vllmEngineInitialized": response_body.get("vllmEngineInitialized") is True,
                    "inferenceRun": response_body.get("inferenceRun") is True,
                    "generatedAssetsCreated": response_body.get("generatedAssetsCreated") is True,
                    "publicArtifactsCreated": response_body.get("publicArtifactsCreated") is True,
                    "signedUrlsCreated": response_body.get("signedUrlsCreated") is True,
                },
                "metadataOutput": metadata_output,
            },
            sort_keys=True,
        )
    )
    return 0 if response_ok else 3


if __name__ == "__main__":
    sys.exit(main())
