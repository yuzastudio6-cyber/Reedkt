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

from structured_output_compat_harness import MATRIX_ID, COMPACT_SCHEMA_VERSION, compact_vlm_schema, schemas


PHASE = "39C-Q-SO2"
QA_BUCKET = "reeditpro-staging-reeditpro-qa-artifacts"
MODEL_ID = os.environ.get("REEDITPRO_VLM_MODEL_ID", "")
MODEL_REVISION = os.environ.get("REEDITPRO_VLM_MODEL_REVISION", "")
MODEL_GCS_PATH = os.environ.get("REEDITPRO_VLM_MODEL_GCS_PATH", "")
AGGREGATE_SHA256 = os.environ.get("REEDITPRO_VLM_AGGREGATE_SHA256", "")
MODEL_DIR_NAME = os.environ.get("REEDITPRO_VLM_MODEL_DIR_NAME", "qwen3-vl-candidate")


REPORT_FILES = [
    "phase_39cq_so2_vllm_structured_output_compat_plan.json",
    "phase_39cq_so2_vllm_structured_output_capability_report.json",
    "phase_39cq_so2_failure_taxonomy_update.json",
    "phase_39cq_so2_text_only_structured_output_harness.json",
    "phase_39cq_so2_text_only_trace_manifest.json",
    "phase_39cq_so2_openai_loopback_strategy_report.json",
    "phase_39cq_so2_offline_structured_outputs_report.json",
    "phase_39cq_so2_candidate_strategy_matrix.json",
    "phase_39cq_so2_selected_candidate_report.json",
    "phase_39cq_so2_generated_fixture_manifest.json",
    "phase_39cq_so2_runtime_results.json",
    "phase_39cq_so2_output_schema_validation_report.json",
    "phase_39cq_so2_object_region_qa_report.json",
    "phase_39cq_so2_safe_zone_qa_report.json",
    "phase_39cq_so2_hallucination_safety_report.json",
    "phase_39cq_so2_private_artifact_manifest.json",
    "phase_39cq_so2_structured_output_compat_recovery_report.json",
]
PRIVATE_TRACE_FILE = "phase_39cq_so2_private_raw_output_traces.json"


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


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def prompt_manifest(run_id: str, created_at: str, fixtures: Dict[str, Any]) -> Dict[str, Any]:
    system_instruction = " ".join([
        "You are a bounded ReeditPro Phase 39C-Q-SO2 vLLM structured-output compatibility worker.",
        "Use only local verified model assets and generated synthetic fixtures.",
        "Return direct JSON only for pass-counting strategies. No markdown, tools, providers, URLs, real-media claims, or public output.",
        "Use no-thinking behavior when supported; never reveal reasoning.",
    ])
    templates = []
    for fixture in fixtures["specs"]:
        templates.append({
            "promptTemplateId": f"phase39cq_so2_{fixture['fixtureId'].replace('-', '_')}_compact_json_v1",
            "fixtureId": fixture["fixtureId"],
            "schemaId": COMPACT_SCHEMA_VERSION,
            "systemInstruction": system_instruction,
            "userInstruction": " ".join([
                fixture["safeZoneQuestion"],
                "Describe visible generated objects, text-like regions, safe-zone suggestions, and uncertainty using the compact SO2 schema.",
            ]),
            "rawPromptAllowed": False,
            "providerCallAllowed": False,
            "toolCallAllowed": False,
            "outputFormat": "compact_json_schema_only",
        })
    return {
        "phase": PHASE,
        "runId": run_id,
        "createdAt": created_at,
        "schemaId": COMPACT_SCHEMA_VERSION,
        "rawPromptAllowed": False,
        "providerCallsAllowed": False,
        "toolCallsAllowed": False,
        "templates": templates,
    }


def validate_env(blockers: List[str]) -> None:
    required = {
        "GCP_PROJECT_ID": "reeditpro",
        "GCP_REGION": "us-central1",
        "REEDITPRO_ENV": "staging",
        "REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_COMPAT_DEBUG": "true",
        "REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ": "true",
        "REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE": "true",
        "REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD": "true",
        "REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE": "true",
        "REEDITPRO_VLM_STRUCTURED_OUTPUT_COMPAT_MATRIX": MATRIX_ID,
        "GENERATED_VLM_FIXTURES_ONLY": "true",
        "HF_HUB_OFFLINE": "1",
        "TRANSFORMERS_OFFLINE": "1",
        "MODEL_DOWNLOADS_ENABLED": "false",
        "RAW_VLM_PROMPT_ENABLED": "false",
        "PROVIDER_EXECUTION_ENABLED": "false",
        "EXTERNAL_API_CALLS_ENABLED": "false",
        "LOCAL_OPENAI_LOOPBACK_ONLY": "true",
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
        blockers.append("phase39cq_so2_model_gcs_path_not_approved_private_prefix")
    for key in ["REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD", "REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD", "REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_RERUN"]:
        if os.environ.get(key) == "true":
            blockers.append(f"forbidden_env_enabled:{key}")


def run_worker(run_id: str, report_dir: Path, fixture_dir: Path, model_root: Path, blockers: List[str], warnings: List[str]) -> Dict[str, Any]:
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
        "EXTERNAL_API_CALLS_ENABLED": "false",
        "LOCAL_OPENAI_LOOPBACK_ONLY": "true",
        "RAW_VLM_PROMPT_ENABLED": "false",
        "REEDITPRO_VLM_MODEL_ID": MODEL_ID,
        "REEDITPRO_VLM_MODEL_REVISION": MODEL_REVISION,
        "REEDITPRO_VLM_STRUCTURED_OUTPUT_COMPAT_MATRIX": MATRIX_ID,
    })
    command = [
        sys.executable,
        str(Path(__file__).with_name("run_structured_output_compat.py")),
        "--run-id",
        run_id,
        "--output-dir",
        str(report_dir),
        "--fixture-dir",
        str(fixture_dir),
        "--model-dir",
        str(model_root),
        "--fixture-manifest-path",
        str(report_dir / "phase_39cq_so2_generated_fixture_manifest.json"),
        "--prompt-manifest-path",
        str(report_dir / "phase_39cq_so2_prompt_template_manifest.json"),
    ]
    result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=3 * 60 * 60, env=env)
    if result.stderr.strip():
        warnings.append(f"phase39cq_so2_worker_stderr:{result.stderr[-3000:]}")
    json_lines = [line.strip() for line in result.stdout.splitlines() if line.strip().startswith("{") and line.strip().endswith("}")]
    if not json_lines:
        blockers.append(f"phase39cq_so2_worker_summary_missing:exit={result.returncode}")
        return {"runtimeStatus": "blocked", "runtimeVersion": None, "fixtureResults": [], "strategyResults": [], "traceRecords": [], "blockers": blockers, "warnings": warnings}
    summary = json.loads(json_lines[-1])
    blockers.extend(summary.get("blockers", []))
    warnings.extend(summary.get("warnings", []))
    return summary


def average(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def report_safe_artifacts(artifacts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [{key: value for key, value in artifact.items() if key != "_localPath"} for artifact in artifacts]


def build_failure_taxonomy(runtime_summary: Dict[str, Any]) -> Dict[str, Any]:
    runtime_blockers = sorted(set(runtime_summary.get("blockers", [])))
    return {
        "phase": PHASE,
        "reportId": "phase_39cq_so2_failure_taxonomy_update",
        "sourcePr90": "https://github.com/yuzastudio6-cyber/Reedkt/pull/90",
        "priorCategories": [
            "direct_json_object_required",
            "output_json_parse_failed",
            "fixture_id_mismatch",
            "candidate_id_mismatch",
            "safe_zone_unknown",
            "object_region_qa_failed",
            "structured_output_strategy_matrix_exhausted",
        ],
        "currentRuntimeCategories": runtime_blockers,
        "fullRawOutputCommitted": False,
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
    fixtures = json.loads((report_dir / "phase_39cq_so2_generated_fixture_manifest.json").read_text())
    prompts = json.loads((report_dir / "phase_39cq_so2_prompt_template_manifest.json").read_text())
    fixture_results = runtime_summary.get("fixtureResults", [])
    trace_records = runtime_summary.get("traceRecords", [])
    schema_validity = sum(1 for item in fixture_results if item.get("schemaValid")) / len(fixture_results) if fixture_results else 0
    average_recall = average([float(item.get("requiredLabelRecall", 0)) for item in fixture_results])
    average_region = average([float(item.get("broadRegionAccuracy", 0)) for item in fixture_results])
    combined_blockers = sorted(set(blockers + asset_verification.get("blockers", []) + runtime_summary.get("blockers", [])))
    combined_warnings = sorted(set(warnings + asset_verification.get("warnings", []) + runtime_summary.get("warnings", [])))
    runtime_passed = (
        runtime_summary.get("runtimeStatus") == "passed"
        and asset_verification.get("status") == "verified"
        and len(fixture_results) == 5
        and schema_validity >= 1
        and average_recall >= 0.7
        and average_region >= 0.7
        and not combined_blockers
    )
    report_artifacts = report_safe_artifacts(artifacts or [])
    capability = runtime_summary.get("openAiLoopback", {}).get("server", {}) if isinstance(runtime_summary.get("openAiLoopback"), dict) else {}
    plan = {
        "phase": PHASE,
        "reportId": "phase_39cq_so2_vllm_structured_output_compat_plan",
        "runId": run_id,
        "createdAt": created_at,
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "privateModelPrefix": MODEL_GCS_PATH,
        "matrixId": MATRIX_ID,
        "localModelPathOnly": True,
        "runtimeAutoDownloadAllowed": False,
        "providerCallsAllowed": False,
        "externalApiCallsAllowed": False,
        "localOpenAiLoopbackOnly": True,
        "rawPromptsAllowed": False,
        "realMediaAllowed": False,
        "publicOutputAllowed": False,
        "phase39DBlocked": True,
        "phase39EBlocked": True,
        "betaProductionBlocked": True,
        "trackABlocked": True,
    }
    runtime_results = {
        "phase": PHASE,
        "runId": run_id,
        "runtimeStatus": runtime_summary.get("runtimeStatus", "blocked"),
        "runtimeVersion": runtime_summary.get("runtimeVersion"),
        "selectedStrategyId": runtime_summary.get("selectedStrategyId"),
        "fixtureResults": fixture_results,
        "strategyResults": runtime_summary.get("strategyResults", []),
        "textOnlyHarness": runtime_summary.get("textOnlyHarness", {}),
        "blockers": combined_blockers,
        "warnings": combined_warnings,
    }
    schema_report = {
        "phase": PHASE,
        "runId": run_id,
        "schemaId": COMPACT_SCHEMA_VERSION,
        "requiredSchemaValidity": 1,
        "schemaValidity": schema_validity,
        "fixtureResults": [{"fixtureId": item.get("fixtureId"), "parsedJson": item.get("parsedJson"), "schemaValid": item.get("schemaValid"), "blockers": item.get("blockers", [])} for item in fixture_results],
        "blockers": [f"schema_invalid:{item.get('fixtureId')}" for item in fixture_results if not item.get("schemaValid")],
        "warnings": [],
    }
    object_report = {
        "phase": PHASE,
        "runId": run_id,
        "requiredLabelRecallThreshold": 0.7,
        "requiredBroadRegionAccuracyThreshold": 0.7,
        "fixtureResults": [{"fixtureId": item.get("fixtureId"), "requiredLabelRecall": item.get("requiredLabelRecall"), "broadRegionAccuracy": item.get("broadRegionAccuracy"), "objectCount": item.get("objectCount"), "status": item.get("status")} for item in fixture_results],
        "blockers": [f"object_region_qa_failed:{item.get('fixtureId')}" for item in fixture_results if float(item.get("requiredLabelRecall", 0)) < 0.7 or float(item.get("broadRegionAccuracy", 0)) < 0.7],
        "warnings": [],
    }
    safe_zone_report = {
        "phase": PHASE,
        "runId": run_id,
        "fixtureResults": [{"fixtureId": item.get("fixtureId"), "safeZoneDecision": item.get("safeZoneDecision"), "textLikeRegionCount": item.get("textLikeRegionCount"), "status": item.get("status")} for item in fixture_results],
        "blockers": [f"safe_zone_unknown:{item.get('fixtureId')}" for item in fixture_results if item.get("safeZoneDecision") == "unknown"],
        "warnings": [f"manual_review_zone:{item.get('fixtureId')}" for item in fixture_results if item.get("safeZoneDecision") == "warn"],
    }
    hallucination_report = {
        "phase": PHASE,
        "runId": run_id,
        "noProviderCalls": True,
        "noToolCalls": True,
        "noRawPrompts": True,
        "noRealMedia": True,
        "noPublicOutput": True,
        "fixtureResults": [{"fixtureId": item.get("fixtureId"), "uncertainty": item.get("uncertainty"), "blockers": item.get("blockers", []), "warnings": item.get("warnings", [])} for item in fixture_results],
        "blockers": [blocker for item in fixture_results for blocker in item.get("blockers", []) if any(token in blocker.lower() for token in ["hallucination", "provider", "tool", "raw_prompt", "real_media", "public"])],
        "warnings": [warning for item in fixture_results for warning in item.get("warnings", [])],
    }
    private_manifest = {
        "phase": PHASE,
        "runId": run_id,
        "createdAt": now_iso(),
        "privateOnly": True,
        "bucket": os.environ.get("REEDITPRO_PHASE39C_QA_BUCKET", QA_BUCKET),
        "prefix": os.environ.get("REEDITPRO_PHASE39C_QA_PREFIX", f"activation/phase39c/generated-vlm-structured-output-compat/{run_id}"),
        "artifactCount": len(report_artifacts),
        "artifacts": report_artifacts,
        "rawTracePolicy": "full raw traces remain private only; committed reports keep hashes and short safe excerpts.",
        "blockers": combined_blockers,
        "warnings": combined_warnings,
    }
    selected_candidate_report = {
        "phase": PHASE,
        "runId": run_id,
        "selected": runtime_passed,
        "modelId": MODEL_ID if runtime_passed else None,
        "revision": MODEL_REVISION if runtime_passed else None,
        "selectedStrategyId": runtime_summary.get("selectedStrategyId"),
        "vlmToolFamilyBetaStatus": "phase-complete but tool-family incomplete" if runtime_passed else "blocked",
    }
    full_report = {
        "ok": runtime_passed,
        "phase": PHASE,
        "runId": run_id,
        "createdAt": created_at,
        "sourcePr66": {"pr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/66", "status": "preserved_original_bf16_8b_l4_oom_evidence"},
        "sourcePr87": {"pr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/87", "status": "preserved_official_candidate_staging_runtime_evidence"},
        "sourcePr90": {"pr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/90", "status": "preserved_structured_output_enforcement_failure_evidence"},
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "privateModelPrefix": MODEL_GCS_PATH,
        "assetVerification": asset_verification,
        "capabilityIntrospection": runtime_summary.get("capability", capability),
        "textOnlyHarness": runtime_summary.get("textOnlyHarness", {}),
        "openAiLoopback": runtime_summary.get("openAiLoopback", {}),
        "offlineStructuredOutputs": runtime_summary.get("offlineStructuredOutputs", {}),
        "imageFixtureEscalation": runtime_summary.get("imageFixtureEscalation", {}),
        "fixtureResults": fixture_results,
        "qa": {
            "status": "passed" if runtime_passed else "blocked",
            "schemaValidity": schema_validity,
            "averageRequiredLabelRecall": average_recall,
            "averageBroadRegionAccuracy": average_region,
            "blockers": combined_blockers,
            "warnings": combined_warnings,
        },
        "privateArtifactPrefix": f"gs://{os.environ.get('REEDITPRO_PHASE39C_QA_BUCKET', QA_BUCKET)}/{os.environ.get('REEDITPRO_PHASE39C_QA_PREFIX', f'activation/phase39c/generated-vlm-structured-output-compat/{run_id}')}/",
        "artifacts": report_artifacts,
        "vlmToolFamilyBetaStatus": "phase-complete but tool-family incomplete" if runtime_passed else "blocked",
        "phase39DReadiness": {"readyForControlledRealFrameVlm": runtime_passed, "reason": "Phase 39D remains blocked until a later bounded private controlled sample prompt."},
        "blockers": combined_blockers,
        "warnings": combined_warnings,
    }
    trace_manifest = {
        "phase": PHASE,
        "runId": run_id,
        "traceCount": len(trace_records),
        "traces": trace_records,
        "fullRawTracePrivateArtifact": PRIVATE_TRACE_FILE if trace_records else None,
        "fullRawTraceCommitted": False,
    }
    return {
        "phase_39cq_so2_vllm_structured_output_compat_plan.json": plan,
        "phase_39cq_so2_vllm_structured_output_capability_report.json": runtime_summary.get("capability", {}),
        "phase_39cq_so2_failure_taxonomy_update.json": build_failure_taxonomy(runtime_summary),
        "phase_39cq_so2_text_only_structured_output_harness.json": runtime_summary.get("textOnlyHarness", {}),
        "phase_39cq_so2_text_only_trace_manifest.json": trace_manifest,
        "phase_39cq_so2_openai_loopback_strategy_report.json": runtime_summary.get("openAiLoopback", {}),
        "phase_39cq_so2_offline_structured_outputs_report.json": runtime_summary.get("offlineStructuredOutputs", {}),
        "phase_39cq_so2_candidate_strategy_matrix.json": {"phase": PHASE, "runId": run_id, "matrixId": MATRIX_ID, "strategyResults": runtime_summary.get("strategyResults", [])},
        "phase_39cq_so2_selected_candidate_report.json": selected_candidate_report,
        "phase_39cq_so2_generated_fixture_manifest.json": fixtures,
        "phase_39cq_so2_runtime_results.json": runtime_results,
        "phase_39cq_so2_output_schema_validation_report.json": schema_report,
        "phase_39cq_so2_object_region_qa_report.json": object_report,
        "phase_39cq_so2_safe_zone_qa_report.json": safe_zone_report,
        "phase_39cq_so2_hallucination_safety_report.json": hallucination_report,
        "phase_39cq_so2_private_artifact_manifest.json": private_manifest,
        "phase_39cq_so2_structured_output_compat_recovery_report.json": full_report,
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
            blob.upload_from_filename(artifact["_localPath"], content_type="application/json", if_generation_match=0)
            safe_artifact = {key: value for key, value in artifact.items() if key != "_localPath"}
            uploaded.append({
                **safe_artifact,
                "generation": str(blob.generation) if blob.generation is not None else None,
                "metageneration": str(blob.metageneration) if blob.metageneration is not None else None,
            })
        except Exception as exc:
            blockers.append(f"phase39cq_so2_private_artifact_upload_failed:{artifact['id']}:{str(exc)[:240]}")
    return uploaded


def main() -> int:
    run_id = os.environ.get("REEDITPRO_PHASE39C_RUN_ID", "")
    if not run_id.startswith("phase39cq-so2-"):
        print("REEDITPRO_PHASE39C_RUN_ID must start with phase39cq-so2-", file=sys.stderr)
        return 2
    created_at = now_iso()
    bucket_name = os.environ.get("REEDITPRO_PHASE39C_QA_BUCKET", QA_BUCKET)
    prefix = os.environ.get("REEDITPRO_PHASE39C_QA_PREFIX", f"activation/phase39c/generated-vlm-structured-output-compat/{run_id}")
    run_root = Path(os.environ.get("REEDITPRO_VLM_LOCAL_TEMP_ROOT", "/tmp/reeditpro-vlm-runtime/phase39cq-so2")) / run_id
    report_dir = run_root / "reports"
    fixture_dir = run_root / "fixtures"
    model_root = run_root / "models" / MODEL_DIR_NAME
    report_dir.mkdir(parents=True, exist_ok=True)
    blockers: List[str] = []
    warnings: List[str] = ["phase39cq_so2_staging_l4_cloud_run_job_path_used"]
    validate_env(blockers)
    fixtures = fixture_manifest(run_id, created_at)
    prompts = prompt_manifest(run_id, created_at, fixtures)
    (report_dir / "phase_39cq_so2_generated_fixture_manifest.json").write_text(json.dumps(fixtures, indent=2) + "\n", encoding="utf-8")
    (report_dir / "phase_39cq_so2_prompt_template_manifest.json").write_text(json.dumps(prompts, indent=2) + "\n", encoding="utf-8")
    client = storage.Client(project="reeditpro")
    asset_verification = {"phase": PHASE, "runId": run_id, "modelId": MODEL_ID, "revision": MODEL_REVISION, "modelGcsPath": MODEL_GCS_PATH, "aggregateSha256": AGGREGATE_SHA256, "entries": [], "status": "blocked", "blockers": ["phase39cq_so2_asset_verification_not_started"], "warnings": warnings}
    runtime_summary: Dict[str, Any] = {"runtimeStatus": "blocked", "runtimeVersion": None, "fixtureResults": [], "strategyResults": [], "traceRecords": [], "blockers": []}
    try:
        if not blockers:
            asset_verification = download_and_verify_assets(client, model_root, blockers, warnings)
        if asset_verification.get("status") == "verified" and not blockers:
            runtime_summary = run_worker(run_id, report_dir, fixture_dir, model_root, blockers, warnings)
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        blockers.append(f"phase39cq_so2_cloud_job_unhandled_error:{str(exc)[:240]}")
    (report_dir / PRIVATE_TRACE_FILE).write_text(json.dumps({"phase": PHASE, "runId": run_id, "privateOnly": True, "records": runtime_summary.get("traceRecords", [])}, indent=2) + "\n", encoding="utf-8")
    reports = build_reports(run_id, created_at, report_dir, asset_verification, runtime_summary, blockers, warnings)
    write_reports(report_dir, reports)
    planned = collect_artifacts(report_dir, bucket_name, prefix)
    reports = build_reports(run_id, created_at, report_dir, asset_verification, runtime_summary, blockers, warnings, planned)
    write_reports(report_dir, reports)
    uploaded = upload_artifacts(client, report_dir, bucket_name, prefix, blockers)
    print(json.dumps({
        "phase": PHASE,
        "runId": run_id,
        "ok": reports["phase_39cq_so2_structured_output_compat_recovery_report.json"]["ok"],
        "runtimeStatus": runtime_summary.get("runtimeStatus"),
        "selectedStrategyId": runtime_summary.get("selectedStrategyId"),
        "uploadedArtifacts": len(uploaded),
        "blockers": sorted(set(blockers)),
        "warnings": sorted(set(warnings)),
    }, separators=(",", ":")))
    return 0 if not blockers else 1


if __name__ == "__main__":
    raise SystemExit(main())
