#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
import traceback
from pathlib import Path
from typing import Any, Dict, List

from classify_oom import classify_oom
from structured_output_compat_capabilities import inspect_vllm_structured_output_capabilities
from structured_output_compat_harness import (
    MATRIX_ID,
    compact_vlm_schema,
    run_loopback_text_harness,
    run_offline_image_fixtures,
    run_offline_text_harness,
    schemas,
)


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
generate_fixture = BASE.generate_fixture


def text_harness_passed(openai_report: Dict[str, Any], offline_report: Dict[str, Any]) -> bool:
    return any(report.get("status") == "passed" for report in [openai_report, offline_report])


def schema_level_status(schema_id: str, reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    matching = [
        item
        for report in reports
        for item in report.get("results", [])
        if item.get("schemaId") == schema_id
    ]
    passed = [item for item in matching if item.get("status") == "passed"]
    return {
        "schemaId": schema_id,
        "status": "passed" if passed else "blocked" if matching else "skipped",
        "bestStrategyId": passed[0].get("strategyId") if passed else None,
        "attemptCount": len(matching),
        "blockers": sorted(set(blocker for item in matching for blocker in item.get("blockers", []))),
    }


def image_escalation_allowed(openai_report: Dict[str, Any], offline_report: Dict[str, Any]) -> bool:
    levels = [schema_level_status(schema_id, [openai_report, offline_report]) for schema_id in ["T0", "T1"]]
    return all(item["status"] == "passed" for item in levels)


def generate_fixture_paths(fixtures: List[Dict[str, Any]], fixture_dir: Path) -> Dict[str, Path]:
    paths: Dict[str, Path] = {}
    for fixture in fixtures:
        paths[fixture["fixtureId"]] = generate_fixture(fixture, fixture_dir / "so2", 256)
    return paths


def build_summary(
    run_id: str,
    capability: Dict[str, Any],
    openai_report: Dict[str, Any],
    offline_text_report: Dict[str, Any],
    image_report: Dict[str, Any],
    fixtures: List[Dict[str, Any]],
) -> Dict[str, Any]:
    text_reports = [openai_report, offline_text_report]
    t0 = schema_level_status("T0", text_reports)
    t1 = schema_level_status("T1", text_reports)
    t2 = schema_level_status("T2", text_reports)
    fixture_results = image_report.get("fixtureResults", []) if image_report.get("status") == "passed" else []
    selected_strategy_id = image_report.get("selectedStrategyId") if image_report.get("status") == "passed" else None
    strategy_results = []
    if openai_report.get("results"):
        strategy_results.append({"backend": "openai_loopback", "results": openai_report.get("results")})
    if offline_text_report.get("results"):
        strategy_results.append({"backend": "offline_text", "results": offline_text_report.get("results")})
    strategy_results.extend(image_report.get("strategyResults", []))
    trace_records = []
    trace_records.extend(openai_report.get("traceRecords", []))
    trace_records.extend(offline_text_report.get("traceRecords", []))
    trace_records.extend(image_report.get("traceRecords", []))
    blockers = []
    blockers.extend(openai_report.get("blockers", []))
    blockers.extend(offline_text_report.get("blockers", []))
    blockers.extend(image_report.get("blockers", []))
    if not text_harness_passed(openai_report, offline_text_report):
        blockers.append("text_only_structured_output_harness_failed")
    if image_report.get("status") != "passed":
        blockers.append("generated_fixture_structured_output_qa_failed")
    warnings = []
    warnings.extend(openai_report.get("warnings", []))
    warnings.extend(offline_text_report.get("warnings", []))
    warnings.extend(image_report.get("warnings", []))
    return {
        "phase": "39C-Q-SO2",
        "runId": run_id,
        "matrixId": MATRIX_ID,
        "modelId": MODEL_ID,
        "modelRevision": MODEL_REVISION,
        "runtimeStatus": "passed" if image_report.get("status") == "passed" else "blocked",
        "runtimeVersion": capability.get("vllm", {}).get("version"),
        "selectedStrategyId": selected_strategy_id,
        "textOnlyHarness": {
            "status": "passed" if text_harness_passed(openai_report, offline_text_report) else "blocked",
            "T0": t0,
            "T1": t1,
            "T2": t2,
        },
        "openAiLoopback": openai_report,
        "offlineStructuredOutputs": offline_text_report,
        "imageFixtureEscalation": image_report,
        "fixtureResults": fixture_results,
        "strategyResults": strategy_results,
        "traceRecords": trace_records,
        "schemas": schemas(),
        "compactSchema": compact_vlm_schema(),
        "requiredFixtures": [fixture["fixtureId"] for fixture in fixtures],
        "blockers": sorted(set(blockers)),
        "warnings": sorted(set(warnings)),
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
    if os.environ.get("EXTERNAL_API_CALLS_ENABLED", "false") != "false":
        raise RuntimeError("EXTERNAL_API_CALLS_ENABLED must be false")
    if os.environ.get("LOCAL_OPENAI_LOOPBACK_ONLY", "true") != "true":
        raise RuntimeError("LOCAL_OPENAI_LOOPBACK_ONLY must be true")
    if os.environ.get("REEDITPRO_VLM_STRUCTURED_OUTPUT_COMPAT_MATRIX") != MATRIX_ID:
        raise RuntimeError("REEDITPRO_VLM_STRUCTURED_OUTPUT_COMPAT_MATRIX mismatch")

    fixture_dir = Path(args.fixture_dir)
    fixture_dir.mkdir(parents=True, exist_ok=True)
    fixtures = json.loads(Path(args.fixture_manifest_path).read_text())["specs"]
    capability = inspect_vllm_structured_output_capabilities()
    try:
        model_dir = Path(args.model_dir)
        if not model_dir.exists() or str(model_dir).startswith("Qwen/"):
            raise RuntimeError("PHASE39CQ_SO2_LOCAL_MODEL_PATH_REQUIRED")
        openai_report = run_loopback_text_harness(model_dir, MODEL_ID, model_dir.name)
        offline_text_report = run_offline_text_harness(model_dir, MODEL_ID)
        if image_escalation_allowed(openai_report, offline_text_report):
            fixture_paths = generate_fixture_paths(fixtures, fixture_dir)
            image_report = run_offline_image_fixtures(model_dir, MODEL_ID, fixtures, fixture_paths)
        else:
            image_report = {
                "backend": "not_run",
                "status": "blocked",
                "selectedStrategyId": None,
                "fixtureResults": [],
                "strategyResults": [],
                "traceRecords": [],
                "blockers": ["image_fixture_escalation_blocked_until_text_only_t0_t1_pass"],
                "warnings": [],
            }
        summary = build_summary(args.run_id, capability, openai_report, offline_text_report, image_report, fixtures)
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        text = traceback.format_exc()
        classification = classify_oom(text, enforce_eager=True)
        summary = {
            "phase": "39C-Q-SO2",
            "runId": args.run_id,
            "matrixId": MATRIX_ID,
            "modelId": MODEL_ID,
            "modelRevision": MODEL_REVISION,
            "runtimeStatus": "blocked",
            "runtimeVersion": capability.get("vllm", {}).get("version"),
            "selectedStrategyId": None,
            "textOnlyHarness": {"status": "blocked"},
            "openAiLoopback": {"status": "blocked", "blockers": ["not_run_due_unhandled_error"]},
            "offlineStructuredOutputs": {"status": "blocked", "blockers": ["not_run_due_unhandled_error"]},
            "imageFixtureEscalation": {"status": "blocked", "blockers": ["not_run_due_unhandled_error"]},
            "fixtureResults": [],
            "strategyResults": [],
            "traceRecords": [],
            "schemas": schemas(),
            "compactSchema": compact_vlm_schema(),
            "blockers": [f"structured_output_compat_runtime_failed:{type(exc).__name__}:{str(exc)[:240]}"],
            "warnings": [classification["safeSummary"]] if classification.get("isCudaOom") else [],
        }
    print(json.dumps(summary, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
