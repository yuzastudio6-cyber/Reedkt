#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from google.cloud import storage

from perception_alias_map import alias_report
from perception_canary_fixtures import manifest as canary_manifest


PHASE = "39C-Q-SO3"
MATRIX_ID = "phase39c-qwen-so3-perception-canary-v1"
QA_BUCKET = "reeditpro-staging-reeditpro-qa-artifacts"
MODEL_ID = os.environ.get("REEDITPRO_VLM_MODEL_ID", "")
MODEL_REVISION = os.environ.get("REEDITPRO_VLM_MODEL_REVISION", "")
MODEL_GCS_PATH = os.environ.get("REEDITPRO_VLM_MODEL_GCS_PATH", "")
AGGREGATE_SHA256 = os.environ.get("REEDITPRO_VLM_AGGREGATE_SHA256", "")
MODEL_DIR_NAME = os.environ.get("REEDITPRO_VLM_MODEL_DIR_NAME", "qwen3-vl-candidate")
PRIVATE_TRACE_FILE = "phase_39cq_so3_private_raw_output_traces.json"


def load_phase39c_base():
    module_path = Path(__file__).with_name("run-phase39c-cloud-job.py")
    spec = importlib.util.spec_from_file_location("phase39c_cloud_job_base", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("phase39c_cloud_job_base_unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


BASE = load_phase39c_base()
download_and_verify_assets = BASE.download_and_verify_assets
fixture_manifest = BASE.fixture_manifest
sha256_file = BASE.sha256_file


REPORT_FILES = [
    "phase_39cq_so3_perception_canary_plan.json",
    "phase_39cq_so3_perception_failure_audit.json",
    "phase_39cq_so3_canary_fixture_manifest.json",
    "phase_39cq_so3_fixture_calibration_report.json",
    "phase_39cq_so3_label_alias_map.json",
    "phase_39cq_so3_freeform_trace_manifest.json",
    "phase_39cq_so3_labels_only_qa_report.json",
    "phase_39cq_so3_coarse_region_qa_report.json",
    "phase_39cq_so3_safe_zone_reasoning_report.json",
    "phase_39cq_so3_decomposed_canonical_report.json",
    "phase_39cq_so3_candidate_results.json",
    "phase_39cq_so3_runtime_results.json",
    "phase_39cq_so3_hallucination_safety_report.json",
    "phase_39cq_so3_private_artifact_manifest.json",
    "phase_39cq_so3_perception_canary_recovery_report.json",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def validate_env(blockers: List[str]) -> None:
    required = {
        "GCP_PROJECT_ID": "reeditpro",
        "GCP_REGION": "us-central1",
        "REEDITPRO_ENV": "staging",
        "REEDITPRO_CONFIRM_VLM_PERCEPTION_CANARY_RERUN": "true",
        "REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ": "true",
        "REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE": "true",
        "REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD": "true",
        "REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE": "true",
        "REEDITPRO_VLM_PERCEPTION_CANARY_MATRIX": MATRIX_ID,
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
        blockers.append("phase39cq_so3_model_gcs_path_not_approved_private_prefix")
    if os.environ.get("REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD") == "true":
        blockers.append("forbidden_env_enabled:REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD")
    if os.environ.get("REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD") == "true":
        blockers.append("forbidden_env_enabled:REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD")


def run_worker(run_id: str, report_dir: Path, fixture_dir: Path, model_root: Path, generated_fixture_manifest_path: Path, blockers: List[str], warnings: List[str]) -> Dict[str, Any]:
    env = os.environ.copy()
    env.update({
        "HF_HOME": str(report_dir.parent / ".hf-home"),
        "HUGGINGFACE_HUB_CACHE": str(report_dir.parent / ".hf-cache"),
        "TRANSFORMERS_CACHE": str(report_dir.parent / ".transformers-cache"),
        "VLLM_CACHE_ROOT": str(report_dir.parent / ".vllm-cache"),
        "HF_HUB_OFFLINE": "1",
        "TRANSFORMERS_OFFLINE": "1",
        "MODEL_DOWNLOADS_ENABLED": "false",
        "REAL_MEDIA_INPUT_ENABLED": "false",
        "PROVIDER_EXECUTION_ENABLED": "false",
        "RAW_VLM_PROMPT_ENABLED": "false",
        "REEDITPRO_VLM_MODEL_ID": MODEL_ID,
        "REEDITPRO_VLM_MODEL_REVISION": MODEL_REVISION,
        "REEDITPRO_VLM_PERCEPTION_CANARY_MATRIX": MATRIX_ID,
    })
    command = [
        sys.executable,
        str(Path(__file__).with_name("run_perception_canary.py")),
        "--run-id",
        run_id,
        "--output-dir",
        str(report_dir),
        "--fixture-dir",
        str(fixture_dir),
        "--model-dir",
        str(model_root),
        "--generated-fixture-manifest-path",
        str(generated_fixture_manifest_path),
    ]
    result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=3 * 60 * 60, env=env)
    if result.stderr.strip():
        warnings.append(f"phase39cq_so3_worker_stderr:{result.stderr[-3000:]}")
    json_lines = [line.strip() for line in result.stdout.splitlines() if line.strip().startswith("{") and line.strip().endswith("}")]
    if not json_lines:
        blockers.append(f"phase39cq_so3_worker_summary_missing:exit={result.returncode}")
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


def report_safe_artifacts(artifacts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [{key: value for key, value in artifact.items() if key != "_localPath"} for artifact in artifacts]


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
    generated_fixtures = json.loads((report_dir / "phase_39cq_so3_generated_fixture_manifest.json").read_text())
    canary_fixtures = json.loads((report_dir / "phase_39cq_so3_canary_fixture_manifest.json").read_text())
    qa = runtime_summary.get("qa", {})
    combined_blockers = sorted(set(blockers + asset_verification.get("blockers", []) + runtime_summary.get("blockers", [])))
    combined_warnings = sorted(set(warnings + asset_verification.get("warnings", []) + runtime_summary.get("warnings", [])))
    runtime_passed = (
        runtime_summary.get("runtimeStatus") == "passed"
        and asset_verification.get("status") == "verified"
        and not combined_blockers
    )
    report_artifacts = report_safe_artifacts(artifacts or [])
    private_prefix = f"gs://{os.environ.get('REEDITPRO_PHASE39C_QA_BUCKET', QA_BUCKET)}/{os.environ.get('REEDITPRO_PHASE39C_QA_PREFIX', f'activation/phase39c/generated-vlm-perception-canary/{run_id}')}/"
    plan = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_perception_canary_plan",
        "runId": run_id,
        "createdAt": created_at,
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "privateModelPrefix": MODEL_GCS_PATH,
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
    perception_audit = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_perception_failure_audit",
        "runId": run_id,
        "summary": "SO3 separates memory, syntax, and semantic perception failures. This run tests simple generated perception before full generated-fixture QA.",
        "sourcePr66": "https://github.com/yuzastudio6-cyber/Reedkt/pull/66",
        "sourcePr87": "https://github.com/yuzastudio6-cyber/Reedkt/pull/87",
        "sourcePr90": "https://github.com/yuzastudio6-cyber/Reedkt/pull/90",
    }
    fixture_calibration = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_fixture_calibration_report",
        "runId": run_id,
        "canaryThresholds": {"labelRecall": 0.8, "coarseRegionAccuracy": 0.8},
        "generatedFixtureThresholds": {"labelRecall": 0.6, "coarseRegionAccuracy": 0.6},
        "safeZoneDecisionUnknownAllowed": False,
        "ambiguousFixtureMustRequireManualReview": True,
    }
    trace_manifest = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_freeform_trace_manifest",
        "runId": run_id,
        "traceCount": len(runtime_summary.get("traceRecords", [])),
        "traces": runtime_summary.get("traceRecords", []),
        "fullRawTracePrivateArtifact": PRIVATE_TRACE_FILE if runtime_summary.get("traceRecords") else None,
        "fullRawTraceCommitted": False,
    }
    labels_report = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_labels_only_qa_report",
        "runId": run_id,
        "results": runtime_summary.get("labelReports", []),
        "canaryLabelRecall": qa.get("canaryLabelRecall", 0),
        "fixtureLabelRecall": qa.get("fixtureLabelRecall", 0),
        "blockers": [blocker for item in runtime_summary.get("canaryResults", []) + runtime_summary.get("generatedFixtureResults", []) for blocker in item.get("blockers", []) if "label" in blocker],
    }
    region_report = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_coarse_region_qa_report",
        "runId": run_id,
        "results": runtime_summary.get("regionReports", []),
        "canaryCoarseRegionAccuracy": qa.get("canaryCoarseRegionAccuracy", 0),
        "fixtureCoarseRegionAccuracy": qa.get("fixtureCoarseRegionAccuracy", 0),
        "blockers": [blocker for item in runtime_summary.get("canaryResults", []) + runtime_summary.get("generatedFixtureResults", []) for blocker in item.get("blockers", []) if "region" in blocker],
    }
    safe_zone_report = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_safe_zone_reasoning_report",
        "runId": run_id,
        "results": runtime_summary.get("safeZoneReports", []),
        "blockers": [blocker for item in runtime_summary.get("canaryResults", []) + runtime_summary.get("generatedFixtureResults", []) for blocker in item.get("blockers", []) if "safe_zone" in blocker or "manual_review" in blocker],
    }
    candidate_results = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_candidate_results",
        "runId": run_id,
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "status": "passed" if runtime_passed else "blocked",
        "qa": qa,
        "blockers": combined_blockers,
        "warnings": combined_warnings,
    }
    runtime_results = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_runtime_results",
        "runId": run_id,
        "runtimeStatus": runtime_summary.get("runtimeStatus", "blocked"),
        "runtimeVersion": runtime_summary.get("runtimeVersion"),
        "profile": runtime_summary.get("profile"),
        "qa": qa,
        "canaryResults": runtime_summary.get("canaryResults", []),
        "generatedFixtureResults": runtime_summary.get("generatedFixtureResults", []),
        "blockers": combined_blockers,
        "warnings": combined_warnings,
    }
    hallucination_report = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_hallucination_safety_report",
        "runId": run_id,
        "noProviderCalls": True,
        "noToolCalls": True,
        "noRawPrompts": True,
        "noRealMedia": True,
        "noPublicOutput": True,
        "blockers": [blocker for blocker in combined_blockers if any(token in blocker.lower() for token in ["provider", "tool", "raw_prompt", "real_media", "public"])],
        "warnings": combined_warnings,
    }
    private_manifest = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_private_artifact_manifest",
        "runId": run_id,
        "createdAt": now_iso(),
        "privateOnly": True,
        "bucket": os.environ.get("REEDITPRO_PHASE39C_QA_BUCKET", QA_BUCKET),
        "prefix": os.environ.get("REEDITPRO_PHASE39C_QA_PREFIX", f"activation/phase39c/generated-vlm-perception-canary/{run_id}"),
        "artifactCount": len(report_artifacts),
        "artifacts": report_artifacts,
        "rawTracePolicy": "Full raw generated-fixture traces are private only; committed reports keep hashes and short safe excerpts.",
        "blockers": combined_blockers,
        "warnings": combined_warnings,
    }
    decomposed = {
        "phase": PHASE,
        "reportId": "phase_39cq_so3_decomposed_canonical_report",
        "runId": run_id,
        "status": "passed" if runtime_passed else "blocked",
        "canaryResults": runtime_summary.get("canaryResults", []),
        "generatedFixtureResults": runtime_summary.get("generatedFixtureResults", []),
        "qa": qa,
        "blockers": combined_blockers,
        "warnings": combined_warnings,
    }
    full_report = {
        "ok": runtime_passed,
        "phase": PHASE,
        "reportId": "phase_39cq_so3_perception_canary_recovery_report",
        "runId": run_id,
        "createdAt": created_at,
        "sourcePhase39C": {"pr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/66", "status": "preserved_original_bf16_8b_l4_oom_evidence"},
        "sourcePhase39BQ39CQ": {"pr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/87", "status": "preserved_official_candidate_staging_runtime_evidence"},
        "sourcePhase39CQSO": {"pr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/90", "status": "preserved_structured_output_failure_evidence"},
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "privateModelPrefix": MODEL_GCS_PATH,
        "assetVerification": asset_verification,
        "qa": qa,
        "canaryResults": runtime_summary.get("canaryResults", []),
        "generatedFixtureResults": runtime_summary.get("generatedFixtureResults", []),
        "privateArtifactPrefix": private_prefix,
        "artifacts": report_artifacts,
        "vlmToolFamilyBetaStatus": "phase-complete but tool-family incomplete" if runtime_passed else "blocked",
        "phase39DReadiness": {
            "readyForControlledRealFrameVlm": runtime_passed,
            "reason": "Phase 39D remains blocked until a later bounded private controlled sample prompt.",
        },
        "blockers": combined_blockers,
        "warnings": combined_warnings,
    }
    return {
        "phase_39cq_so3_perception_canary_plan.json": plan,
        "phase_39cq_so3_perception_failure_audit.json": perception_audit,
        "phase_39cq_so3_canary_fixture_manifest.json": canary_fixtures,
        "phase_39cq_so3_fixture_calibration_report.json": fixture_calibration,
        "phase_39cq_so3_label_alias_map.json": alias_report(),
        "phase_39cq_so3_freeform_trace_manifest.json": trace_manifest,
        "phase_39cq_so3_labels_only_qa_report.json": labels_report,
        "phase_39cq_so3_coarse_region_qa_report.json": region_report,
        "phase_39cq_so3_safe_zone_reasoning_report.json": safe_zone_report,
        "phase_39cq_so3_decomposed_canonical_report.json": decomposed,
        "phase_39cq_so3_candidate_results.json": candidate_results,
        "phase_39cq_so3_runtime_results.json": runtime_results,
        "phase_39cq_so3_hallucination_safety_report.json": hallucination_report,
        "phase_39cq_so3_private_artifact_manifest.json": private_manifest,
        "phase_39cq_so3_perception_canary_recovery_report.json": full_report,
        "phase_39cq_so3_generated_fixture_manifest.json": generated_fixtures,
    }


def write_reports(report_dir: Path, reports: Dict[str, Any]) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)
    for file_name, value in reports.items():
        (report_dir / file_name).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def collect_artifacts(report_dir: Path, bucket: str, prefix: str) -> List[Dict[str, Any]]:
    artifacts: List[Dict[str, Any]] = []
    for file_name in REPORT_FILES + [PRIVATE_TRACE_FILE]:
        local_path = report_dir / file_name
        if not local_path.exists():
            continue
        object_name = f"{prefix}/{file_name}"
        artifacts.append({
            "id": file_name.replace(".", "_"),
            "kind": "private_trace" if file_name == PRIVATE_TRACE_FILE else "report",
            "_localPath": str(local_path),
            "localPathStatus": "ephemeral_runtime_temp",
            "bucket": bucket,
            "object": object_name,
            "gcsUri": f"gs://{bucket}/{object_name}",
            "sizeBytes": local_path.stat().st_size,
            "sha256": sha256_file(local_path),
            "committedToGit": False if file_name == PRIVATE_TRACE_FILE else None,
        })
    return artifacts


def upload_artifacts(client: storage.Client, report_dir: Path, bucket_name: str, prefix: str, blockers: List[str]) -> List[Dict[str, Any]]:
    bucket = client.bucket(bucket_name)
    uploaded: List[Dict[str, Any]] = []
    for artifact in collect_artifacts(report_dir, bucket_name, prefix):
        try:
            blob = bucket.blob(artifact["object"])
            blob.upload_from_filename(
                artifact["_localPath"],
                content_type="application/json",
                if_generation_match=0,
            )
            safe_artifact = {key: value for key, value in artifact.items() if key != "_localPath"}
            uploaded.append({
                **safe_artifact,
                "generation": str(blob.generation) if blob.generation is not None else None,
                "metageneration": str(blob.metageneration) if blob.metageneration is not None else None,
            })
        except Exception as exc:
            blockers.append(f"phase39cq_so3_private_artifact_upload_failed:{artifact['id']}:{str(exc)[:240]}")
    return uploaded


def main() -> int:
    run_id = os.environ.get("REEDITPRO_PHASE39C_RUN_ID", "")
    if not run_id.startswith("phase39cq-so3-"):
        print("REEDITPRO_PHASE39C_RUN_ID must start with phase39cq-so3-", file=sys.stderr)
        return 2
    created_at = now_iso()
    bucket_name = os.environ.get("REEDITPRO_PHASE39C_QA_BUCKET", QA_BUCKET)
    prefix = os.environ.get("REEDITPRO_PHASE39C_QA_PREFIX", f"activation/phase39c/generated-vlm-perception-canary/{run_id}")
    run_root = Path(os.environ.get("REEDITPRO_VLM_LOCAL_TEMP_ROOT", "/tmp/reeditpro-vlm-runtime/phase39cq-so3")) / run_id
    report_dir = run_root / "reports"
    fixture_dir = run_root / "fixtures"
    model_root = run_root / "models" / MODEL_DIR_NAME
    report_dir.mkdir(parents=True, exist_ok=True)
    blockers: List[str] = []
    warnings: List[str] = ["phase39cq_so3_staging_l4_cloud_run_job_path_used"]
    validate_env(blockers)
    generated_fixtures = fixture_manifest(run_id, created_at)
    (report_dir / "phase_39cq_so3_generated_fixture_manifest.json").write_text(json.dumps(generated_fixtures, indent=2) + "\n", encoding="utf-8")
    (report_dir / "phase_39cq_so3_canary_fixture_manifest.json").write_text(json.dumps(canary_manifest(run_id, created_at), indent=2) + "\n", encoding="utf-8")
    client = storage.Client(project="reeditpro")
    asset_verification = {
        "phase": PHASE,
        "runId": run_id,
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "modelGcsPath": MODEL_GCS_PATH,
        "aggregateSha256": AGGREGATE_SHA256,
        "entries": [],
        "status": "blocked",
        "blockers": ["phase39cq_so3_asset_verification_not_started"],
        "warnings": warnings,
    }
    runtime_summary: Dict[str, Any] = {
        "runtimeStatus": "blocked",
        "runtimeVersion": None,
        "canaryResults": [],
        "generatedFixtureResults": [],
        "traceRecords": [],
        "labelReports": [],
        "regionReports": [],
        "safeZoneReports": [],
        "qa": {},
        "blockers": [],
    }
    try:
        if not blockers:
            asset_verification = download_and_verify_assets(client, model_root, blockers, warnings)
        if asset_verification.get("status") == "verified" and not blockers:
            runtime_summary = run_worker(run_id, report_dir, fixture_dir, model_root, report_dir / "phase_39cq_so3_generated_fixture_manifest.json", blockers, warnings)
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        blockers.append(f"phase39cq_so3_cloud_job_unhandled_error:{str(exc)[:240]}")
    (report_dir / PRIVATE_TRACE_FILE).write_text(json.dumps({
        "phase": PHASE,
        "runId": run_id,
        "privateOnly": True,
        "records": runtime_summary.get("traceRecords", []),
    }, indent=2) + "\n", encoding="utf-8")
    reports = build_reports(run_id, created_at, report_dir, asset_verification, runtime_summary, blockers, warnings)
    write_reports(report_dir, reports)
    planned = collect_artifacts(report_dir, bucket_name, prefix)
    reports = build_reports(run_id, created_at, report_dir, asset_verification, runtime_summary, blockers, warnings, planned)
    write_reports(report_dir, reports)
    uploaded = upload_artifacts(client, report_dir, bucket_name, prefix, blockers)
    print(json.dumps({
        "phase": PHASE,
        "runId": run_id,
        "ok": reports["phase_39cq_so3_perception_canary_recovery_report.json"]["ok"],
        "runtimeStatus": runtime_summary.get("runtimeStatus"),
        "uploadedArtifacts": len(uploaded),
        "blockers": sorted(set(blockers)),
        "warnings": sorted(set(warnings)),
    }, separators=(",", ":")))
    return 0 if not blockers else 1


if __name__ == "__main__":
    raise SystemExit(main())
