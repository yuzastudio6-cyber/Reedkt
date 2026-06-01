#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import inspect
import json
import os
import socket
import sys
import traceback
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont

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


PHASE = "39C-SG"
MATRIX_ID = "phase39c-sglang-generated-vlm-v1"
MODEL_ID = os.environ.get("REEDITPRO_VLM_MODEL_ID", "Qwen/Qwen3-VL-2B-Instruct")
MODEL_REVISION = os.environ.get("REEDITPRO_VLM_MODEL_REVISION", "unknown")
CANDIDATE_IDS = [
    "Qwen/Qwen3-VL-8B-Instruct-FP8",
    "Qwen/Qwen3-VL-4B-Instruct",
    "Qwen/Qwen3-VL-2B-Instruct",
]


class NetworkGuard:
    def __init__(self) -> None:
        self.network_attempted = False
        self._orig_socket = socket.socket
        self._orig_urlopen = urllib.request.urlopen

    def __enter__(self) -> "NetworkGuard":
        guard = self

        class GuardedSocket(socket.socket):
            def connect(self, address):  # type: ignore[override]
                host = address[0] if isinstance(address, tuple) else str(address)
                if host not in {"127.0.0.1", "localhost", "::1"}:
                    guard.network_attempted = True
                    raise RuntimeError(f"PHASE39C_SG_NETWORK_BLOCKED:{host}")
                return super().connect(address)

        def guarded_urlopen(*args, **kwargs):
            guard.network_attempted = True
            raise RuntimeError("PHASE39C_SG_URL_OPEN_BLOCKED")

        socket.socket = GuardedSocket  # type: ignore[assignment]
        urllib.request.urlopen = guarded_urlopen  # type: ignore[assignment]
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        socket.socket = self._orig_socket  # type: ignore[assignment]
        urllib.request.urlopen = self._orig_urlopen  # type: ignore[assignment]


def required_generated_specs() -> List[Dict[str, Any]]:
    return [
        {
            "fixtureId": "generated-object-layout",
            "width": 512,
            "height": 512,
            "expectedLabels": ["laptop", "coffee mug", "plant", "timeline panel"],
            "expectedZones": {"laptop": "center", "coffee mug": "right", "plant": "left", "timeline panel": "bottom"},
            "riskCategory": "required_pass",
        },
        {
            "fixtureId": "generated-ui-safe-zone",
            "width": 512,
            "height": 512,
            "expectedLabels": ["caption conflict", "lower third alert", "toolbar", "preview canvas"],
            "expectedZones": {"caption conflict": "lower_third", "lower third alert": "lower_third", "toolbar": "top", "preview canvas": "center"},
            "riskCategory": "required_pass",
        },
        {
            "fixtureId": "generated-ocr-vlm-comparison",
            "width": 512,
            "height": 512,
            "expectedLabels": ["source label", "export button", "confidence badge", "text-like region"],
            "expectedZones": {"source label": "left", "export button": "right", "confidence badge": "upper_third", "text-like region": "center"},
            "riskCategory": "required_pass",
        },
        {
            "fixtureId": "generated-ambiguous-scene",
            "width": 512,
            "height": 512,
            "expectedLabels": ["ambiguous icon cluster", "manual review"],
            "expectedZones": {"ambiguous icon cluster": "center"},
            "riskCategory": "manual_review_expected",
        },
        {
            "fixtureId": "generated-spatial-reasoning",
            "width": 512,
            "height": 512,
            "expectedLabels": ["left panel", "right card", "center arrow", "top badge"],
            "expectedZones": {"left panel": "left", "right card": "right", "center arrow": "center", "top badge": "top"},
            "riskCategory": "required_pass",
        },
    ]


def draw_generated_fixture(spec: Dict[str, Any], output_dir: Path, max_size: int = 384) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    width = min(int(spec.get("width", 512)), max_size)
    height = min(int(spec.get("height", 512)), max_size)
    image = Image.new("RGB", (width, height), "#f8fafc")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    fid = spec["fixtureId"]

    if fid == "generated-object-layout":
        draw.rectangle([135, 120, 265, 235], fill="#bfdbfe", outline="#1d4ed8", width=4)
        draw.text((165, 165), "LAPTOP", fill="#1e3a8a", font=font)
        draw.ellipse([292, 176, 350, 240], fill="#f97316", outline="#9a3412", width=3)
        draw.text((300, 202), "MUG", fill="#111827", font=font)
        draw.rectangle([32, 150, 80, 230], fill="#22c55e", outline="#14532d", width=3)
        draw.rectangle([0, height - 78, width, height], fill="#111827")
        draw.text((34, height - 52), "TIMELINE PANEL", fill="#f8fafc", font=font)
    elif fid == "generated-ui-safe-zone":
        draw.rectangle([0, 0, width, 56], fill="#0f172a")
        draw.text((24, 18), "TOOLBAR", fill="#f8fafc", font=font)
        draw.rectangle([80, 105, width - 80, 275], fill="#dbeafe", outline="#1d4ed8", width=4)
        draw.text((170, 180), "PREVIEW", fill="#1e40af", font=font)
        draw.rectangle([32, height - 126, width - 32, height - 42], fill="#7f1d1d", outline="#ef4444", width=4)
        draw.text((54, height - 92), "LOWER THIRD ALERT / CAPTION CONFLICT", fill="#fee2e2", font=font)
    elif fid == "generated-ocr-vlm-comparison":
        draw.rectangle([32, 90, 170, 150], fill="#e0f2fe", outline="#0369a1", width=3)
        draw.text((45, 112), "SOURCE", fill="#0c4a6e", font=font)
        draw.rectangle([width - 170, 90, width - 32, 150], fill="#dcfce7", outline="#166534", width=3)
        draw.text((width - 145, 112), "EXPORT", fill="#14532d", font=font)
        draw.rectangle([180, 190, 330, 250], fill="#fef3c7", outline="#92400e", width=3)
        draw.text((195, 212), "TEXT REGION", fill="#78350f", font=font)
        draw.ellipse([width // 2 - 38, 36, width // 2 + 38, 112], fill="#a78bfa", outline="#581c87", width=3)
    elif fid == "generated-ambiguous-scene":
        for offset in [0, 34, 68]:
            draw.polygon([(178 + offset, 180), (208 + offset, 150), (238 + offset, 180), (208 + offset, 212)], fill="#cbd5e1", outline="#475569")
        draw.text((155, 244), "AMBIGUOUS ICON CLUSTER", fill="#111827", font=font)
        draw.text((178, 286), "MANUAL REVIEW", fill="#991b1b", font=font)
    elif fid == "generated-spatial-reasoning":
        draw.rectangle([30, 140, 150, 285], fill="#bbf7d0", outline="#166534", width=3)
        draw.text((55, 205), "LEFT PANEL", fill="#14532d", font=font)
        draw.rectangle([width - 160, 140, width - 40, 285], fill="#fecaca", outline="#991b1b", width=3)
        draw.text((width - 142, 205), "RIGHT CARD", fill="#7f1d1d", font=font)
        draw.polygon([(width // 2 - 45, 205), (width // 2 + 30, 205), (width // 2 + 30, 180), (width // 2 + 75, 225), (width // 2 + 30, 270), (width // 2 + 30, 245), (width // 2 - 45, 245)], fill="#facc15", outline="#854d0e")
        draw.rectangle([width // 2 - 55, 30, width // 2 + 55, 78], fill="#93c5fd", outline="#1d4ed8", width=3)
        draw.text((width // 2 - 34, 48), "TOP BADGE", fill="#1e3a8a", font=font)

    path = output_dir / f"{fid}.png"
    image.save(path)
    return path


def capability_report() -> Dict[str, Any]:
    report: Dict[str, Any] = {
        "phase": PHASE,
        "stageId": "SG0",
        "matrixId": MATRIX_ID,
        "pythonVersion": sys.version,
        "sglangImport": "blocked",
        "torchImport": "blocked",
        "cudaAvailable": False,
        "structuredOutputSupport": {
            "jsonSchema": "unknown",
            "regex": "unknown",
            "ebnf": "unknown",
            "structuralTag": "unknown",
        },
        "blockers": [],
        "warnings": [],
    }
    try:
        import sglang as sgl

        report["sglangImport"] = "passed"
        report["sglangVersion"] = getattr(sgl, "__version__", "unknown")
        report["sglangPackagePath"] = str(Path(inspect.getfile(sgl)).parent)
        report["engineAvailable"] = hasattr(sgl, "Engine")
    except Exception as exc:
        report["blockers"].append(f"sglang_import_failed:{type(exc).__name__}:{str(exc)[:180]}")
    try:
        import torch

        report["torchImport"] = "passed"
        report["torchVersion"] = getattr(torch, "__version__", "unknown")
        report["cudaAvailable"] = bool(torch.cuda.is_available())
        report["cudaDeviceCount"] = int(torch.cuda.device_count()) if torch.cuda.is_available() else 0
        if torch.cuda.is_available():
            report["cudaDeviceName"] = torch.cuda.get_device_name(0)
    except Exception as exc:
        report["warnings"].append(f"torch_import_or_cuda_probe_failed:{type(exc).__name__}:{str(exc)[:180]}")
    return report


def apply_chat_template(processor: Any, messages: List[Dict[str, Any]]) -> str:
    try:
        return processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True, enable_thinking=False)
    except TypeError:
        return processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)


def create_engine(model_dir: Path) -> Tuple[Any, Any, List[str]]:
    if str(model_dir) == MODEL_ID or not model_dir.exists():
        raise RuntimeError("PHASE39C_SG_LOCAL_MODEL_PATH_REQUIRED")
    from sglang import Engine
    from transformers import AutoProcessor

    warnings: List[str] = []
    engine_kwargs: Dict[str, Any] = {
        "model_path": str(model_dir),
        "tokenizer_path": str(model_dir),
        "trust_remote_code": True,
        "context_length": 2048,
        "mem_fraction_static": 0.82,
        "disable_cuda_graph": True,
    }
    try:
        signature = inspect.signature(Engine)
        if not any(param.kind == inspect.Parameter.VAR_KEYWORD for param in signature.parameters.values()):
            accepted = set(signature.parameters)
            dropped = sorted(set(engine_kwargs) - accepted)
            if dropped:
                warnings.extend([f"unsupported_sglang_engine_kwarg_dropped:{key}" for key in dropped])
            engine_kwargs = {key: value for key, value in engine_kwargs.items() if key in accepted}
    except Exception as exc:
        warnings.append(f"sglang_engine_signature_probe_failed:{type(exc).__name__}:{str(exc)[:120]}")
    processor = AutoProcessor.from_pretrained(str(model_dir), trust_remote_code=True, local_files_only=True)
    return Engine(**engine_kwargs), processor, warnings


def sglang_generate(engine: Any, processor: Any, prompt: str, image_path: Optional[Path], schema: Optional[Dict[str, Any]], max_tokens: int) -> Tuple[str, List[str]]:
    warnings: List[str] = []
    content: List[Dict[str, Any]] = []
    image_inputs: Optional[Any] = None
    if image_path is not None:
        content.append({"type": "image", "image": str(image_path)})
    content.append({"type": "text", "text": prompt})
    messages = [{"role": "user", "content": content}]
    text = apply_chat_template(processor, messages)
    if image_path is not None:
        try:
            from qwen_vl_utils import process_vision_info

            image_inputs, _, _ = process_vision_info(messages, return_video_kwargs=True)
        except Exception as exc:
            raise RuntimeError(f"qwen_vision_processing_failed:{type(exc).__name__}:{str(exc)[:180]}") from exc
    sampling_params: Dict[str, Any] = {"temperature": 0.0, "top_p": 1.0, "max_new_tokens": max_tokens}
    if schema is not None:
        sampling_params["json_schema"] = json.dumps(schema, separators=(",", ":"))
    kwargs: Dict[str, Any] = {"prompt": text, "sampling_params": sampling_params}
    if image_inputs is not None:
        kwargs["image_data"] = image_inputs
    try:
        result = engine.generate(**kwargs)
    except TypeError as exc:
        if "json_schema" not in sampling_params:
            raise
        warnings.append(f"sglang_json_schema_sampling_rejected:{type(exc).__name__}:{str(exc)[:160]}")
        sampling_params.pop("json_schema", None)
        result = engine.generate(prompt=text, image_data=image_inputs, sampling_params=sampling_params) if image_inputs is not None else engine.generate(prompt=text, sampling_params=sampling_params)
    return extract_text(result), warnings


def extract_text(result: Any) -> str:
    if isinstance(result, list) and result:
        return extract_text(result[0])
    if isinstance(result, dict):
        for key in ["text", "output_text", "generated_text"]:
            if isinstance(result.get(key), str):
                return result[key]
        if isinstance(result.get("choices"), list) and result["choices"]:
            return extract_text(result["choices"][0])
    if hasattr(result, "text"):
        return str(result.text)
    return str(result or "")


def text_only_schema(level: str) -> Dict[str, Any]:
    if level == "T0":
        return {"type": "object", "additionalProperties": False, "required": ["status"], "properties": {"status": {"type": "string", "enum": ["pass", "fail"]}}}
    if level == "T1":
        return {
            "type": "object",
            "additionalProperties": False,
            "required": ["status", "confidence", "reason"],
            "properties": {
                "status": {"type": "string", "enum": ["pass", "warn", "block"]},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "reason": {"type": "string"},
            },
        }
    return labels_schema(CANDIDATE_IDS)


def run_text_smoke(engine: Any, processor: Any) -> Dict[str, Any]:
    traces: List[Dict[str, Any]] = []
    results: List[Dict[str, Any]] = []
    blockers: List[str] = []
    warnings: List[str] = []
    prompts = {
        "T0": "Return JSON only for this smoke test: {\"status\":\"pass\"}.",
        "T1": "Return JSON only with status pass, confidence 1, and reason generated text-only structured smoke.",
        "T2": f"Return JSON only for fixture_id text-only-sg1, candidate_id {MODEL_ID}, stage_id SG3, schema_version {SCHEMA_VERSION}, labels [], uncertainty object, and blocked_actions [].",
    }
    for level, prompt in prompts.items():
        schema = text_only_schema(level)
        try:
            raw, stage_warnings = sglang_generate(engine, processor, prompt, None, schema, 128)
            warnings.extend(stage_warnings)
            traces.append(trace_record(MODEL_ID, f"text-only-{level.lower()}", "SG1", raw))
            parsed, parse_blockers, _ = parse_direct_json(raw)
            if parse_blockers:
                blockers.extend([f"text_only_{level.lower()}:{item}" for item in parse_blockers])
            results.append({"schemaLevel": level, "status": "passed" if parsed and not parse_blockers else "blocked", "rawOutputSha256": traces[-1]["rawOutputSha256"], "blockers": parse_blockers})
        except Exception as exc:
            blockers.append(f"text_only_{level.lower()}_failed:{type(exc).__name__}:{str(exc)[:180]}")
            results.append({"schemaLevel": level, "status": "blocked", "blockers": [blockers[-1]]})
    return {
        "phase": PHASE,
        "reportId": "phase_39c_sg_text_only_smoke_report",
        "stageId": "SG1",
        "status": "passed" if results and all(item["status"] == "passed" for item in results) else "blocked",
        "results": results,
        "traceRecords": traces,
        "blockers": sorted(set(blockers)),
        "warnings": sorted(set(warnings)),
    }


def prompt_for_stage(stage_id: str, fixture: Dict[str, Any], schema: Optional[Dict[str, Any]]) -> str:
    common = [
        "You are a bounded ReeditPro Phase 39C-SG generated-fixture VLM QA worker.",
        "Use only the supplied deterministic synthetic image.",
        "Do not claim real media, provider calls, tools, URLs, external context, or hidden files.",
        "Use no-thinking behavior and do not reveal reasoning.",
    ]
    fid = fixture["fixtureId"]
    if stage_id == "SG2":
        task = f"Fixture id: {fid}. Describe only visible labels and their broad zones using simple words. This is diagnostic only."
        return " ".join(common + [task])
    if stage_id == "SG3":
        task = f"Fixture id: {fid}. Candidate id: {MODEL_ID}. Return direct JSON only for stage SG3 labels. Include visible expected labels you can see."
    elif stage_id == "SG4":
        task = f"Fixture id: {fid}. Candidate id: {MODEL_ID}. Return direct JSON only for stage SG4 coarse regions. Use only top, bottom, left, right, center, lower_third, upper_third. Do not output boxes."
    elif stage_id == "SG5":
        task = f"Fixture id: {fid}. Candidate id: {MODEL_ID}. Return direct JSON only for stage SG5 safe-zone reasoning. decision must be pass, warn, block, or manual_review; never unknown."
    else:
        raise ValueError(f"unknown stage: {stage_id}")
    schema_text = json.dumps(schema, separators=(",", ":")) if schema else ""
    return " ".join(common + [task, "No markdown, no prose, no code fences.", schema_text])


def image_transport_record(path: Path, fixture: Dict[str, Any]) -> Dict[str, Any]:
    with Image.open(path) as image:
        dimensions = {"width": image.width, "height": image.height}
    data = path.read_bytes()
    return {
        "fixtureId": fixture["fixtureId"],
        "stageId": "SG0",
        "status": "passed" if data and dimensions["width"] > 0 and dimensions["height"] > 0 else "blocked",
        "sizeBytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "dimensions": dimensions,
    }


def run_fixture_stages(engine: Any, processor: Any, fixture: Dict[str, Any], fixture_path: Path, canary: bool) -> Dict[str, Any]:
    traces: List[Dict[str, Any]] = []
    warnings: List[str] = []
    blockers: List[str] = []
    transport = image_transport_record(fixture_path, fixture)
    if transport["status"] != "passed":
        blockers.append("image_transport_sanity_failed")

    raw_freeform, freeform_warnings = sglang_generate(engine, processor, prompt_for_stage("SG2", fixture, None), fixture_path, None, 128)
    warnings.extend(freeform_warnings)
    traces.append(trace_record(MODEL_ID, fixture["fixtureId"], "SG2", raw_freeform))

    label_schema = labels_schema(CANDIDATE_IDS)
    raw_labels, label_warnings = sglang_generate(engine, processor, prompt_for_stage("SG3", fixture, label_schema), fixture_path, label_schema, 192)
    warnings.extend(label_warnings)
    traces.append(trace_record(MODEL_ID, fixture["fixtureId"], "SG3", raw_labels))
    parsed_labels, parse_label_blockers, parse_label_warnings = parse_direct_json(raw_labels)
    label_result, label_blockers, label_stage_warnings = validate_labels(parsed_labels, fixture, MODEL_ID)

    region_schema = regions_schema(CANDIDATE_IDS)
    raw_regions, region_warnings = sglang_generate(engine, processor, prompt_for_stage("SG4", fixture, region_schema), fixture_path, region_schema, 192)
    warnings.extend(region_warnings)
    traces.append(trace_record(MODEL_ID, fixture["fixtureId"], "SG4", raw_regions))
    parsed_regions, parse_region_blockers, parse_region_warnings = parse_direct_json(raw_regions)
    region_result, region_blockers, region_stage_warnings = validate_regions(parsed_regions, fixture, MODEL_ID)

    safe_schema = safe_zone_schema(CANDIDATE_IDS)
    raw_safe, safe_warnings = sglang_generate(engine, processor, prompt_for_stage("SG5", fixture, safe_schema), fixture_path, safe_schema, 192)
    warnings.extend(safe_warnings)
    traces.append(trace_record(MODEL_ID, fixture["fixtureId"], "SG5", raw_safe))
    parsed_safe, parse_safe_blockers, parse_safe_warnings = parse_direct_json(raw_safe)
    safe_result, safe_blockers, safe_stage_warnings = validate_safe_zone(parsed_safe, fixture, MODEL_ID)

    stage_blockers = blockers + parse_label_blockers + label_blockers + parse_region_blockers + region_blockers + parse_safe_blockers + safe_blockers
    stage_warnings = warnings + parse_label_warnings + label_stage_warnings + parse_region_warnings + region_stage_warnings + parse_safe_warnings + safe_stage_warnings
    composed = compose_fixture_result(fixture, label_result, region_result, safe_result, canary=canary)
    composed["blockers"] = sorted(set(composed.get("blockers", []) + stage_blockers))
    composed["warnings"] = sorted(set(composed.get("warnings", []) + stage_warnings))
    composed["transport"] = transport
    composed["stages"] = {
        "SG2": {"status": "diagnostic_only", "traceHash": traces[0]["rawOutputSha256"]},
        "SG3": {"status": "passed" if not parse_label_blockers and not label_blockers else "blocked", "schemaValid": label_result.get("schemaValid"), "labelRecall": label_result.get("labelRecall")},
        "SG4": {"status": "passed" if not parse_region_blockers and not region_blockers else "blocked", "schemaValid": region_result.get("schemaValid"), "coarseRegionAccuracy": region_result.get("coarseRegionAccuracy")},
        "SG5": {"status": "passed" if not parse_safe_blockers and not safe_blockers else "blocked", "schemaValid": safe_result.get("schemaValid"), "decision": safe_result.get("decision")},
        "SG6": {"status": composed["status"]},
    }
    return {
        "fixtureResult": composed,
        "traceRecords": traces,
        "labels": label_result,
        "regions": region_result,
        "safeZone": safe_result,
    }


def average(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def run_matrix(model_dir: Path, output_dir: Path, fixture_dir: Path) -> Dict[str, Any]:
    capability = capability_report()
    if capability.get("blockers"):
        return blocked_summary("sglang_capability_introspection_failed", capability=capability)
    with NetworkGuard() as guard:
        engine, processor, engine_warnings = create_engine(model_dir)
        text_smoke = run_text_smoke(engine, processor)
        canary_results: List[Dict[str, Any]] = []
        original_results: List[Dict[str, Any]] = []
        trace_records: List[Dict[str, Any]] = list(text_smoke.get("traceRecords", []))
        label_reports: List[Dict[str, Any]] = []
        region_reports: List[Dict[str, Any]] = []
        safe_zone_reports: List[Dict[str, Any]] = []
        warnings: List[str] = engine_warnings + text_smoke.get("warnings", [])
        blockers: List[str] = text_smoke.get("blockers", [])

        if text_smoke.get("status") != "passed":
            return blocked_summary("sglang_text_only_smoke_failed", capability=capability, text_smoke=text_smoke, warnings=warnings, blockers=blockers)

        for spec in canary_specs():
            path = draw_canary(spec, fixture_dir / "canaries", max_size=384)
            result = run_fixture_stages(engine, processor, spec, path, canary=True)
            canary_results.append(result["fixtureResult"])
            trace_records.extend(result["traceRecords"])
            label_reports.append({"fixtureId": spec["fixtureId"], **result["labels"]})
            region_reports.append({"fixtureId": spec["fixtureId"], **result["regions"]})
            safe_zone_reports.append({"fixtureId": spec["fixtureId"], **result["safeZone"]})

        canary_label_recall = average([float(item.get("labelRecall", 0)) for item in canary_results])
        canary_region_accuracy = average([float(item.get("coarseRegionAccuracy", 0)) for item in canary_results])
        canaries_passed = all(item.get("status") == "passed" for item in canary_results)

        if canaries_passed:
            for spec in required_generated_specs():
                path = draw_generated_fixture(spec, fixture_dir / "generated-fixtures", 384)
                result = run_fixture_stages(engine, processor, spec, path, canary=False)
                original_results.append(result["fixtureResult"])
                trace_records.extend(result["traceRecords"])
                label_reports.append({"fixtureId": spec["fixtureId"], **result["labels"]})
                region_reports.append({"fixtureId": spec["fixtureId"], **result["regions"]})
                safe_zone_reports.append({"fixtureId": spec["fixtureId"], **result["safeZone"]})

        fixture_label_recall = average([float(item.get("labelRecall", 0)) for item in original_results])
        fixture_region_accuracy = average([float(item.get("coarseRegionAccuracy", 0)) for item in original_results])
        originals_passed = len(original_results) == len(required_generated_specs()) and all(item.get("status") == "passed" for item in original_results)
        if guard.network_attempted:
            raise RuntimeError("PHASE39C_SG_RUNTIME_NETWORK_ATTEMPTED")

    if not canaries_passed:
        blockers.append("sglang_generated_image_perception_canary_failed")
        blockers.append("original_generated_fixtures_not_run_due_canary_failure")
    if canaries_passed and not originals_passed:
        blockers.append("sglang_original_generated_fixture_decomposed_qa_failed")
    status = "passed" if canaries_passed and originals_passed and not blockers else "blocked"
    return {
        "phase": PHASE,
        "runtime": "sglang",
        "runtimeStatus": status,
        "runtimeVersion": capability.get("sglangVersion"),
        "capability": capability,
        "textOnlySmoke": text_smoke,
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
        "blockers": sorted(set(blockers)),
        "warnings": sorted(set(warnings)),
    }


def blocked_summary(reason: str, capability: Optional[Dict[str, Any]] = None, text_smoke: Optional[Dict[str, Any]] = None, warnings: Optional[List[str]] = None, blockers: Optional[List[str]] = None) -> Dict[str, Any]:
    return {
        "phase": PHASE,
        "runtime": "sglang",
        "runtimeStatus": "blocked",
        "runtimeVersion": capability.get("sglangVersion") if capability else None,
        "capability": capability or {},
        "textOnlySmoke": text_smoke or {},
        "canaryResults": [],
        "generatedFixtureResults": [],
        "traceRecords": list((text_smoke or {}).get("traceRecords", [])),
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
        "blockers": sorted(set((blockers or []) + [reason])),
        "warnings": sorted(set(warnings or [])),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--fixture-dir", required=True)
    parser.add_argument("--model-dir", required=True)
    args = parser.parse_args()

    for key in ["HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE"]:
        if os.environ.get(key) != "1":
            raise RuntimeError(f"{key}=1 is required")
    if os.environ.get("PROVIDER_EXECUTION_ENABLED", "false") != "false":
        raise RuntimeError("PROVIDER_EXECUTION_ENABLED must be false")
    if os.environ.get("REEDITPRO_VLM_SGLANG_STRATEGY_MATRIX") != MATRIX_ID:
        raise RuntimeError("REEDITPRO_VLM_SGLANG_STRATEGY_MATRIX mismatch")

    output_dir = Path(args.output_dir)
    fixture_dir = Path(args.fixture_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    fixture_dir.mkdir(parents=True, exist_ok=True)
    try:
        summary = run_matrix(Path(args.model_dir), output_dir, fixture_dir)
    except Exception as exc:
        traceback.print_exc(file=sys.stderr)
        summary = blocked_summary(f"sglang_runtime_failed:{type(exc).__name__}:{str(exc)[:240]}")
    summary["runId"] = args.run_id
    summary["matrixId"] = MATRIX_ID
    summary["schemaVersion"] = SCHEMA_VERSION
    summary["modelId"] = MODEL_ID
    summary["modelRevision"] = MODEL_REVISION
    print(json.dumps(summary, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
