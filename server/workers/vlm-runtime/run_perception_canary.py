#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
import traceback
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image

from classify_oom import classify_oom
from l4_tuning_profiles import get_profile
from perception_canary_fixtures import canary_specs, draw_canary
from perception_decomposed_qa import (
    SCHEMA_VERSION,
    compose_fixture_result,
    labels_schema,
    parse_direct_json,
    regions_schema,
    safe_zone_schema,
    validate_labels,
    validate_regions,
    validate_safe_zone,
)
from perception_trace_capture import trace_record


PHASE = "39C-Q-SO3"
MATRIX_ID = "phase39c-qwen-so3-perception-canary-v1"
MODEL_ID = os.environ.get("REEDITPRO_VLM_MODEL_ID", "Qwen/Qwen3-VL-2B-Instruct")
MODEL_REVISION = os.environ.get("REEDITPRO_VLM_MODEL_REVISION", "unknown")
CANDIDATE_IDS = [
    "Qwen/Qwen3-VL-8B-Instruct-FP8",
    "Qwen/Qwen3-VL-4B-Instruct",
    "Qwen/Qwen3-VL-2B-Instruct",
]


def load_generated_fixture_module():
    module_path = Path(__file__).with_name("run-generated-vlm-fixture.py")
    spec = importlib.util.spec_from_file_location("phase39c_generated_fixture_base", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("generated_fixture_module_unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


BASE = load_generated_fixture_module()
NetworkGuard = BASE.NetworkGuard
generate_fixture = BASE.generate_fixture
supported_llm_kwargs = BASE.supported_llm_kwargs


def instantiate_llm(model_dir: Path):
    if str(model_dir) == MODEL_ID or not model_dir.exists():
        raise RuntimeError("PHASE39CQ_SO3_LOCAL_MODEL_PATH_REQUIRED")
    from vllm import LLM

    profile = get_profile("conservative-eager-short-context")
    llm_kwargs = {
        "model": str(model_dir),
        "tokenizer": str(model_dir),
        "trust_remote_code": True,
        "max_model_len": 2048,
        "limit_mm_per_prompt": {"image": 1},
        "max_num_seqs": 1,
        "max_num_batched_tokens": 1024,
        "enforce_eager": True,
        "gpu_memory_utilization": 0.92,
        "mm_processor_cache_gb": 0,
        "disable_log_stats": True,
    }
    llm_kwargs, dropped = supported_llm_kwargs(LLM, llm_kwargs)
    return LLM(**llm_kwargs), [f"unsupported_llm_kwarg_dropped:{key}" for key in dropped], profile


def build_sampling_params(max_tokens: int = 192, schema: Optional[Dict[str, Any]] = None) -> Tuple[Any, List[str]]:
    from vllm import SamplingParams

    kwargs: Dict[str, Any] = {"temperature": 0.0, "top_p": 1.0, "max_tokens": max_tokens}
    warnings: List[str] = []
    if schema:
        try:
            from vllm.sampling_params import StructuredOutputsParams

            try:
                return SamplingParams(**kwargs, structured_outputs=StructuredOutputsParams(json=schema)), warnings
            except Exception as exc:
                warnings.append(f"structured_outputs_param_rejected:{type(exc).__name__}:{str(exc)[:160]}")
        except Exception as exc:
            warnings.append(f"structured_outputs_import_failed:{type(exc).__name__}:{str(exc)[:160]}")
        try:
            from vllm.sampling_params import GuidedDecodingParams

            try:
                return SamplingParams(**kwargs, guided_decoding=GuidedDecodingParams(json=schema)), warnings
            except Exception as exc:
                warnings.append(f"guided_decoding_param_rejected:{type(exc).__name__}:{str(exc)[:160]}")
        except Exception as exc:
            warnings.append(f"guided_decoding_import_failed:{type(exc).__name__}:{str(exc)[:160]}")
    return SamplingParams(**kwargs), warnings


def prompt_for_stage(stage_id: str, fixture: Dict[str, Any], schema: Optional[Dict[str, Any]]) -> str:
    fixture_id = fixture["fixtureId"]
    common = [
        "You are a bounded ReeditPro Phase 39C-Q-SO3 generated-fixture perception canary worker.",
        "Use only the supplied deterministic synthetic image.",
        "Do not claim real media, provider calls, tools, URLs, or external context.",
        "Use /no_think behavior and do not reveal reasoning.",
    ]
    if stage_id == "P1":
        task = [
            f"Fixture id: {fixture_id}.",
            "List the visible labels and their broad zones using simple words.",
            "This is diagnostic only. Mention uncertainty if the image is unclear.",
        ]
        return chat_prompt(common, task, image=True)
    if stage_id == "P2":
        task = [
            f"Fixture id: {fixture_id}. Candidate id: {MODEL_ID}.",
            "Return only direct JSON for stage P2 labels. Include every expected visible label you can see.",
            "No markdown, no prose, no code fences.",
            json.dumps(schema, separators=(",", ":")) if schema else "",
        ]
        return chat_prompt(common, task, image=True)
    if stage_id == "P3":
        task = [
            f"Fixture id: {fixture_id}. Candidate id: {MODEL_ID}.",
            "Return only direct JSON for stage P3 coarse regions.",
            "Use only zones: top, bottom, left, right, center, lower_third, upper_third.",
            "Do not output normalized boxes.",
            json.dumps(schema, separators=(",", ":")) if schema else "",
        ]
        return chat_prompt(common, task, image=True)
    if stage_id == "P4":
        task = [
            f"Fixture id: {fixture_id}. Candidate id: {MODEL_ID}.",
            "Return only direct JSON for stage P4 safe-zone reasoning.",
            "The safe_zone.decision must be pass, warn, block, or manual_review. Never use unknown.",
            "For ambiguous fixtures, require manual review.",
            json.dumps(schema, separators=(",", ":")) if schema else "",
        ]
        return chat_prompt(common, task, image=True)
    raise ValueError(f"unknown stage: {stage_id}")


def chat_prompt(system_lines: List[str], user_lines: List[str], image: bool) -> str:
    image_pad = "<|vision_start|><|image_pad|><|vision_end|>\n" if image else ""
    return (
        "<|im_start|>system\n"
        + " ".join(system_lines)
        + "<|im_end|>\n<|im_start|>user\n"
        + image_pad
        + "\n".join(line for line in user_lines if line)
        + "\n<|im_end|>\n<|im_start|>assistant\n"
    )


def run_generation(llm, fixture: Dict[str, Any], fixture_path: Path, stage_id: str, schema: Optional[Dict[str, Any]], max_tokens: int = 192) -> Tuple[str, List[str]]:
    sampling, sampling_warnings = build_sampling_params(max_tokens=max_tokens, schema=schema)
    request = {
        "prompt": prompt_for_stage(stage_id, fixture, schema),
        "multi_modal_data": {"image": Image.open(fixture_path)},
    }
    outputs = llm.generate([request], sampling)
    raw = outputs[0].outputs[0].text if outputs and outputs[0].outputs else ""
    return raw, sampling_warnings


def image_transport_record(path: Path, fixture: Dict[str, Any]) -> Dict[str, Any]:
    import hashlib

    with Image.open(path) as image:
        dimensions = {"width": image.width, "height": image.height}
    data = path.read_bytes()
    return {
        "fixtureId": fixture["fixtureId"],
        "stageId": "P0",
        "status": "passed" if data and dimensions["width"] > 0 and dimensions["height"] > 0 else "blocked",
        "sizeBytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "dimensions": dimensions,
    }


def run_fixture_stages(llm, fixture: Dict[str, Any], fixture_path: Path, canary: bool) -> Dict[str, Any]:
    traces: List[Dict[str, Any]] = []
    warnings: List[str] = []
    transport = image_transport_record(fixture_path, fixture)
    blockers: List[str] = [] if transport["status"] == "passed" else ["image_transport_sanity_failed"]

    raw_freeform, freeform_warnings = run_generation(llm, fixture, fixture_path, "P1", None, max_tokens=96)
    warnings.extend(freeform_warnings)
    traces.append(trace_record(MODEL_ID, fixture["fixtureId"], "P1", raw_freeform))

    label_schema = labels_schema(CANDIDATE_IDS)
    raw_labels, label_warnings = run_generation(llm, fixture, fixture_path, "P2", label_schema)
    warnings.extend(label_warnings)
    traces.append(trace_record(MODEL_ID, fixture["fixtureId"], "P2", raw_labels))
    parsed_labels, parse_label_blockers, parse_label_warnings = parse_direct_json(raw_labels)
    label_result, label_blockers, label_stage_warnings = validate_labels(parsed_labels, fixture, MODEL_ID)

    region_schema = regions_schema(CANDIDATE_IDS)
    raw_regions, region_warnings = run_generation(llm, fixture, fixture_path, "P3", region_schema)
    warnings.extend(region_warnings)
    traces.append(trace_record(MODEL_ID, fixture["fixtureId"], "P3", raw_regions))
    parsed_regions, parse_region_blockers, parse_region_warnings = parse_direct_json(raw_regions)
    region_result, region_blockers, region_stage_warnings = validate_regions(parsed_regions, fixture, MODEL_ID)

    safe_schema = safe_zone_schema(CANDIDATE_IDS)
    raw_safe, safe_warnings = run_generation(llm, fixture, fixture_path, "P4", safe_schema)
    warnings.extend(safe_warnings)
    traces.append(trace_record(MODEL_ID, fixture["fixtureId"], "P4", raw_safe))
    parsed_safe, parse_safe_blockers, parse_safe_warnings = parse_direct_json(raw_safe)
    safe_result, safe_blockers, safe_stage_warnings = validate_safe_zone(parsed_safe, fixture, MODEL_ID)

    stage_blockers = blockers + parse_label_blockers + label_blockers + parse_region_blockers + region_blockers + parse_safe_blockers + safe_blockers
    stage_warnings = warnings + parse_label_warnings + label_stage_warnings + parse_region_warnings + region_stage_warnings + parse_safe_warnings + safe_stage_warnings
    composed = compose_fixture_result(fixture, label_result, region_result, safe_result, canary=canary)
    composed["blockers"] = sorted(set(composed.get("blockers", []) + stage_blockers))
    composed["warnings"] = sorted(set(composed.get("warnings", []) + stage_warnings))
    composed["transport"] = transport
    composed["stages"] = {
        "P1": {"status": "diagnostic_only", "traceHash": traces[0]["rawOutputSha256"]},
        "P2": {"status": "passed" if not parse_label_blockers and not label_blockers else "blocked", "schemaValid": label_result.get("schemaValid"), "labelRecall": label_result.get("labelRecall")},
        "P3": {"status": "passed" if not parse_region_blockers and not region_blockers else "blocked", "schemaValid": region_result.get("schemaValid"), "coarseRegionAccuracy": region_result.get("coarseRegionAccuracy")},
        "P4": {"status": "passed" if not parse_safe_blockers and not safe_blockers else "blocked", "schemaValid": safe_result.get("schemaValid"), "decision": safe_result.get("decision")},
        "P5": {"status": composed["status"]},
    }
    return {
        "fixtureResult": composed,
        "traceRecords": traces,
        "labels": label_result,
        "regions": region_result,
        "safeZone": safe_result,
    }


def prepare_original_fixture_specs(raw_specs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    prepared: List[Dict[str, Any]] = []
    for spec in raw_specs:
        expected_zones = {}
        for region in spec.get("expectedRegions", []):
            label = str(region.get("label", ""))
            expected_zones[label] = coarse_zone(float(region.get("x", 0.5)), float(region.get("y", 0.5)))
        prepared.append({
            **spec,
            "expectedZones": expected_zones,
        })
    return prepared


def coarse_zone(x: float, y: float) -> str:
    if y < 0.34:
        return "upper_third" if 0.34 <= x <= 0.66 else "top"
    if y > 0.66:
        return "lower_third" if 0.25 <= x <= 0.75 else "bottom"
    if x < 0.34:
        return "left"
    if x > 0.66:
        return "right"
    return "center"


def average(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def run_matrix(model_dir: Path, output_dir: Path, fixture_dir: Path, original_specs: List[Dict[str, Any]]) -> Dict[str, Any]:
    with NetworkGuard() as guard:
        import vllm

        llm, llm_warnings, profile = instantiate_llm(model_dir)
        canary_results: List[Dict[str, Any]] = []
        original_results: List[Dict[str, Any]] = []
        trace_records: List[Dict[str, Any]] = []
        label_reports: List[Dict[str, Any]] = []
        region_reports: List[Dict[str, Any]] = []
        safe_zone_reports: List[Dict[str, Any]] = []

        for spec in canary_specs():
            path = draw_canary(spec, fixture_dir / "canaries", max_size=384)
            result = run_fixture_stages(llm, spec, path, canary=True)
            canary_results.append(result["fixtureResult"])
            trace_records.extend(result["traceRecords"])
            label_reports.append({"fixtureId": spec["fixtureId"], **result["labels"]})
            region_reports.append({"fixtureId": spec["fixtureId"], **result["regions"]})
            safe_zone_reports.append({"fixtureId": spec["fixtureId"], **result["safeZone"]})

        canary_label_recall = average([float(item.get("labelRecall", 0)) for item in canary_results])
        canary_region_accuracy = average([float(item.get("coarseRegionAccuracy", 0)) for item in canary_results])
        canaries_passed = all(item.get("status") == "passed" for item in canary_results)

        if canaries_passed:
            for spec in prepare_original_fixture_specs(original_specs):
                path = generate_fixture(spec, fixture_dir / "generated-fixtures", 384)
                result = run_fixture_stages(llm, spec, path, canary=False)
                original_results.append(result["fixtureResult"])
                trace_records.extend(result["traceRecords"])
                label_reports.append({"fixtureId": spec["fixtureId"], **result["labels"]})
                region_reports.append({"fixtureId": spec["fixtureId"], **result["regions"]})
                safe_zone_reports.append({"fixtureId": spec["fixtureId"], **result["safeZone"]})

        fixture_label_recall = average([float(item.get("labelRecall", 0)) for item in original_results])
        fixture_region_accuracy = average([float(item.get("coarseRegionAccuracy", 0)) for item in original_results])
        originals_passed = len(original_results) == len(original_specs) and all(item.get("status") == "passed" for item in original_results)

        if guard.network_attempted:
            raise RuntimeError("PHASE39CQ_SO3_RUNTIME_NETWORK_ATTEMPTED")

    blockers: List[str] = []
    if not canaries_passed:
        blockers.append("perception_canary_gate_failed")
    if canaries_passed and not originals_passed:
        blockers.append("decomposed_generated_fixture_qa_failed")
    if not canaries_passed:
        blockers.append("original_generated_fixtures_not_run_due_canary_failure")
    status = "passed" if canaries_passed and originals_passed and not blockers else "blocked"
    return {
        "phase": PHASE,
        "runtimeStatus": status,
        "runtimeVersion": getattr(vllm, "__version__", "unknown"),
        "profile": profile.to_report(),
        "llmWarnings": llm_warnings,
        "canaryResults": canary_results,
        "generatedFixtureResults": original_results,
        "traceRecords": trace_records,
        "labelReports": label_reports,
        "regionReports": region_reports,
        "safeZoneReports": safe_zone_reports,
        "qa": {
            "canaryLabelRecall": canary_label_recall,
            "canaryCoarseRegionAccuracy": canary_region_accuracy,
            "fixtureLabelRecall": fixture_label_recall,
            "fixtureCoarseRegionAccuracy": fixture_region_accuracy,
            "canariesPassed": canaries_passed,
            "generatedFixturesPassed": originals_passed,
        },
        "blockers": blockers,
        "warnings": llm_warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--fixture-dir", required=True)
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--generated-fixture-manifest-path", required=True)
    args = parser.parse_args()

    for key in ["HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE"]:
        if os.environ.get(key) != "1":
            raise RuntimeError(f"{key}=1 is required")
    if os.environ.get("PROVIDER_EXECUTION_ENABLED", "false") != "false":
        raise RuntimeError("PROVIDER_EXECUTION_ENABLED must be false")
    if os.environ.get("REEDITPRO_VLM_PERCEPTION_CANARY_MATRIX") != MATRIX_ID:
        raise RuntimeError("REEDITPRO_VLM_PERCEPTION_CANARY_MATRIX mismatch")

    output_dir = Path(args.output_dir)
    fixture_dir = Path(args.fixture_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    fixture_dir.mkdir(parents=True, exist_ok=True)
    original_specs = json.loads(Path(args.generated_fixture_manifest_path).read_text())["specs"]
    try:
        summary = run_matrix(Path(args.model_dir), output_dir, fixture_dir, original_specs)
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        text = traceback.format_exc()
        classification = classify_oom(text, enforce_eager=True)
        summary = {
            "phase": PHASE,
            "runtimeStatus": "blocked",
            "runtimeVersion": None,
            "canaryResults": [],
            "generatedFixtureResults": [],
            "traceRecords": [],
            "labelReports": [],
            "regionReports": [],
            "safeZoneReports": [],
            "qa": {
                "canaryLabelRecall": 0,
                "canaryCoarseRegionAccuracy": 0,
                "fixtureLabelRecall": 0,
                "fixtureCoarseRegionAccuracy": 0,
                "canariesPassed": False,
                "generatedFixturesPassed": False,
            },
            "blockers": [f"perception_canary_runtime_failed:{str(exc)[:240]}"],
            "warnings": [classification["safeSummary"]] if classification.get("isCudaOom") else [],
        }
    summary["runId"] = args.run_id
    summary["matrixId"] = MATRIX_ID
    summary["schemaVersion"] = SCHEMA_VERSION
    summary["modelId"] = MODEL_ID
    summary["modelRevision"] = MODEL_REVISION
    print(json.dumps(summary, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
