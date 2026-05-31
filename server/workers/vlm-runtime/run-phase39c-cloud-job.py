#!/usr/bin/env python3
import hashlib
import json
import os
import subprocess
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from google.cloud import storage


PHASE = "39C"
MODEL_ID = "Qwen/Qwen3-VL-8B-Instruct"
MODEL_REVISION = "0c351dd01ed87e9c1b53cbc748cba10e6187ff3b"
MODEL_GCS_PATH = "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/"
AGGREGATE_SHA256 = "3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908"
QA_BUCKET = "reeditpro-staging-reeditpro-qa-artifacts"

EXPECTED_ARTIFACTS = [
    "phase_39c_vlm_runtime_plan.json",
    "phase_39c_vlm_model_asset_verification.json",
    "phase_39c_generated_fixture_manifest.json",
    "phase_39c_prompt_template_manifest.json",
    "phase_39c_vlm_runtime_results.json",
    "phase_39c_vlm_output_schema_validation_report.json",
    "phase_39c_vlm_object_region_qa_report.json",
    "phase_39c_vlm_safe_zone_qa_report.json",
    "phase_39c_vlm_hallucination_safety_report.json",
    "phase_39c_vlm_runtime_cost_memory_report.json",
    "phase_39c_private_artifact_manifest.json",
    "phase_39c_generated_vlm_runtime_report.json",
]

EXPECTED_ASSETS = [
    ("README.md", 7133, "6d5d06e0c3f069097002445d30dce9ee107db3afaf15563f09e6df49b8dcb4d7"),
    ("chat_template.json", 5499, "5c72a170d2a4a1a3bc5adad2e689ae28138a9700e5b8c96c0266331e86c0acce"),
    ("config.json", 1474, "5cd452860dc1e9c29dd71cc3cef7f39b338b7a40793f7a260655c2d3568f3661"),
    ("generation_config.json", 269, "8469742d1fce0de951c8909b26a2c0c0d8490837ce476efb114da9e0cefc4d44"),
    ("merges.txt", 1671839, "599bab54075088774b1733fde865d5bd747cbcc7a547c5bc12610e874e26f5e3"),
    ("model-00001-of-00004.safetensors", 4902275944, "d5d0aef0eb170fc7453a296c43c0849a56f510555d3588e4fd662bb35490aefa"),
    ("model-00002-of-00004.safetensors", 4915962496, "8be88fb5501e4d5719a6d4cc212e6a13480330e74f3e8c77daa1a68f199106b5"),
    ("model-00003-of-00004.safetensors", 4999831048, "83de00eafe6e0d57ccd009dbcf71c9974d74df2f016c27afb7e95aafd16b2192"),
    ("model-00004-of-00004.safetensors", 2716270024, "0a88b98e9f96270973f567e6a2c103ede6ccdf915ca3075e21c755604d0377a5"),
    ("model.safetensors.index.json", 67759, "520b2e05079402e9468a8701d03d1154d14b2599593afb6effa7fb60c1bff070"),
    ("preprocessor_config.json", 390, "27225450ac9c6529872ee1924fcb0962ff5634834f817040f444118116f4e516"),
    ("tokenizer.json", 7032403, "a5d85b6dcc535e6b93115a9ef287e6132fdbf30270da6218194ba742261173c7"),
    ("tokenizer_config.json", 10868, "c2da771801886ad9ae98181793ffd3dfb7f1af30f6f7c6a4e15d7dbba52e2399"),
    ("video_preprocessor_config.json", 385, "7768af27c1fafa9cc9011c1dc20067e03f8915e03b63504550e11d5066986d13"),
    ("vocab.json", 2776833, "ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910"),
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def fixture_manifest(run_id: str, created_at: str) -> Dict[str, Any]:
    specs = [
        {
            "fixtureId": "generated-object-layout",
            "width": 1280,
            "height": 720,
            "generatedOnly": True,
            "riskCategory": "required_pass",
            "seed": "phase39c-object-layout-v1",
            "expectedLabels": ["laptop", "coffee mug", "plant", "timeline panel"],
            "expectedRegions": [
                {"regionId": "laptop_center", "label": "laptop", "x": 0.36, "y": 0.28, "width": 0.32, "height": 0.34, "required": True},
                {"regionId": "mug_right", "label": "coffee mug", "x": 0.72, "y": 0.42, "width": 0.12, "height": 0.18, "required": True},
                {"regionId": "timeline_bottom", "label": "timeline panel", "x": 0.12, "y": 0.74, "width": 0.76, "height": 0.16, "required": True},
            ],
            "safeZoneQuestion": "Identify object regions and whether a lower-third caption would collide with the timeline panel.",
            "passCriteria": ["Required object labels recalled >= 0.70.", "Required broad region centers are in the expected half of the image."],
            "warningCriteria": ["Low confidence object labels are manual-review warnings."],
        },
        {
            "fixtureId": "generated-ui-safe-zone",
            "width": 1280,
            "height": 720,
            "generatedOnly": True,
            "riskCategory": "required_pass",
            "seed": "phase39c-ui-safe-zone-v1",
            "expectedLabels": ["caption conflict", "lower third alert", "toolbar", "preview"],
            "expectedRegions": [
                {"regionId": "lower_caption_conflict", "label": "caption conflict", "x": 0.08, "y": 0.68, "width": 0.84, "height": 0.22, "required": True},
                {"regionId": "toolbar_top", "label": "toolbar", "x": 0.04, "y": 0.04, "width": 0.92, "height": 0.12, "required": True},
            ],
            "safeZoneQuestion": "Decide if the lower third is risky and suggest an alternate caption zone.",
            "passCriteria": ["Lower-third risk is detected.", "Manual review or upper-third recommendation is allowed."],
            "warningCriteria": ["If all zones are risky, output manual_review instead of guessing."],
        },
        {
            "fixtureId": "generated-ocr-vlm-comparison",
            "width": 1280,
            "height": 720,
            "generatedOnly": True,
            "riskCategory": "required_pass",
            "seed": "phase39c-ocr-vlm-comparison-v1",
            "expectedLabels": ["source label", "export button", "confidence badge", "text-like region"],
            "expectedRegions": [
                {"regionId": "source_label_left", "label": "source label", "x": 0.06, "y": 0.18, "width": 0.28, "height": 0.16, "required": True},
                {"regionId": "export_button_right", "label": "export button", "x": 0.72, "y": 0.18, "width": 0.22, "height": 0.16, "required": True},
            ],
            "safeZoneQuestion": "Return text-like regions that a future OCR/VLM comparison gate could reconcile.",
            "passCriteria": ["Text-like regions are returned as advisory metadata.", "No OCR runtime is invoked by Phase 39C."],
            "warningCriteria": ["Uncertain text labels must be flagged."],
        },
        {
            "fixtureId": "generated-ambiguous-scene",
            "width": 1280,
            "height": 720,
            "generatedOnly": True,
            "riskCategory": "manual_review_expected",
            "seed": "phase39c-ambiguous-scene-v1",
            "expectedLabels": ["ambiguous icon cluster", "manual review"],
            "expectedRegions": [
                {"regionId": "ambiguous_center", "label": "ambiguous icon cluster", "x": 0.36, "y": 0.32, "width": 0.28, "height": 0.28, "required": True},
            ],
            "safeZoneQuestion": "Flag uncertainty if icon/object identity is ambiguous.",
            "passCriteria": ["High uncertainty or manual_review is acceptable and preferred."],
            "warningCriteria": ["Overconfident invented labels are hallucination warnings."],
        },
        {
            "fixtureId": "generated-spatial-reasoning",
            "width": 1280,
            "height": 720,
            "generatedOnly": True,
            "riskCategory": "required_pass",
            "seed": "phase39c-spatial-reasoning-v1",
            "expectedLabels": ["left panel", "right card", "center arrow", "top badge"],
            "expectedRegions": [
                {"regionId": "left_panel", "label": "left panel", "x": 0.08, "y": 0.22, "width": 0.28, "height": 0.38, "required": True},
                {"regionId": "right_card", "label": "right card", "x": 0.64, "y": 0.22, "width": 0.28, "height": 0.38, "required": True},
                {"regionId": "center_arrow", "label": "center arrow", "x": 0.44, "y": 0.36, "width": 0.12, "height": 0.16, "required": True},
            ],
            "safeZoneQuestion": "Describe broad left/right/center relations without claiming exact pixel geometry.",
            "passCriteria": ["Spatial relation labels are broadly correct.", "Coordinates are normalized to 0..1."],
            "warningCriteria": ["Coordinate uncertainty must be noted."],
        },
    ]
    return {"phase": PHASE, "runId": run_id, "createdAt": created_at, "generatedOnly": True, "fixtureImagesCommitted": False, "specs": specs}


def prompt_manifest(run_id: str, created_at: str, fixtures: Dict[str, Any]) -> Dict[str, Any]:
    system_instruction = " ".join([
        "You are a bounded ReeditPro Phase 39C generated-fixture VLM QA worker.",
        "Use only the provided generated synthetic image and this fixed prompt.",
        "Return valid JSON only. Do not call tools, browse, request files, infer secrets, or claim real media processing.",
        "All boxes must be normalized 0..1 and approximate. Mark uncertainty instead of guessing.",
    ])
    templates = []
    for fixture in fixtures["specs"]:
        templates.append({
            "promptTemplateId": f"phase39c_{fixture['fixtureId'].replace('-', '_')}_json_v1",
            "fixtureId": fixture["fixtureId"],
            "schemaId": "phase39c_vlm_fixture_output_v1",
            "systemInstruction": system_instruction,
            "userInstruction": " ".join([
                fixture["safeZoneQuestion"],
                "Return JSON with fixture_id, prompt_template_id, model_id, model_revision, runtime, objects, text_like_regions, safe_zone_suggestions, spatial_relations, uncertainty, blocked_actions, and qa_flags.",
                "Do not include markdown fences.",
            ]),
            "rawPromptAllowed": False,
            "providerCallAllowed": False,
            "toolCallAllowed": False,
            "outputFormat": "json_only",
        })
    return {
        "phase": PHASE,
        "runId": run_id,
        "createdAt": created_at,
        "schemaId": "phase39c_vlm_fixture_output_v1",
        "rawPromptAllowed": False,
        "providerCallsAllowed": False,
        "toolCallsAllowed": False,
        "templates": templates,
    }


def parse_gcs_uri(uri: str) -> tuple[str, str]:
    if not uri.startswith("gs://"):
        raise ValueError(f"not a private GCS URI: {uri}")
    bucket, _, name = uri[5:].partition("/")
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
        actual_sha = entry.get("actualSha256")
        actual_size = entry.get("actualSizeBytes")
        if not actual_sha or actual_size is None:
            continue
        lines.append(f"{entry['relativePath']} {actual_sha} {actual_size}")
    return hashlib.sha256(("\n".join(lines) + "\n").encode("utf-8")).hexdigest()


def download_and_verify_assets(client: storage.Client, model_root: Path, blockers: List[str], warnings: List[str]) -> Dict[str, Any]:
    model_root.mkdir(parents=True, exist_ok=True)
    entries: List[Dict[str, Any]] = []
    for relative_path, expected_size, expected_sha in EXPECTED_ASSETS:
        gcs_uri = f"{MODEL_GCS_PATH}{relative_path}"
        local_path = model_root / relative_path
        local_path.parent.mkdir(parents=True, exist_ok=True)
        entry: Dict[str, Any] = {
            "relativePath": relative_path,
            "gcsUri": gcs_uri,
            "localPath": str(local_path),
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
                blockers.append(f"phase39c_model_gcs_size_mismatch:{relative_path}")
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
            blockers.append(f"phase39c_model_asset_download_or_verify_failed:{relative_path}:{str(exc)[:240]}")
            if "403" in str(exc):
                blockers.append(f"phase39c_gpu_worker_missing_model_object_viewer_access:{relative_path}")
        entries.append(entry)
    computed_aggregate = aggregate_sha(entries)
    if computed_aggregate != AGGREGATE_SHA256:
        blockers.append("phase39c_aggregate_sha256_mismatch")
    status = "verified" if all(entry.get("verified") for entry in entries) and computed_aggregate == AGGREGATE_SHA256 and not any("checksum_mismatch" in item or "size_mismatch" in item for item in blockers) else "blocked"
    return {
        "phase": PHASE,
        "runId": os.environ["REEDITPRO_PHASE39C_RUN_ID"],
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "modelGcsPath": MODEL_GCS_PATH,
        "aggregateSha256": AGGREGATE_SHA256,
        "computedAggregateSha256": computed_aggregate,
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
        "VLLM_CACHE_ROOT": str(report_dir.parent / ".vllm-cache"),
        "HF_HUB_OFFLINE": "1",
        "TRANSFORMERS_OFFLINE": "1",
        "MODEL_DOWNLOADS_ENABLED": "false",
        "REAL_MEDIA_INPUT_ENABLED": "false",
        "PROVIDER_EXECUTION_ENABLED": "false",
        "RAW_VLM_PROMPT_ENABLED": "false",
    })
    command = [
        sys.executable,
        str(Path(__file__).with_name("run-generated-vlm-fixture.py")),
        "--run-id",
        run_id,
        "--output-dir",
        str(report_dir),
        "--fixture-dir",
        str(fixture_dir),
        "--model-dir",
        str(model_root),
        "--fixture-manifest-path",
        str(report_dir / "phase_39c_generated_fixture_manifest.json"),
        "--prompt-manifest-path",
        str(report_dir / "phase_39c_prompt_template_manifest.json"),
    ]
    try:
        result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=3 * 60 * 60, env=env)
        if result.stderr.strip():
            warnings.append(result.stderr[-3000:])
        json_lines = [line.strip() for line in result.stdout.splitlines() if line.strip().startswith("{") and line.strip().endswith("}")]
        if not json_lines:
            blockers.append(f"phase39c_worker_summary_missing:exit={result.returncode}")
            return {"runtimeStatus": "blocked", "runtimeVersion": None, "fixtureResults": [], "blockers": blockers}
        summary = json.loads(json_lines[-1])
        blockers.extend(summary.get("blockers", []))
        return summary
    except Exception as exc:
        blockers.append(f"phase39c_worker_execution_failed:{str(exc)[:240]}")
        return {"runtimeStatus": "blocked", "runtimeVersion": None, "fixtureResults": [], "blockers": blockers}


def average(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def build_reports(run_id: str, created_at: str, report_dir: Path, asset_verification: Dict[str, Any], runtime_summary: Dict[str, Any], blockers: List[str], warnings: List[str], artifacts: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    fixtures = json.loads((report_dir / "phase_39c_generated_fixture_manifest.json").read_text())
    prompts = json.loads((report_dir / "phase_39c_prompt_template_manifest.json").read_text())
    fixture_results = runtime_summary.get("fixtureResults", [])
    schema_validity = sum(1 for item in fixture_results if item.get("schemaValid")) / len(fixture_results) if fixture_results else 0
    average_recall = average([float(item.get("requiredLabelRecall", 0)) for item in fixture_results])
    average_region = average([float(item.get("broadRegionAccuracy", 0)) for item in fixture_results])
    combined_blockers = sorted(set(blockers + asset_verification.get("blockers", []) + [blocker for item in fixture_results for blocker in item.get("blockers", [])]))
    combined_warnings = sorted(set(warnings + asset_verification.get("warnings", []) + [warning for item in fixture_results for warning in item.get("warnings", [])]))
    runtime_status = runtime_summary.get("runtimeStatus", "blocked")
    runtime_passed = (
        runtime_status == "passed"
        and asset_verification.get("status") == "verified"
        and schema_validity >= 1
        and average_recall >= 0.7
        and average_region >= 0.7
        and not combined_blockers
    )
    report_artifacts = artifacts or []
    plan = {
        "phase": PHASE,
        "reportId": "phase_39c_vlm_runtime_plan",
        "createdAt": created_at,
        "runId": run_id,
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "privateModelPrefix": MODEL_GCS_PATH,
        "runtimeScope": "generated_synthetic_fixture_vlm_runtime_only",
        "requiredRuntime": "vllm",
        "requiredVllmVersion": "0.11.0",
        "localModelPathOnly": True,
        "runtimeAutoDownloadAllowed": False,
        "providerCallsAllowed": False,
        "rawPromptsAllowed": False,
        "realMediaAllowed": False,
        "arbitraryMediaAllowed": False,
        "publicOutputAllowed": False,
        "productionReadyAllowed": False,
        "betaReadyAllowed": False,
        "trackAAllowed": False,
        "stagingCloudRunJob": "reeditpro-stg-vlm-runtime-phase39c",
        "gpuType": "nvidia-l4",
    }
    runtime_results = {"phase": PHASE, "runId": run_id, "runtimeStatus": runtime_status, "runtimeVersion": runtime_summary.get("runtimeVersion"), "fixtureResults": fixture_results, "blockers": combined_blockers, "warnings": combined_warnings}
    schema_report = {
        "phase": PHASE,
        "runId": run_id,
        "schemaId": "phase39c_vlm_fixture_output_v1",
        "requiredSchemaValidity": 1,
        "schemaValidity": schema_validity,
        "fixtureResults": [{"fixtureId": item.get("fixtureId"), "parsedJson": item.get("parsedJson"), "schemaValid": item.get("schemaValid"), "blockers": item.get("blockers", []), "warnings": item.get("warnings", [])} for item in fixture_results],
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
        "warnings": [f"manual_review_zone:{item.get('fixtureId')}" for item in fixture_results if item.get("safeZoneDecision") == "manual_review"],
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
    cost_report = {
        "phase": PHASE,
        "runId": run_id,
        "gpuType": "L4",
        "gpuRuntimeApprovedNow": False,
        "localGpuAvailable": False,
        "stagingCloudRunRequested": True,
        "estimatedModelBytes": 17545914364,
        "memoryRisk": "high",
        "costRisk": "high",
        "notes": [
            "Qwen3-VL 8B runtime requires GPU/memory validation before controlled real-frame or planning integration phases.",
            "Official Qwen3-VL docs require vllm>=0.11.0; this staging image uses vllm/vllm-openai:v0.11.0.",
            *combined_warnings,
        ],
    }
    private_manifest = {
        "phase": PHASE,
        "runId": run_id,
        "createdAt": now_iso(),
        "privateOnly": True,
        "bucket": os.environ.get("REEDITPRO_PHASE39C_QA_BUCKET", QA_BUCKET),
        "prefix": os.environ.get("REEDITPRO_PHASE39C_QA_PREFIX", f"activation/phase39c/generated-vlm-runtime/{run_id}"),
        "artifactCount": len(report_artifacts),
        "artifacts": report_artifacts,
        "blockers": combined_blockers,
        "warnings": combined_warnings,
    }
    full_report = {
        "ok": runtime_passed,
        "phase": PHASE,
        "runId": run_id,
        "createdAt": created_at,
        "sourcePhase39A": {"pr": "https://github.com/yuzastudio6-cyber/Reedkt/pull/62", "commit": "698410e", "status": "approval_planning_passed"},
        "sourcePhase39B": {"modelId": MODEL_ID, "revision": MODEL_REVISION, "status": "verified", "targetGcsPath": MODEL_GCS_PATH, "aggregateSha256": AGGREGATE_SHA256, "fileCount": 15, "selectedTotalSizeBytes": 17545914364},
        "modelId": MODEL_ID,
        "revision": MODEL_REVISION,
        "privateModelPrefix": MODEL_GCS_PATH,
        "runtime": {
            "requestedRuntime": "vllm",
            "fallbackRuntime": "transformers_fallback",
            "runtimeStatus": runtime_status,
            "runtimeVersion": runtime_summary.get("runtimeVersion"),
            "transformersFallbackStatus": "skipped",
            "localModelPathUsed": runtime_passed,
            "modelIdRuntimePathBlocked": True,
            "runtimeAutoDownloadBlocked": True,
            "providerCallsBlocked": True,
            "rawPromptsBlocked": True,
            "realMediaBlocked": True,
            "arbitraryMediaBlocked": True,
        },
        "assetVerification": asset_verification,
        "generatedFixtureManifest": fixtures,
        "promptTemplateManifest": prompts,
        "fixtureResults": fixture_results,
        "qa": {
            "status": "passed" if runtime_passed else "blocked",
            "schemaValidity": schema_validity,
            "averageRequiredLabelRecall": average_recall,
            "averageBroadRegionAccuracy": average_region,
            "gates": [
                {"gateId": "phase39a_approval_evidence", "status": "passed", "summary": "Phase 39A approval evidence is referenced."},
                {"gateId": "phase39b_private_model_assets", "status": "passed" if asset_verification.get("status") == "verified" else "blocked", "summary": "Phase 39B asset verification gate."},
                {"gateId": "local_model_path_only", "status": "passed" if runtime_passed else "blocked", "summary": "Runtime used local model path only when runtime passed."},
                {"gateId": "generated_fixture_integrity", "status": "passed" if len(fixture_results) == 5 else "blocked", "summary": f"{len(fixture_results)} generated fixture results recorded."},
                {"gateId": "structured_json_schema", "status": "passed" if fixture_results and all(item.get("schemaValid") for item in fixture_results) else "blocked", "summary": "JSON schema validation gate."},
                {"gateId": "blocked_features", "status": "passed", "summary": "Provider/raw prompt/real media/public output/Track A remain blocked."},
            ],
            "blockers": combined_blockers,
            "warnings": combined_warnings,
        },
        "costMemory": cost_report,
        "artifacts": report_artifacts,
        "privateArtifactPrefix": f"gs://{os.environ.get('REEDITPRO_PHASE39C_QA_BUCKET', QA_BUCKET)}/{os.environ.get('REEDITPRO_PHASE39C_QA_PREFIX', f'activation/phase39c/generated-vlm-runtime/{run_id}')}/",
        "vlmToolFamilyBetaStatus": "phase-complete but tool-family incomplete" if runtime_passed else "blocked",
        "phase39DReadiness": {
            "readyForControlledRealFrameVlm": runtime_passed,
            "reason": "Phase 39C passed generated synthetic VLM runtime verification only; Phase 39D may gate exactly one private controlled real-frame sample." if runtime_passed else "Phase 39D remains blocked because Phase 39C generated VLM runtime verification did not pass.",
        },
        "blockers": combined_blockers,
        "warnings": combined_warnings,
    }
    return {
        "phase_39c_vlm_runtime_plan.json": plan,
        "phase_39c_vlm_model_asset_verification.json": asset_verification,
        "phase_39c_generated_fixture_manifest.json": fixtures,
        "phase_39c_prompt_template_manifest.json": prompts,
        "phase_39c_vlm_runtime_results.json": runtime_results,
        "phase_39c_vlm_output_schema_validation_report.json": schema_report,
        "phase_39c_vlm_object_region_qa_report.json": object_report,
        "phase_39c_vlm_safe_zone_qa_report.json": safe_zone_report,
        "phase_39c_vlm_hallucination_safety_report.json": hallucination_report,
        "phase_39c_vlm_runtime_cost_memory_report.json": cost_report,
        "phase_39c_private_artifact_manifest.json": private_manifest,
        "phase_39c_generated_vlm_runtime_report.json": full_report,
    }


def write_reports(report_dir: Path, reports: Dict[str, Any]) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)
    for file_name, value in reports.items():
        (report_dir / file_name).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def collect_report_artifacts(report_dir: Path, bucket: str, prefix: str) -> List[Dict[str, Any]]:
    artifacts = []
    for file_name in EXPECTED_ARTIFACTS:
        local_path = report_dir / file_name
        if not local_path.exists():
            continue
        object_name = f"{prefix}/{file_name}"
        artifacts.append({
            "id": file_name.replace(".", "_"),
            "kind": "report",
            "localPath": str(local_path),
            "bucket": bucket,
            "object": object_name,
            "gcsUri": f"gs://{bucket}/{object_name}",
            "sizeBytes": local_path.stat().st_size,
            "sha256": sha256_file(local_path),
        })
    return artifacts


def upload_reports(client: storage.Client, report_dir: Path, bucket_name: str, prefix: str, blockers: List[str]) -> List[Dict[str, Any]]:
    bucket = client.bucket(bucket_name)
    uploaded: List[Dict[str, Any]] = []
    for artifact in collect_report_artifacts(report_dir, bucket_name, prefix):
        try:
            blob = bucket.blob(artifact["object"])
            blob.upload_from_filename(artifact["localPath"], content_type="application/json")
            blob.reload()
            uploaded.append({
                **artifact,
                "generation": str(blob.generation) if blob.generation is not None else None,
                "metageneration": str(blob.metageneration) if blob.metageneration is not None else None,
                "crc32c": blob.crc32c,
                "md5Hash": blob.md5_hash,
                "sizeBytes": blob.size,
            })
        except Exception as exc:
            blockers.append(f"phase39c_private_artifact_upload_failed:{artifact['id']}:{str(exc)[:240]}")
            if "403" in str(exc):
                blockers.append(f"phase39c_gpu_worker_missing_qa_artifact_write_access:{artifact['id']}")
    return uploaded


def validate_env(blockers: List[str]) -> None:
    required = {
        "GCP_PROJECT_ID": "reeditpro",
        "GCP_REGION": "us-central1",
        "REEDITPRO_ENV": "staging",
        "REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ": "true",
        "REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE": "true",
        "REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD": "true",
        "REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE": "true",
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
    if os.environ.get("REEDITPRO_VLM_MODEL_GCS_PATH", MODEL_GCS_PATH) != MODEL_GCS_PATH:
        blockers.append("phase39c_model_gcs_path_mismatch")
    if os.environ.get("REEDITPRO_VLM_MODEL_REVISION", MODEL_REVISION) != MODEL_REVISION:
        blockers.append("phase39c_model_revision_mismatch")
    if os.environ.get("REEDITPRO_VLM_AGGREGATE_SHA256", AGGREGATE_SHA256) != AGGREGATE_SHA256:
        blockers.append("phase39c_aggregate_sha_env_mismatch")


def main() -> int:
    run_id = os.environ.get("REEDITPRO_PHASE39C_RUN_ID", "")
    if not run_id.startswith("phase39c-"):
        print("REEDITPRO_PHASE39C_RUN_ID must start with phase39c-", file=sys.stderr)
        return 2
    created_at = now_iso()
    bucket_name = os.environ.get("REEDITPRO_PHASE39C_QA_BUCKET", QA_BUCKET)
    prefix = os.environ.get("REEDITPRO_PHASE39C_QA_PREFIX", f"activation/phase39c/generated-vlm-runtime/{run_id}")
    run_root = Path("/tmp/reeditpro-vlm-runtime/phase39c") / run_id
    report_dir = run_root / "reports"
    fixture_dir = run_root / "fixtures"
    model_root = run_root / "models" / "qwen3-vl-8b-instruct"
    report_dir.mkdir(parents=True, exist_ok=True)
    blockers: List[str] = []
    warnings: List[str] = ["phase39c_staging_l4_cloud_run_job_path_used"]
    validate_env(blockers)
    fixtures = fixture_manifest(run_id, created_at)
    prompts = prompt_manifest(run_id, created_at, fixtures)
    (report_dir / "phase_39c_generated_fixture_manifest.json").write_text(json.dumps(fixtures, indent=2) + "\n", encoding="utf-8")
    (report_dir / "phase_39c_prompt_template_manifest.json").write_text(json.dumps(prompts, indent=2) + "\n", encoding="utf-8")
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
        "blockers": ["phase39c_asset_verification_not_started"],
        "warnings": warnings,
    }
    runtime_summary: Dict[str, Any] = {"runtimeStatus": "blocked", "runtimeVersion": None, "fixtureResults": [], "blockers": []}
    try:
        if not blockers:
            asset_verification = download_and_verify_assets(client, model_root, blockers, warnings)
        if asset_verification.get("status") == "verified" and not blockers:
            runtime_summary = run_worker(run_id, report_dir, fixture_dir, model_root, blockers, warnings)
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        blockers.append(f"phase39c_cloud_job_unhandled_error:{str(exc)[:240]}")
    reports = build_reports(run_id, created_at, report_dir, asset_verification, runtime_summary, blockers, warnings)
    write_reports(report_dir, reports)
    uploaded = upload_reports(client, report_dir, bucket_name, prefix, blockers)
    reports = build_reports(run_id, created_at, report_dir, asset_verification, runtime_summary, blockers, warnings, uploaded)
    write_reports(report_dir, reports)
    uploaded = upload_reports(client, report_dir, bucket_name, prefix, blockers)
    print(json.dumps({
        "phase": PHASE,
        "runId": run_id,
        "ok": reports["phase_39c_generated_vlm_runtime_report.json"]["ok"],
        "runtimeStatus": runtime_summary.get("runtimeStatus"),
        "uploadedArtifacts": len(uploaded),
        "blockers": sorted(set(blockers)),
        "warnings": sorted(set(warnings)),
    }, separators=(",", ":")))
    return 0 if not blockers else 1


if __name__ == "__main__":
    raise SystemExit(main())
