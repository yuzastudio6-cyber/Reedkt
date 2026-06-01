#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from google.cloud import storage

from perception_alias_map import alias_report
from perception_canary_fixtures import manifest as canary_manifest
from run_sglang_generated_fixture import MATRIX_ID, PHASE, required_generated_specs


QA_BUCKET = "reeditpro-staging-reeditpro-qa-artifacts"
MODEL_ID = os.environ.get("REEDITPRO_VLM_MODEL_ID", "")
MODEL_REVISION = os.environ.get("REEDITPRO_VLM_MODEL_REVISION", "")
MODEL_GCS_PATH = os.environ.get("REEDITPRO_VLM_MODEL_GCS_PATH", "")
AGGREGATE_SHA256 = os.environ.get("REEDITPRO_VLM_AGGREGATE_SHA256", "")
MODEL_DIR_NAME = os.environ.get("REEDITPRO_VLM_MODEL_DIR_NAME", "qwen3-vl-candidate")

REPORT_FILES = [
    "phase_39c_sg_sglang_runtime_plan.json",
    "phase_39c_sg_sglang_source_evidence.json",
    "phase_39c_sg_sglang_license_evidence.json",
    "phase_39c_sg_sglang_runtime_support_evidence.json",
    "phase_39c_sg_sglang_structured_output_evidence.json",
    "phase_39c_sg_candidate_manifest.json",
    "phase_39c_sg_canary_fixture_manifest.json",
    "phase_39c_sg_generated_fixture_manifest.json",
    "phase_39c_sg_label_alias_map.json",
    "phase_39c_sg_model_asset_verification.json",
    "phase_39c_sg_runtime_capability_report.json",
    "phase_39c_sg_strategy_matrix_report.json",
    "phase_39c_sg_text_only_smoke_report.json",
    "phase_39c_sg_freeform_perception_report.json",
    "phase_39c_sg_labels_only_qa_report.json",
    "phase_39c_sg_coarse_region_qa_report.json",
    "phase_39c_sg_safe_zone_reasoning_report.json",
    "phase_39c_sg_decomposed_canonical_report.json",
    "phase_39c_sg_candidate_results.json",
    "phase_39c_sg_runtime_results.json",
    "phase_39c_sg_hallucination_safety_report.json",
    "phase_39c_sg_private_artifact_manifest.json",
    "phase_39c_sg_generated_runtime_recovery_report.json",
]
FINAL_REPORT_FILES = {
    "phase_39c_sg_private_artifact_manifest.json",
    "phase_39c_sg_generated_runtime_recovery_report.json",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def expected_assets_from_env() -> List[Tuple[str, int, str]]:
    raw = os.environ.get("REEDITPRO_VLM_EXPECTED_ASSETS_JSON")
    if not raw:
        raise RuntimeError("REEDITPRO_VLM_EXPECTED_ASSETS_JSON is required for SGLang runtime")
    parsed = json.loads(raw)
    assets: List[Tuple[str, int, str]] = []
    for item in parsed:
        relative_path = str(item["relativePath"])
        if relative_path.startswith("/") or ".." in Path(relative_path).parts:
            raise RuntimeError(f"unsafe relativePath: {relative_path}")
        assets.append((relative_path, int(item["sizeBytes"]), str(item["sha256"])))
    if not assets:
        raise RuntimeError("empty expected asset list")
    return assets


EXPECTED_ASSETS = expected_assets_from_env()


def parse_gcs_uri(uri: str) -> Tuple[str, str]:
    if not uri.startswith("gs://"):
        raise ValueError(f"not a private GCS URI: {uri}")
    bucket, _, name = uri[5:].partition("/")
    if not bucket or not name:
        raise ValueError(f"incomplete GCS URI: {uri}")
    return bucket, name


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def aggregate_sha(entries: List[Dict[str, Any]]) -> str:
    lines = []
    for entry in sorted(entries, key=lambda item: item["relativePath"]):
        lines.append(f"{entry['relativePath']} {entry.get('actualSha256')} {entry.get('actualSizeBytes')}")
    return hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest()


def validate_env(blockers: List[str]) -> None:
    required = {
        "GCP_PROJECT_ID": "reeditpro",
        "GCP_REGION": "us-central1",
        "REEDITPRO_ENV": "staging",
        "REEDITPRO_CONFIRM_VLM_SGLANG_BUILD_UNBLOCK": "true",
        "REEDITPRO_CONFIRM_VLM_SGLANG_RUNTIME_EXECUTE": "true",
        "REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ": "true",
        "REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD": "true",
        "REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE": "true",
        "REEDITPRO_VLM_SGLANG_STRATEGY_MATRIX": MATRIX_ID,
        "GENERATED_VLM_FIXTURES_ONLY": "true",
        "HF_HUB_OFFLINE": "1",
        "TRANSFORMERS_OFFLINE": "1",
        "MODEL_DOWNLOADS_ENABLED": "false",
        "RAW_VLM_PROMPT_ENABLED": "false",
        "PROVIDER_EXECUTION_ENABLED": "false",
        "MEDIA_PROCESSING_ENABLED": "false",
        "REAL_MEDIA_INPUT_ENABLED": "false",
        "ARBITRARY_MEDIA_INPUT_ENABLED": "false",
        "PUBLIC_OUTPUT_ENABLED": "false",
        "REEDITPRO_PRODUCTION_READY": "false",
        "REEDITPRO_INTERNAL_BETA_READY": "false",
        "REEDITPRO_EXTERNAL_BETA_READY": "false",
        "REEDITPRO_BROAD_REAL_MEDIA_READY": "false",
        "TRACK_A_EXECUTION_ENABLED": "false",
    }
    for key, expected in required.items():
        if os.environ.get(key) != expected:
            blockers.append(f"env_guard_mismatch:{key}")
    if not MODEL_GCS_PATH.startswith("gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/"):
        blockers.append("phase39c_sg_model_gcs_path_not_approved_private_prefix")
    if os.environ.get("REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD") == "true":
        blockers.append("forbidden_env_enabled:REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD")
    if os.environ.get("REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD") == "true":
        blockers.append("forbidden_env_enabled:REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD")


def download_and_verify_assets(client: storage.Client, model_root: Path, blockers: List[str], warnings: List[str], run_id: str) -> Dict[str, Any]:
    model_root.mkdir(parents=True, exist_ok=True)
    entries: List[Dict[str, Any]] = []
    for relative_path, expected_size, expected_sha in EXPECTED_ASSETS:
        gcs_uri = f"{MODEL_GCS_PATH}{relative_path}"
        local_path = model_root / relative_path
        local_path.parent.mkdir(parents=True, exist_ok=True)
        entry: Dict[str, Any] = {
            "relativePath": relative_path,
            "gcsUri": gcs_uri,
            "localPathStatus": "prepared_in_ephemeral_runtime_temp",
            "expectedSha256": expected_sha,
            "expectedSizeBytes": expected_size,
            "verified": False,
        }
        try:
            bucket_name, object_name = parse_gcs_uri(gcs_uri)
            blob = client.bucket(bucket_name).blob(object_name)
            blob.reload()
            entry["generation"] = str(blob.generation) if blob.generation is not None else None
            entry["crc32c"] = blob.crc32c
            entry["md5Hash"] = blob.md5_hash
            if blob.size != expected_size:
                blockers.append(f"sglang_model_gcs_size_mismatch:{relative_path}")
            blob.download_to_filename(str(local_path))
            actual_size = local_path.stat().st_size
            actual_sha = sha256_file(local_path)
            entry["actualSizeBytes"] = actual_size
            entry["actualSha256"] = actual_sha
            entry["verified"] = actual_size == expected_size and actual_sha == expected_sha
            if actual_size != expected_size:
                blockers.append(f"size_mismatch:{relative_path}")
            if actual_sha != expected_sha:
                blockers.append(f"checksum_mismatch:{relative_path}")
        except Exception as exc:
            blockers.append(f"sglang_model_asset_download_or_verify_failed:{relative_path}:{str(exc)[:240]}")
        entries.append(entry)
    computed = aggregate_sha(entries)
    if computed != AGGREGATE_SHA256:
        blockers.append("sglang_candidate_aggregate_sha256_mismatch")
    status = "verified" if all(entry.get("verified") for entry in entries) and computed == AGGREGATE_SHA256 else "blocked"
    return {
        "phase": PHASE,
        "reportId": "phase_39c_sg_model_asset_verification",
        "runId": run_id,
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "modelGcsPath": MODEL_GCS_PATH,
        "aggregateSha256": AGGREGATE_SHA256,
        "computedAggregateSha256": computed,
        "entries": entries,
        "status": status,
        "blockers": sorted(set(blockers)),
        "warnings": warnings,
    }


def run_worker(run_id: str, report_dir: Path, fixture_dir: Path, model_root: Path, blockers: List[str], warnings: List[str]) -> Dict[str, Any]:
    env = os.environ.copy()
    env.update({
        "HF_HOME": str(report_dir.parent / ".hf-home"),
        "HUGGINGFACE_HUB_CACHE": str(report_dir.parent / ".hf-cache"),
        "TRANSFORMERS_CACHE": str(report_dir.parent / ".transformers-cache"),
        "SGLANG_CACHE_DIR": str(report_dir.parent / ".sglang-cache"),
        "HF_HUB_OFFLINE": "1",
        "TRANSFORMERS_OFFLINE": "1",
        "MODEL_DOWNLOADS_ENABLED": "false",
        "REAL_MEDIA_INPUT_ENABLED": "false",
        "PROVIDER_EXECUTION_ENABLED": "false",
        "RAW_VLM_PROMPT_ENABLED": "false",
        "REEDITPRO_VLM_MODEL_ID": MODEL_ID,
        "REEDITPRO_VLM_MODEL_REVISION": MODEL_REVISION,
        "REEDITPRO_VLM_SGLANG_STRATEGY_MATRIX": MATRIX_ID,
    })
    command = [
        sys.executable,
        str(Path(__file__).with_name("run_sglang_generated_fixture.py")),
        "--run-id",
        run_id,
        "--output-dir",
        str(report_dir),
        "--fixture-dir",
        str(fixture_dir),
        "--model-dir",
        str(model_root),
    ]
    result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=3 * 60 * 60, env=env)
    if result.stderr.strip():
        warnings.append(f"phase39c_sg_worker_stderr:{result.stderr[-3000:]}")
    json_lines = [line.strip() for line in result.stdout.splitlines() if line.strip().startswith("{") and line.strip().endswith("}")]
    if not json_lines:
        blockers.append(f"phase39c_sg_worker_summary_missing:exit={result.returncode}")
        return {
            "runtimeStatus": "blocked",
            "runtimeVersion": None,
            "canaryResults": [],
            "generatedFixtureResults": [],
            "traceRecords": [],
            "labelReports": [],
            "regionReports": [],
            "safeZoneReports": [],
            "qa": {},
            "blockers": blockers,
            "warnings": warnings,
        }
    summary = json.loads(json_lines[-1])
    blockers.extend(summary.get("blockers", []))
    warnings.extend(summary.get("warnings", []))
    return summary


def source_evidence(created_at: str) -> Dict[str, Any]:
    return {
        "phase": PHASE,
        "reportId": "phase_39c_sg_sglang_source_evidence",
        "createdAt": created_at,
        "sourceRepo": "https://github.com/sgl-project/sglang",
        "package": "sglang==0.4.10.post2",
        "status": "passed_for_generated_fixture_evaluation_only",
        "blockedScopes": ["production", "beta", "real_media", "provider_calls"],
    }


def license_evidence(created_at: str) -> Dict[str, Any]:
    return {
        "phase": PHASE,
        "reportId": "phase_39c_sg_sglang_license_evidence",
        "createdAt": created_at,
        "license": "Apache-2.0",
        "evidenceUrl": "https://github.com/sgl-project/sglang/blob/main/LICENSE",
        "status": "passed_for_evaluation_legal_review_required_before_production",
    }


def runtime_support_evidence(created_at: str) -> Dict[str, Any]:
    return {
        "phase": PHASE,
        "reportId": "phase_39c_sg_sglang_runtime_support_evidence",
        "createdAt": created_at,
        "qwenSglangDeploymentEvidenceUrl": "https://www.mintlify.com/QwenLM/Qwen3-VL/deployment/sglang",
        "sglangOpenAiCompatibleApiEvidenceUrl": "https://docs.sglang.ai/docs/start/quick_start/openai_api_completions",
        "localModelPathOnly": True,
        "runtimeAutoDownloadAllowed": False,
        "l4RuntimeRisk": "requires_this_phase_runtime_evidence",
    }


def structured_output_evidence(created_at: str) -> Dict[str, Any]:
    return {
        "phase": PHASE,
        "reportId": "phase_39c_sg_sglang_structured_output_evidence",
        "createdAt": created_at,
        "evidenceUrl": "https://docs.sglang.ai/docs/advanced_features/structured_outputs",
        "modesToProbe": ["json_schema", "regex", "ebnf", "structural_tag"],
        "semanticPerceptionStillRequired": True,
    }


def generated_fixture_manifest(run_id: str, created_at: str) -> Dict[str, Any]:
    return {
        "phase": PHASE,
        "reportId": "phase_39c_sg_generated_fixture_manifest",
        "runId": run_id,
        "createdAt": created_at,
        "generatedOnly": True,
        "fixtures": required_generated_specs(),
    }


def build_reports(
    run_id: str,
    created_at: str,
    report_dir: Path,
    asset_verification: Dict[str, Any],
    runtime_summary: Dict[str, Any],
    blockers: List[str],
    warnings: List[str],
    artifacts: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    qa = runtime_summary.get("qa", {})
    combined_blockers = sorted(set(blockers + asset_verification.get("blockers", []) + runtime_summary.get("blockers", [])))
    combined_warnings = sorted(set(warnings + asset_verification.get("warnings", []) + runtime_summary.get("warnings", [])))
    runtime_passed = runtime_summary.get("runtimeStatus") == "passed" and asset_verification.get("status") == "verified" and not combined_blockers
    private_prefix = f"gs://{os.environ.get('REEDITPRO_PHASE39C_QA_BUCKET', QA_BUCKET)}/{os.environ.get('REEDITPRO_PHASE39C_QA_PREFIX', f'activation/phase39c/generated-vlm-sglang-runtime/{run_id}')}/"
    report_artifacts = [{key: value for key, value in item.items() if key != "_localPath"} for item in artifacts or []]
    plan = {
        "phase": PHASE,
        "reportId": "phase_39c_sg_sglang_runtime_plan",
        "runId": run_id,
        "createdAt": created_at,
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "privateModelPrefix": MODEL_GCS_PATH,
        "runtime": "sglang",
        "matrixId": MATRIX_ID,
        "localModelPathOnly": True,
        "runtimeAutoDownloadAllowed": False,
        "providerCallsAllowed": False,
        "rawPromptsAllowed": False,
        "realMediaAllowed": False,
        "publicOutputAllowed": False,
        "phase39DBlocked": True,
        "phase39EBlocked": True,
        "betaProductionBlocked": True,
        "trackABlocked": True,
    }
    capability = runtime_summary.get("capability", {"status": "not_run"})
    text_smoke = runtime_summary.get("textOnlySmoke", {"status": "not_run"})
    trace_records = runtime_summary.get("traceRecords", [])
    freeform_traces = [item for item in trace_records if item.get("stageId") == "SG2"]
    label_reports = runtime_summary.get("labelReports", [])
    region_reports = runtime_summary.get("regionReports", [])
    safe_zone_reports = runtime_summary.get("safeZoneReports", [])
    canary_results = runtime_summary.get("canaryResults", [])
    generated_results = runtime_summary.get("generatedFixtureResults", [])
    reports: Dict[str, Dict[str, Any]] = {
        "phase_39c_sg_sglang_runtime_plan.json": plan,
        "phase_39c_sg_sglang_source_evidence.json": source_evidence(created_at),
        "phase_39c_sg_sglang_license_evidence.json": license_evidence(created_at),
        "phase_39c_sg_sglang_runtime_support_evidence.json": runtime_support_evidence(created_at),
        "phase_39c_sg_sglang_structured_output_evidence.json": structured_output_evidence(created_at),
        "phase_39c_sg_candidate_manifest.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_candidate_manifest",
            "runId": run_id,
            "createdAt": created_at,
            "modelId": MODEL_ID,
            "revision": MODEL_REVISION,
            "privateModelPrefix": MODEL_GCS_PATH,
        },
        "phase_39c_sg_model_asset_verification.json": asset_verification,
        "phase_39c_sg_runtime_capability_report.json": capability,
        "phase_39c_sg_strategy_matrix_report.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_strategy_matrix_report",
            "runId": run_id,
            "matrixId": MATRIX_ID,
            "stages": ["SG0", "SG1", "SG2", "SG3", "SG4", "SG5", "SG6", "SG7"],
            "passCountingStages": ["SG3", "SG4", "SG5", "SG6"],
            "diagnosticOnlyStages": ["SG0", "SG1", "SG2", "SG7"],
        },
        "phase_39c_sg_text_only_smoke_report.json": text_smoke,
        "phase_39c_sg_freeform_perception_report.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_freeform_perception_report",
            "runId": run_id,
            "status": "diagnostic_only",
            "traceCount": len(freeform_traces),
            "traces": freeform_traces,
            "canPassPhaseAlone": False,
        },
        "phase_39c_sg_labels_only_qa_report.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_labels_only_qa_report",
            "runId": run_id,
            "status": "passed" if qa.get("canariesPassed") and qa.get("canaryLabelRecall", 0) >= 0.8 else "blocked",
            "canaryLabelRecall": qa.get("canaryLabelRecall", 0),
            "fixtureLabelRecall": qa.get("fixtureLabelRecall", 0),
            "fixtures": label_reports,
        },
        "phase_39c_sg_coarse_region_qa_report.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_coarse_region_qa_report",
            "runId": run_id,
            "status": "passed" if qa.get("canariesPassed") and qa.get("canaryCoarseRegionAccuracy", 0) >= 0.8 else "blocked",
            "canaryCoarseRegionAccuracy": qa.get("canaryCoarseRegionAccuracy", 0),
            "fixtureCoarseRegionAccuracy": qa.get("fixtureCoarseRegionAccuracy", 0),
            "fixtures": region_reports,
        },
        "phase_39c_sg_safe_zone_reasoning_report.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_safe_zone_reasoning_report",
            "runId": run_id,
            "status": "passed" if runtime_summary.get("runtimeStatus") == "passed" else "blocked",
            "fixtures": safe_zone_reports,
            "safeZoneDecisionUnknownAllowed": False,
        },
        "phase_39c_sg_decomposed_canonical_report.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_decomposed_canonical_report",
            "runId": run_id,
            "status": runtime_summary.get("runtimeStatus", "blocked"),
            "canaryResults": canary_results,
            "generatedFixtureResults": generated_results,
            "qa": qa,
            "blockers": combined_blockers,
            "warnings": combined_warnings,
        },
        "phase_39c_sg_candidate_results.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_candidate_results",
            "runId": run_id,
            "modelId": MODEL_ID,
            "revision": MODEL_REVISION,
            "status": "passed" if runtime_passed else "blocked",
            "qa": qa,
            "blockers": combined_blockers,
            "warnings": combined_warnings,
        },
        "phase_39c_sg_runtime_results.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_runtime_results",
            "runId": run_id,
            "runtime": "sglang",
            "runtimeStatus": runtime_summary.get("runtimeStatus", "blocked"),
            "runtimeVersion": runtime_summary.get("runtimeVersion"),
            "canaryResults": canary_results,
            "generatedFixtureResults": generated_results,
            "blockers": combined_blockers,
            "warnings": combined_warnings,
        },
        "phase_39c_sg_hallucination_safety_report.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_hallucination_safety_report",
            "runId": run_id,
            "noProviderCalls": True,
            "noToolCalls": True,
            "noRawPrompts": True,
            "noRealMedia": True,
            "noPublicOutput": True,
            "traceRecords": trace_records,
            "blockers": [item for item in combined_blockers if any(token in item.lower() for token in ["provider", "tool", "real_media", "public", "hallucination"])],
            "warnings": combined_warnings,
        },
        "phase_39c_sg_private_artifact_manifest.json": {
            "phase": PHASE,
            "reportId": "phase_39c_sg_private_artifact_manifest",
            "runId": run_id,
            "createdAt": now_iso(),
            "privateOnly": True,
            "privateQaPrefix": private_prefix,
            "artifactCount": len(report_artifacts),
            "artifacts": report_artifacts,
            "blockers": combined_blockers,
            "warnings": combined_warnings,
        },
    }
    full_report = {
        "ok": runtime_passed,
        "phase": PHASE,
        "reportId": "phase_39c_sg_generated_runtime_recovery_report",
        "runId": run_id,
        "createdAt": created_at,
        "sourcePr66": "https://github.com/yuzastudio6-cyber/Reedkt/pull/66",
        "sourcePr87": "https://github.com/yuzastudio6-cyber/Reedkt/pull/87",
        "sourcePr90": "https://github.com/yuzastudio6-cyber/Reedkt/pull/90",
        "sourcePr97": "https://github.com/yuzastudio6-cyber/Reedkt/pull/97",
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "privateModelPrefix": MODEL_GCS_PATH,
        "runtime": "sglang",
        "runtimeStatus": runtime_summary.get("runtimeStatus", "blocked"),
        "runtimeVersion": runtime_summary.get("runtimeVersion"),
        "localModelPathUsed": asset_verification.get("status") == "verified",
        "modelIdRuntimePathBlocked": True,
        "runtimeAutoDownloadBlocked": True,
        "qa": qa,
        "selectedCandidate": {"modelId": MODEL_ID, "revision": MODEL_REVISION} if runtime_passed else None,
        "privateArtifactStatus": "uploaded" if report_artifacts else "pending_upload",
        "privateQaPrefix": private_prefix,
        "blockers": combined_blockers,
        "warnings": combined_warnings,
        "vlmToolFamilyBetaStatus": "phase-complete but tool-family incomplete" if runtime_passed else "blocked",
        "nextPhaseDecision": "Phase 39D remains blocked until a later controlled real-frame prompt." if runtime_passed else "Phase 39D remains blocked; use evidence-based non-Qwen/runtime/GPU/fixture follow-up.",
    }
    reports["phase_39c_sg_generated_runtime_recovery_report.json"] = full_report
    for file_name, report in reports.items():
        (report_dir / file_name).write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    return full_report


def upload_artifacts(client: storage.Client, report_dir: Path, run_id: str, file_names: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    if os.environ.get("REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD") != "true":
        raise RuntimeError("artifact_upload_confirmation_missing")
    bucket_name = os.environ.get("REEDITPRO_PHASE39C_QA_BUCKET", QA_BUCKET)
    prefix = os.environ.get("REEDITPRO_PHASE39C_QA_PREFIX", f"activation/phase39c/generated-vlm-sglang-runtime/{run_id}")
    bucket = client.bucket(bucket_name)
    artifacts: List[Dict[str, Any]] = []
    for file_name in file_names or REPORT_FILES:
        local_path = report_dir / file_name
        if not local_path.exists():
            continue
        object_name = f"{prefix.rstrip('/')}/{file_name}"
        blob = bucket.blob(object_name)
        blob.upload_from_filename(str(local_path), content_type="application/json", if_generation_match=0)
        blob.reload()
        artifacts.append({
            "name": file_name,
            "gcsUri": f"gs://{bucket_name}/{object_name}",
            "sizeBytes": local_path.stat().st_size,
            "generation": str(blob.generation) if blob.generation is not None else None,
            "crc32c": blob.crc32c,
            "md5Hash": blob.md5_hash,
            "_localPath": str(local_path),
        })
    return artifacts


def main() -> int:
    run_id = os.environ.get("REEDITPRO_PHASE39C_RUN_ID", f"phase39c-sg-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}")
    created_at = now_iso()
    local_root = Path(os.environ.get("REEDITPRO_VLM_LOCAL_TEMP_ROOT", "/tmp/reeditpro-vlm-sglang-runtime")) / run_id
    report_dir = local_root / "reports"
    fixture_dir = local_root / "fixtures"
    model_root = local_root / "model" / MODEL_DIR_NAME
    report_dir.mkdir(parents=True, exist_ok=True)
    fixture_dir.mkdir(parents=True, exist_ok=True)

    blockers: List[str] = []
    warnings: List[str] = []
    validate_env(blockers)
    client = storage.Client(project=os.environ.get("GCP_PROJECT_ID", "reeditpro"))
    asset_verification = download_and_verify_assets(client, model_root, blockers, warnings, run_id) if not blockers else {
        "phase": PHASE,
        "reportId": "phase_39c_sg_model_asset_verification",
        "runId": run_id,
        "status": "blocked",
        "blockers": blockers,
        "warnings": warnings,
    }

    runtime_summary = run_worker(run_id, report_dir, fixture_dir, model_root, blockers, warnings) if asset_verification.get("status") == "verified" and not blockers else {
        "runtimeStatus": "blocked",
        "runtimeVersion": None,
        "capability": {},
        "textOnlySmoke": {},
        "canaryResults": [],
        "generatedFixtureResults": [],
        "traceRecords": [],
        "labelReports": [],
        "regionReports": [],
        "safeZoneReports": [],
        "qa": {},
        "blockers": blockers,
        "warnings": warnings,
    }

    (report_dir / "phase_39c_sg_canary_fixture_manifest.json").write_text(json.dumps(canary_manifest(run_id, created_at), indent=2, sort_keys=True) + "\n")
    (report_dir / "phase_39c_sg_generated_fixture_manifest.json").write_text(json.dumps(generated_fixture_manifest(run_id, created_at), indent=2, sort_keys=True) + "\n")
    (report_dir / "phase_39c_sg_label_alias_map.json").write_text(json.dumps(alias_report(), indent=2, sort_keys=True) + "\n")

    build_reports(run_id, created_at, report_dir, asset_verification, runtime_summary, blockers, warnings)
    report_files = [file_name for file_name in REPORT_FILES if file_name not in FINAL_REPORT_FILES]
    artifacts = upload_artifacts(client, report_dir, run_id, report_files)
    full_report = build_reports(run_id, created_at, report_dir, asset_verification, runtime_summary, blockers, warnings, artifacts)
    upload_artifacts(client, report_dir, run_id, sorted(FINAL_REPORT_FILES))
    print(json.dumps(full_report, separators=(",", ":")))
    return 0 if full_report.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
