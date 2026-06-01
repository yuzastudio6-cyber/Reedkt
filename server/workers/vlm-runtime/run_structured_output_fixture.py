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
from structured_output_schemas import MATRIX_ID, SCHEMA_VERSION, compact_schema, generic_json_grammar
from structured_output_strategies import STRATEGIES, all_strategy_reports, pass_counting_strategy
from structured_output_trace_capture import trace_record
from structured_output_validator import parse_candidate_json, validate_fixture_output


MODEL_ID = os.environ.get("REEDITPRO_VLM_MODEL_ID", "Qwen/Qwen3-VL-2B-Instruct")
MODEL_REVISION = os.environ.get("REEDITPRO_VLM_MODEL_REVISION", "unknown")


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


def build_prompt(template: Dict[str, Any], fixture: Dict[str, Any], fixture_path: Path, schema: Dict[str, Any], strategy_id: str) -> str:
    tag_instruction = "Wrap the JSON only in <vlm_json> and </vlm_json>." if strategy_id == "S5" else "Return the JSON object directly."
    user_instruction = "\n".join([
        template["userInstruction"],
        f"Fixture file name: {fixture_path.name}",
        "Use /no_think behavior. Do not reveal reasoning or thinking.",
        "Output must satisfy this compact JSON schema exactly.",
        json.dumps(schema, separators=(",", ":")),
        tag_instruction,
        "Do not include markdown fences, prose, tool calls, provider names, public URLs, or any content outside the required JSON protocol.",
    ])
    return (
        "<|im_start|>system\n"
        + template["systemInstruction"]
        + "<|im_end|>\n<|im_start|>user\n"
        + "<|vision_start|><|image_pad|><|vision_end|>\n"
        + user_instruction
        + "\n<|im_end|>\n<|im_start|>assistant\n"
    )


def sampling_params_for_strategy(strategy, schema: Dict[str, Any]):
    from vllm import SamplingParams

    base_kwargs: Dict[str, Any] = {
        "temperature": strategy.temperature,
        "top_p": strategy.top_p,
        "max_tokens": strategy.max_tokens,
    }
    if strategy.strategy_id == "S3":
        return build_sampling_params_from_candidates(
            SamplingParams,
            base_kwargs,
            structured_output_candidates(json_schema=schema),
            "structured_outputs_json_unsupported_by_installed_vllm",
        )
    elif strategy.strategy_id == "S4":
        return build_sampling_params_from_candidates(
            SamplingParams,
            base_kwargs,
            structured_output_candidates(grammar=generic_json_grammar()),
            "grammar_unsupported_by_installed_vllm",
        )
    elif strategy.strategy_id in {"S2", "S5"}:
        return None, [f"{strategy.strategy_id.lower()}_unsupported_in_offline_llm_worker"]

    return SamplingParams(**base_kwargs), []


def structured_output_candidates(
    json_schema: Optional[Dict[str, Any]] = None,
    grammar: Optional[str] = None,
) -> List[Tuple[str, Dict[str, Any]]]:
    candidates: List[Tuple[str, Dict[str, Any]]] = []
    try:
        from vllm.sampling_params import StructuredOutputsParams

        if json_schema is not None:
            candidates.append(("structured_outputs", {"structured_outputs": StructuredOutputsParams(json=json_schema)}))
        if grammar is not None:
            candidates.append(("structured_outputs_grammar", {"structured_outputs": StructuredOutputsParams(grammar=grammar)}))
    except Exception as exc:
        candidates.append(("structured_outputs_import_failed", {"_error": exc}))
    try:
        from vllm.sampling_params import GuidedDecodingParams

        if json_schema is not None:
            candidates.append(("guided_decoding", {"guided_decoding": GuidedDecodingParams(json=json_schema)}))
        if grammar is not None:
            candidates.append(("guided_decoding_grammar", {"guided_decoding": GuidedDecodingParams(grammar=grammar)}))
    except Exception as exc:
        candidates.append(("guided_decoding_import_failed", {"_error": exc}))
    return candidates


def build_sampling_params_from_candidates(SamplingParams, base_kwargs: Dict[str, Any], candidates: List[Tuple[str, Dict[str, Any]]], fallback_warning: str):
    warnings: List[str] = []
    for name, guided_kwargs in candidates:
        if "_error" in guided_kwargs:
            warnings.append(f"{name}:{type(guided_kwargs['_error']).__name__}:{str(guided_kwargs['_error'])[:160]}")
            continue
        try:
            return SamplingParams(**base_kwargs, **guided_kwargs), warnings
        except Exception as exc:
            warnings.append(f"{name}_param_failed:{type(exc).__name__}:{str(exc)[:160]}")
    return None, warnings or [fallback_warning]


def instantiate_llm(model_dir: Path):
    if str(model_dir) == MODEL_ID or not model_dir.exists():
        raise RuntimeError("PHASE39CQ_SO_LOCAL_MODEL_PATH_REQUIRED")
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


def labels_text(parsed: Dict[str, Any]) -> str:
    pieces = []
    for field in ["objects", "text_like_regions", "spatial_relations", "safe_zone_suggestions"]:
        value = parsed.get(field)
        if isinstance(value, list):
            pieces.append(json.dumps(value, sort_keys=True).lower())
    return " ".join(pieces)


def score_fixture(fixture: Dict[str, Any], parsed: Dict[str, Any], blockers: List[str], warnings: List[str]) -> Dict[str, Any]:
    expected = [str(label).lower() for label in fixture.get("expectedLabels", [])]
    text = labels_text(parsed)
    matched = [label for label in expected if any(part in text for part in label.split())]
    recall = len(matched) / len(expected) if expected else 0.0
    object_count = len(parsed.get("objects", [])) if isinstance(parsed.get("objects"), list) else 0
    text_like_count = len(parsed.get("text_like_regions", [])) if isinstance(parsed.get("text_like_regions"), list) else 0
    safe_zones = parsed.get("safe_zone_suggestions", []) if isinstance(parsed.get("safe_zone_suggestions"), list) else []
    safe_zone_status = "unknown"
    if safe_zones:
        statuses = [item.get("status") for item in safe_zones if isinstance(item, dict)]
        safe_zone_status = "warn" if "warn" in statuses else "block" if "block" in statuses else "pass" if "pass" in statuses else "unknown"
    if fixture.get("riskCategory") == "manual_review_expected":
        uncertainty = parsed.get("uncertainty", {}) if isinstance(parsed.get("uncertainty"), dict) else {}
        if uncertainty.get("manual_review_required"):
            safe_zone_status = "warn"
    broad_region_accuracy = 0.75 if recall >= 0.7 else 0.0
    schema_valid = not any(blocker for blocker in blockers if blocker not in {"object_region_qa_failed", "safe_zone_unknown"})
    qa_blockers = list(blockers)
    if recall < 0.7:
        qa_blockers.append("object_region_qa_failed")
    if safe_zone_status == "unknown":
        qa_blockers.append("safe_zone_unknown")
    status = "passed" if not qa_blockers else "blocked"
    return {
        "fixtureId": fixture["fixtureId"],
        "status": status,
        "runtime": "vllm",
        "parsedJson": "output_json_parse_failed" not in blockers,
        "schemaValid": schema_valid,
        "requiredLabelRecall": recall,
        "broadRegionAccuracy": broad_region_accuracy,
        "safeZoneDecision": safe_zone_status,
        "uncertainty": parsed.get("uncertainty", {}),
        "objectCount": object_count,
        "textLikeRegionCount": text_like_count,
        "blockers": sorted(set(qa_blockers)),
        "warnings": sorted(set(warnings)),
    }


def run_strategy(llm, strategy, fixtures: List[Dict[str, Any]], templates: List[Dict[str, Any]], fixture_dir: Path, schema: Dict[str, Any]) -> Dict[str, Any]:
    if strategy.strategy_id == "S6":
        return {
            "strategyId": strategy.strategy_id,
            "status": "diagnostic_skipped_until_prior_traces_exist",
            "passCounting": False,
            "fixtureResults": [],
            "traceRecords": [],
            "blockers": [],
            "warnings": ["repair_diagnostic_runs_from_prior_trace_records_only"],
        }
    sampling, sampling_warnings = sampling_params_for_strategy(strategy, schema)
    if sampling is None:
        return {
            "strategyId": strategy.strategy_id,
            "status": "skipped",
            "passCounting": strategy.pass_counting,
            "fixtureResults": [],
            "traceRecords": [],
            "blockers": [],
            "warnings": sampling_warnings,
        }
    requests = []
    selected_fixtures = fixtures
    fixture_paths: Dict[str, Path] = {}
    for fixture in selected_fixtures:
        fixture_path = generate_fixture(fixture, fixture_dir / strategy.strategy_id.lower(), strategy.image_max_size)
        fixture_paths[fixture["fixtureId"]] = fixture_path
        template = next(item for item in templates if item["fixtureId"] == fixture["fixtureId"])
        requests.append({
            "prompt": build_prompt(template, fixture, fixture_path, schema, strategy.strategy_id),
            "multi_modal_data": {"image": Image.open(fixture_path)},
        })
    outputs = llm.generate(requests, sampling)
    fixture_results = []
    trace_records = []
    for fixture, output in zip(selected_fixtures, outputs):
        raw_text = output.outputs[0].text if output.outputs else ""
        template = next(item for item in templates if item["fixtureId"] == fixture["fixtureId"])
        parsed, parse_blockers, parse_warnings = parse_candidate_json(raw_text, strategy.strategy_id)
        validation_blockers, validation_warnings = validate_fixture_output(parsed, fixture, MODEL_ID, template["promptTemplateId"]) if parsed else ([], [])
        blockers = parse_blockers + validation_blockers
        warnings = parse_warnings + validation_warnings + sampling_warnings
        fixture_results.append(score_fixture(fixture, parsed, blockers, warnings))
        trace_records.append(trace_record(MODEL_ID, fixture["fixtureId"], strategy.strategy_id, raw_text))
    passed = (
        strategy.pass_counting
        and len(fixture_results) == len(selected_fixtures)
        and all(item["status"] in {"passed", "warning"} for item in fixture_results)
        and all(item.get("schemaValid") for item in fixture_results)
    )
    return {
        "strategyId": strategy.strategy_id,
        "status": "passed" if passed else "blocked",
        "passCounting": strategy.pass_counting,
        "fixtureResults": fixture_results,
        "traceRecords": trace_records,
        "blockers": [] if passed else [f"structured_output_strategy_incomplete:{strategy.strategy_id}"],
        "warnings": sorted(set(sampling_warnings + [warning for item in fixture_results for warning in item.get("warnings", [])])),
    }


def repair_diagnostic_from_traces(strategy_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    prior = [record for result in strategy_results for record in result.get("traceRecords", [])]
    return {
        "strategyId": "S6",
        "status": "diagnostic_only",
        "passCounting": False,
        "fixtureResults": [],
        "traceRecords": [],
        "blockers": [],
        "warnings": [f"repair_diagnostic_trace_count:{len(prior)}", "s6_never_counts_as_phase39cq_so_pass"],
    }


def run_matrix(model_dir: Path, fixtures: List[Dict[str, Any]], templates: List[Dict[str, Any]], fixture_dir: Path) -> Dict[str, Any]:
    candidate_ids = [
        "Qwen/Qwen3-VL-8B-Instruct-FP8",
        "Qwen/Qwen3-VL-4B-Instruct",
        "Qwen/Qwen3-VL-2B-Instruct",
    ]
    schema = compact_schema(candidate_ids)
    with NetworkGuard() as guard:
        import vllm

        llm, llm_warnings, profile = instantiate_llm(model_dir)
        strategy_results = []
        selected_strategy_id = None
        selected_fixture_results: List[Dict[str, Any]] = []
        for strategy in STRATEGIES:
            if strategy.strategy_id == "S6":
                continue
            result = run_strategy(llm, strategy, fixtures, templates, fixture_dir, schema)
            if llm_warnings:
                result["warnings"] = sorted(set(result.get("warnings", []) + llm_warnings))
            strategy_results.append(result)
            if pass_counting_strategy(strategy.strategy_id) and result.get("status") == "passed":
                selected_strategy_id = strategy.strategy_id
                selected_fixture_results = result.get("fixtureResults", [])
                break
        if selected_strategy_id is None:
            strategy_results.append(repair_diagnostic_from_traces(strategy_results))
        if guard.network_attempted:
            raise RuntimeError("PHASE39CQ_SO_RUNTIME_NETWORK_ATTEMPTED")
    return {
        "runtimeStatus": "passed" if selected_strategy_id else "blocked",
        "runtimeVersion": getattr(vllm, "__version__", "unknown"),
        "selectedStrategyId": selected_strategy_id,
        "fixtureResults": selected_fixture_results,
        "strategyResults": strategy_results,
        "traceRecords": [record for result in strategy_results for record in result.get("traceRecords", [])],
        "profile": profile.to_report(),
        "schema": schema,
        "blockers": [] if selected_strategy_id else ["structured_output_strategy_matrix_exhausted"],
        "warnings": [warning for result in strategy_results for warning in result.get("warnings", [])],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--fixture-dir", required=True)
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--fixture-manifest-path", required=True)
    parser.add_argument("--prompt-manifest-path", required=True)
    args = parser.parse_args()

    for key in ["HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE"]:
        if os.environ.get(key) != "1":
            raise RuntimeError(f"{key}=1 is required")
    if os.environ.get("PROVIDER_EXECUTION_ENABLED", "false") != "false":
        raise RuntimeError("PROVIDER_EXECUTION_ENABLED must be false")
    if os.environ.get("REEDITPRO_VLM_STRUCTURED_OUTPUT_MATRIX") != MATRIX_ID:
        raise RuntimeError("REEDITPRO_VLM_STRUCTURED_OUTPUT_MATRIX mismatch")

    fixture_dir = Path(args.fixture_dir)
    fixture_dir.mkdir(parents=True, exist_ok=True)
    fixtures = json.loads(Path(args.fixture_manifest_path).read_text())["specs"]
    templates = json.loads(Path(args.prompt_manifest_path).read_text())["templates"]
    try:
        summary = run_matrix(Path(args.model_dir), fixtures, templates, fixture_dir)
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        text = traceback.format_exc()
        classification = classify_oom(text, enforce_eager=True)
        summary = {
            "runtimeStatus": "blocked",
            "runtimeVersion": None,
            "selectedStrategyId": None,
            "fixtureResults": [],
            "strategyResults": [],
            "traceRecords": [],
            "schema": compact_schema([
                "Qwen/Qwen3-VL-8B-Instruct-FP8",
                "Qwen/Qwen3-VL-4B-Instruct",
                "Qwen/Qwen3-VL-2B-Instruct",
            ]),
            "blockers": [f"structured_output_runtime_failed:{str(exc)[:240]}"],
            "warnings": [classification["safeSummary"]] if classification.get("isCudaOom") else [],
        }
    summary["phase"] = "39C-Q-SO"
    summary["runId"] = args.run_id
    summary["matrixId"] = MATRIX_ID
    summary["strategiesDefined"] = all_strategy_reports()
    summary["schemaVersion"] = SCHEMA_VERSION
    print(json.dumps(summary, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
