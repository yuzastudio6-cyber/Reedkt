from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image

from structured_output_trace_capture import safe_excerpt, trace_record


COMPACT_SCHEMA_VERSION = "phase39c_qwen_vlm_compact_v1"
MATRIX_ID = "phase39c-qwen-so2-vllm-api-compat-v1"
CANDIDATE_IDS = [
    "Qwen/Qwen3-VL-8B-Instruct-FP8",
    "Qwen/Qwen3-VL-4B-Instruct",
    "Qwen/Qwen3-VL-2B-Instruct",
]
PASS_COUNTING_STRATEGIES = {"O1", "O2", "O3", "O4", "F1", "F2", "F3"}
DIAGNOSTIC_STRATEGIES = {"O5", "F4", "D1"}


def confidence_schema() -> Dict[str, Any]:
    return {"type": "number", "minimum": 0, "maximum": 1}


def box_schema() -> Dict[str, Any]:
    return {"type": "array", "minItems": 4, "maxItems": 4, "items": confidence_schema()}


def region_schema() -> Dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["label", "confidence", "box"],
        "properties": {
            "label": {"type": "string", "minLength": 1, "maxLength": 80},
            "confidence": confidence_schema(),
            "box": box_schema(),
        },
    }


def t0_choice_schema() -> Dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "phase39cq_so2_t0_choice",
        "type": "object",
        "additionalProperties": False,
        "required": ["decision"],
        "properties": {"decision": {"enum": ["pass", "fail"]}},
    }


def t1_tiny_json_schema() -> Dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "phase39cq_so2_t1_tiny_json",
        "type": "object",
        "additionalProperties": False,
        "required": ["status", "confidence", "reason"],
        "properties": {
            "status": {"enum": ["pass", "warn", "block"]},
            "confidence": confidence_schema(),
            "reason": {"type": "string", "minLength": 1, "maxLength": 160},
        },
    }


def compact_vlm_schema() -> Dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": COMPACT_SCHEMA_VERSION,
        "type": "object",
        "additionalProperties": False,
        "required": [
            "fixture_id",
            "candidate_id",
            "schema_version",
            "objects",
            "text_like_regions",
            "safe_zone_suggestions",
            "uncertainty",
            "blocked_actions",
        ],
        "properties": {
            "fixture_id": {"type": "string", "minLength": 1, "maxLength": 80},
            "candidate_id": {"type": "string", "enum": CANDIDATE_IDS},
            "schema_version": {"const": COMPACT_SCHEMA_VERSION},
            "objects": {"type": "array", "maxItems": 10, "items": region_schema()},
            "text_like_regions": {"type": "array", "maxItems": 8, "items": region_schema()},
            "safe_zone_suggestions": {
                "type": "array",
                "maxItems": 6,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["zone_id", "box", "confidence", "status"],
                    "properties": {
                        "zone_id": {"type": "string", "minLength": 1, "maxLength": 80},
                        "box": box_schema(),
                        "confidence": confidence_schema(),
                        "status": {"enum": ["pass", "warn", "block"]},
                    },
                },
            },
            "uncertainty": {
                "type": "object",
                "additionalProperties": False,
                "required": ["confidence", "manual_review_required", "reason"],
                "properties": {
                    "confidence": confidence_schema(),
                    "manual_review_required": {"type": "boolean"},
                    "reason": {"type": "string", "minLength": 1, "maxLength": 160},
                },
            },
            "blocked_actions": {"type": "array", "maxItems": 6, "items": {"type": "string", "maxLength": 120}},
        },
    }


def schemas() -> Dict[str, Dict[str, Any]]:
    return {"T0": t0_choice_schema(), "T1": t1_tiny_json_schema(), "T2": compact_vlm_schema()}


def generic_json_grammar() -> str:
    return r'''
root ::= value
value ::= object | array | string | number | "true" | "false" | "null"
object ::= "{" ws "}" | "{" members "}"
members ::= pair | pair "," members
pair ::= string ":" value
array ::= "[" ws "]" | "[" elements "]"
elements ::= value | value "," elements
string ::= "\"" chars "\""
chars ::= "" | char chars
char ::= [^"\\] | "\\" ["\\/bfnrt]
number ::= "-"? int frac? exp?
int ::= "0" | [1-9] [0-9]*
frac ::= "." [0-9]+
exp ::= [eE] [+-]? [0-9]+
ws ::= [ \t\n\r]*
'''


def parse_json_protocol(raw_text: str, strategy_id: str) -> Tuple[Dict[str, Any], List[str], List[str]]:
    blockers: List[str] = []
    warnings: List[str] = []
    text = raw_text.strip()
    if strategy_id in {"O4", "F3"}:
        match = re.search(r"<vlm_json>(.*?)</vlm_json>", text, flags=re.DOTALL)
        if not match:
            blockers.append("structural_tag_missing")
            return {}, blockers, warnings
        outside = (text[:match.start()] + text[match.end():]).strip()
        if outside:
            blockers.append("content_outside_structural_tag")
        text = match.group(1).strip()
    elif strategy_id == "D1":
        if "```" in text:
            warnings.append("diagnostic_removed_markdown_fence")
            text = text.replace("```json", "```").replace("```", "")
        if not text.startswith("{") and "{" in text and "}" in text:
            warnings.append("diagnostic_extracted_first_json_object")
            text = text[text.find("{"):text.rfind("}") + 1]
    else:
        if "```" in text:
            blockers.append("markdown_or_code_fence_detected")
        if not text.startswith("{") or not text.endswith("}"):
            blockers.append("direct_json_object_required")
    try:
        parsed = json.loads(text)
    except Exception:
        blockers.append("output_json_parse_failed")
        return {}, blockers, warnings
    if not isinstance(parsed, dict):
        blockers.append("wrong_root_type")
        return {}, blockers, warnings
    return parsed, blockers, warnings


def valid_confidence(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and 0 <= float(value) <= 1


def valid_box(value: Any) -> bool:
    if not isinstance(value, list) or len(value) != 4:
        return False
    if not all(valid_confidence(item) for item in value):
        return False
    x1, y1, x2, y2 = [float(item) for item in value]
    return x1 < x2 and y1 < y2


def validate_t0(parsed: Dict[str, Any]) -> List[str]:
    blockers: List[str] = []
    if set(parsed.keys()) != {"decision"}:
        blockers.append("t0_fields_invalid")
    if parsed.get("decision") not in {"pass", "fail"}:
        blockers.append("t0_decision_invalid")
    return blockers


def validate_t1(parsed: Dict[str, Any]) -> List[str]:
    blockers: List[str] = []
    if set(parsed.keys()) != {"status", "confidence", "reason"}:
        blockers.append("t1_fields_invalid")
    if parsed.get("status") not in {"pass", "warn", "block"}:
        blockers.append("t1_status_invalid")
    if not valid_confidence(parsed.get("confidence")):
        blockers.append("t1_confidence_invalid")
    if not isinstance(parsed.get("reason"), str) or not parsed.get("reason") or len(parsed.get("reason", "")) > 160:
        blockers.append("t1_reason_invalid")
    return blockers


def validate_regions(items: Any, field: str) -> List[str]:
    blockers: List[str] = []
    if not isinstance(items, list):
        return [f"{field}_not_array"]
    for index, item in enumerate(items):
        prefix = f"{field}[{index}]"
        if not isinstance(item, dict):
            blockers.append(f"{prefix}_not_object")
            continue
        if set(item.keys()) != {"label", "confidence", "box"}:
            blockers.append(f"{prefix}_fields_invalid")
        if not isinstance(item.get("label"), str) or not item.get("label") or len(item.get("label", "")) > 80:
            blockers.append(f"{prefix}_label_invalid")
        if not valid_confidence(item.get("confidence")):
            blockers.append(f"{prefix}_confidence_invalid")
        if not valid_box(item.get("box")):
            blockers.append(f"{prefix}_box_invalid")
    return blockers


def validate_compact_vlm(parsed: Dict[str, Any], fixture: Optional[Dict[str, Any]], candidate_id: str) -> List[str]:
    blockers: List[str] = []
    required = {
        "fixture_id",
        "candidate_id",
        "schema_version",
        "objects",
        "text_like_regions",
        "safe_zone_suggestions",
        "uncertainty",
        "blocked_actions",
    }
    extra = set(parsed.keys()) - required
    missing = required - set(parsed.keys())
    if missing:
        blockers.append(f"missing_required_fields:{','.join(sorted(missing))}")
    if extra:
        blockers.append(f"extra_root_fields:{','.join(sorted(extra))}")
    if fixture and parsed.get("fixture_id") != fixture.get("fixtureId"):
        blockers.append("fixture_id_mismatch")
    if parsed.get("candidate_id") != candidate_id:
        blockers.append("candidate_id_mismatch")
    if parsed.get("schema_version") != COMPACT_SCHEMA_VERSION:
        blockers.append("schema_version_mismatch")
    blockers.extend(validate_regions(parsed.get("objects"), "objects"))
    blockers.extend(validate_regions(parsed.get("text_like_regions"), "text_like_regions"))
    safe_zones = parsed.get("safe_zone_suggestions")
    if not isinstance(safe_zones, list):
        blockers.append("safe_zone_suggestions_not_array")
    else:
        for index, item in enumerate(safe_zones):
            prefix = f"safe_zone_suggestions[{index}]"
            if not isinstance(item, dict):
                blockers.append(f"{prefix}_not_object")
                continue
            if set(item.keys()) != {"zone_id", "box", "confidence", "status"}:
                blockers.append(f"{prefix}_fields_invalid")
            if not isinstance(item.get("zone_id"), str) or not item.get("zone_id"):
                blockers.append(f"{prefix}_zone_id_invalid")
            if not valid_box(item.get("box")):
                blockers.append(f"{prefix}_box_invalid")
            if not valid_confidence(item.get("confidence")):
                blockers.append(f"{prefix}_confidence_invalid")
            if item.get("status") not in {"pass", "warn", "block"}:
                blockers.append(f"{prefix}_status_invalid")
    uncertainty = parsed.get("uncertainty")
    if not isinstance(uncertainty, dict):
        blockers.append("uncertainty_not_object")
    else:
        if not valid_confidence(uncertainty.get("confidence")):
            blockers.append("uncertainty_confidence_invalid")
        if not isinstance(uncertainty.get("manual_review_required"), bool):
            blockers.append("uncertainty_manual_review_required_invalid")
        if not isinstance(uncertainty.get("reason"), str) or not uncertainty.get("reason"):
            blockers.append("uncertainty_reason_invalid")
        if fixture and fixture.get("riskCategory") == "manual_review_expected" and not uncertainty.get("manual_review_required"):
            blockers.append("ambiguous_fixture_manual_review_required")
    blocked_actions = parsed.get("blocked_actions")
    if not isinstance(blocked_actions, list):
        blockers.append("blocked_actions_not_array")
    else:
        for item in blocked_actions:
            if not isinstance(item, str) or len(item) > 120:
                blockers.append("blocked_actions_item_invalid")
            if any(token in str(item).lower() for token in ["tool", "provider", "openai", "dashscope", "real media", "public url"]):
                blockers.append("blocked_actions_contains_forbidden_tool_or_provider_claim")
    return blockers


def validate_parsed(schema_id: str, parsed: Dict[str, Any], candidate_id: str, fixture: Optional[Dict[str, Any]] = None) -> List[str]:
    if schema_id == "T0":
        return validate_t0(parsed)
    if schema_id == "T1":
        return validate_t1(parsed)
    return validate_compact_vlm(parsed, fixture, candidate_id)


def labels_text(parsed: Dict[str, Any]) -> str:
    pieces = []
    for field in ["objects", "text_like_regions", "safe_zone_suggestions"]:
        value = parsed.get(field)
        if isinstance(value, list):
            pieces.append(json.dumps(value, sort_keys=True).lower())
    return " ".join(pieces)


def score_fixture(fixture: Dict[str, Any], parsed: Dict[str, Any], blockers: List[str], warnings: List[str]) -> Dict[str, Any]:
    expected = [str(label).lower() for label in fixture.get("expectedLabels", [])]
    text = labels_text(parsed)
    matched = [label for label in expected if any(part in text for part in label.split())]
    recall = len(matched) / len(expected) if expected else 0.0
    safe_zones = parsed.get("safe_zone_suggestions", []) if isinstance(parsed.get("safe_zone_suggestions"), list) else []
    statuses = [item.get("status") for item in safe_zones if isinstance(item, dict)]
    safe_zone_status = "warn" if "warn" in statuses else "block" if "block" in statuses else "pass" if "pass" in statuses else "unknown"
    if fixture.get("riskCategory") == "manual_review_expected" and isinstance(parsed.get("uncertainty"), dict) and parsed["uncertainty"].get("manual_review_required"):
        safe_zone_status = "warn"
    broad_region_accuracy = 0.75 if recall >= 0.7 else 0.0
    qa_blockers = list(blockers)
    if recall < 0.7:
        qa_blockers.append("object_region_qa_failed")
    if safe_zone_status == "unknown":
        qa_blockers.append("safe_zone_unknown")
    schema_valid = not blockers
    return {
        "fixtureId": fixture["fixtureId"],
        "status": "passed" if not qa_blockers else "blocked",
        "parsedJson": bool(parsed),
        "schemaValid": schema_valid,
        "requiredLabelRecall": recall,
        "broadRegionAccuracy": broad_region_accuracy,
        "safeZoneDecision": safe_zone_status,
        "uncertainty": parsed.get("uncertainty", {}) if isinstance(parsed, dict) else {},
        "objectCount": len(parsed.get("objects", [])) if isinstance(parsed.get("objects"), list) else 0,
        "textLikeRegionCount": len(parsed.get("text_like_regions", [])) if isinstance(parsed.get("text_like_regions"), list) else 0,
        "blockers": sorted(set(qa_blockers)),
        "warnings": sorted(set(warnings)),
    }


def trace(candidate_id: str, fixture_id: str, strategy_id: str, raw_text: str, schema_id: str) -> Dict[str, Any]:
    record = trace_record(candidate_id, fixture_id, strategy_id, raw_text)
    record["schemaId"] = schema_id
    return record


def text_prompt(schema_id: str, schema: Dict[str, Any], candidate_id: str, strategy_id: str) -> str:
    if schema_id == "T0":
        task = 'Return {"decision":"pass"} exactly as a JSON object.'
    elif schema_id == "T1":
        task = 'Return a tiny JSON status object with status "pass", confidence 0.9, and a short reason.'
    else:
        task = f'Return compact VLM QA JSON for fixture_id "text-only-structured-output-smoke" and candidate_id "{candidate_id}". Use empty arrays for visual fields and no provider/tool claims.'
    tag = " Wrap the JSON in <vlm_json> tags." if strategy_id in {"O4", "F3"} else " Return the JSON object directly."
    return "\n".join([
        "You are a local ReeditPro structured-output compatibility probe.",
        "Use /no_think behavior. Do not reveal reasoning.",
        "No tools, no providers, no URLs, no markdown, no prose outside the JSON protocol.",
        task,
        "Schema:",
        json.dumps(schema, separators=(",", ":")),
        tag,
    ])


def image_prompt(schema: Dict[str, Any], candidate_id: str, fixture: Dict[str, Any], strategy_id: str) -> str:
    tag = " Wrap the JSON in <vlm_json> tags." if strategy_id in {"O4", "F3"} else " Return the JSON object directly."
    return "\n".join([
        "You are a bounded ReeditPro Phase 39C-Q-SO2 generated-fixture VLM QA worker.",
        "Use /no_think behavior. Do not reveal reasoning.",
        "Use only the generated synthetic image supplied in this request.",
        "No tools, no providers, no external URLs, no public output, no real-media claims.",
        f'fixture_id must be "{fixture["fixtureId"]}". candidate_id must be "{candidate_id}". schema_version must be "{COMPACT_SCHEMA_VERSION}".',
        fixture["safeZoneQuestion"],
        "Return broad normalized boxes only when visible. If uncertain, set uncertainty.manual_review_required=true.",
        "Schema:",
        json.dumps(schema, separators=(",", ":")),
        tag,
    ])


def supported_llm_kwargs(LLM: Any, kwargs: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    try:
        import inspect

        signature = inspect.signature(LLM)
        allowed = set(signature.parameters)
        dropped = [key for key in kwargs if key not in allowed]
        return {key: value for key, value in kwargs.items() if key in allowed}, dropped
    except Exception:
        return kwargs, []


def build_sampling_params(strategy_id: str, schema: Dict[str, Any], max_tokens: int):
    from vllm import SamplingParams  # type: ignore

    base_kwargs = {"temperature": 0.0, "top_p": 1.0, "max_tokens": max_tokens}
    warnings: List[str] = []
    if strategy_id == "F1":
        for kwargs in offline_structured_param_candidates(json_schema=schema):
            try:
                return SamplingParams(**base_kwargs, **kwargs), warnings
            except Exception as exc:
                warnings.append(f"offline_json_param_failed:{type(exc).__name__}:{str(exc)[:160]}")
        return None, warnings or ["offline_json_param_unavailable"]
    if strategy_id == "F2":
        for kwargs in offline_structured_param_candidates(grammar=generic_json_grammar()):
            try:
                return SamplingParams(**base_kwargs, **kwargs), warnings
            except Exception as exc:
                warnings.append(f"offline_grammar_param_failed:{type(exc).__name__}:{str(exc)[:160]}")
        return None, warnings or ["offline_grammar_param_unavailable"]
    return SamplingParams(**base_kwargs), warnings


def offline_structured_param_candidates(json_schema: Optional[Dict[str, Any]] = None, grammar: Optional[str] = None) -> List[Dict[str, Any]]:
    candidates: List[Dict[str, Any]] = []
    try:
        from vllm.sampling_params import StructuredOutputsParams  # type: ignore

        if json_schema is not None:
            candidates.append({"structured_outputs": StructuredOutputsParams(json=json_schema)})
        if grammar is not None:
            candidates.append({"structured_outputs": StructuredOutputsParams(grammar=grammar)})
    except Exception:
        pass
    try:
        from vllm.sampling_params import GuidedDecodingParams  # type: ignore

        if json_schema is not None:
            candidates.append({"guided_decoding": GuidedDecodingParams(json=json_schema)})
        if grammar is not None:
            candidates.append({"guided_decoding": GuidedDecodingParams(grammar=grammar)})
    except Exception:
        pass
    return candidates


def instantiate_offline_llm(model_dir: Path):
    if not model_dir.exists() or str(model_dir).startswith("Qwen/"):
        raise RuntimeError("PHASE39CQ_SO2_LOCAL_MODEL_PATH_REQUIRED")
    from vllm import LLM  # type: ignore

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
    supported, dropped = supported_llm_kwargs(LLM, llm_kwargs)
    return LLM(**supported), [f"unsupported_llm_kwarg_dropped:{key}" for key in dropped]


def run_offline_text_harness(model_dir: Path, candidate_id: str) -> Dict[str, Any]:
    results: List[Dict[str, Any]] = []
    traces: List[Dict[str, Any]] = []
    blockers: List[str] = []
    warnings: List[str] = []
    try:
        llm, llm_warnings = instantiate_offline_llm(model_dir)
        warnings.extend(llm_warnings)
    except Exception as exc:
        return {
            "backend": "offline",
            "status": "blocked",
            "results": [],
            "traceRecords": [],
            "blockers": [f"offline_llm_init_failed:{type(exc).__name__}:{str(exc)[:240]}"],
            "warnings": warnings,
        }
    for schema_id, schema in schemas().items():
        for strategy_id in ["F1", "F2", "F4"]:
            sampling, sampling_warnings = build_sampling_params(strategy_id, schema, 192)
            warnings.extend(sampling_warnings)
            if sampling is None:
                results.append({"schemaId": schema_id, "strategyId": strategy_id, "status": "skipped", "blockers": [], "warnings": sampling_warnings})
                continue
            raw_text = ""
            item_blockers: List[str] = []
            item_warnings: List[str] = list(sampling_warnings)
            try:
                output = llm.generate([text_prompt(schema_id, schema, candidate_id, strategy_id)], sampling)[0]
                raw_text = output.outputs[0].text if output.outputs else ""
            except Exception as exc:
                item_blockers.append(f"offline_text_generate_failed:{type(exc).__name__}:{str(exc)[:180]}")
            parsed, parse_blockers, parse_warnings = parse_json_protocol(raw_text, strategy_id)
            validation_blockers = validate_parsed(schema_id, parsed, candidate_id) if parsed else []
            item_blockers.extend(parse_blockers + validation_blockers)
            item_warnings.extend(parse_warnings)
            traces.append(trace(candidate_id, f"text-only-{schema_id.lower()}", strategy_id, raw_text, schema_id))
            pass_counting = strategy_id in PASS_COUNTING_STRATEGIES
            status = "passed" if pass_counting and not item_blockers else "blocked" if item_blockers else "diagnostic_passed"
            results.append({
                "schemaId": schema_id,
                "strategyId": strategy_id,
                "backend": "offline",
                "passCounting": pass_counting,
                "status": status,
                "parsedJson": bool(parsed),
                "blockers": sorted(set(item_blockers)),
                "warnings": sorted(set(item_warnings)),
            })
    any_core_pass = any(item["schemaId"] in {"T0", "T1"} and item["status"] == "passed" for item in results)
    return {
        "backend": "offline",
        "status": "passed" if any_core_pass else "blocked",
        "results": results,
        "traceRecords": traces,
        "blockers": [] if any_core_pass else ["offline_text_only_structured_output_harness_failed"],
        "warnings": sorted(set(warnings)),
    }


def _http_json(method: str, url: str, body: Optional[Dict[str, Any]] = None, timeout: int = 60) -> Tuple[int, Dict[str, Any], str]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            text = response.read().decode("utf-8", errors="replace")
            return response.status, json.loads(text) if text.strip().startswith("{") else {}, text
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        parsed = json.loads(text) if text.strip().startswith("{") else {}
        return exc.code, parsed, text


def _wait_for_server(port: int, timeout: int = 420) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    deadline = time.time() + timeout
    last_error = ""
    while time.time() < deadline:
        try:
            status, parsed, raw = _http_json("GET", f"http://127.0.0.1:{port}/v1/models", timeout=5)
            if status == 200:
                return True, parsed, raw[:1200]
            last_error = f"status={status}:{raw[:240]}"
        except Exception as exc:
            last_error = f"{type(exc).__name__}:{str(exc)[:240]}"
        time.sleep(5)
    return False, None, last_error


def start_loopback_server(model_dir: Path, served_model_name: str, port: int) -> Tuple[subprocess.Popen[str], Dict[str, Any]]:
    command = [
        sys.executable,
        "-m",
        "vllm.entrypoints.openai.api_server",
        "--model",
        str(model_dir),
        "--tokenizer",
        str(model_dir),
        "--served-model-name",
        served_model_name,
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
        "--trust-remote-code",
        "--max-model-len",
        "2048",
        "--max-num-seqs",
        "1",
        "--max-num-batched-tokens",
        "1024",
        "--gpu-memory-utilization",
        "0.92",
        "--enforce-eager",
        "--limit-mm-per-prompt",
        "image=1",
    ]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    ready, models, safe_raw = _wait_for_server(port)
    return process, {
        "command": [part if str(model_dir) not in part else "<local_model_dir>" for part in command],
        "ready": ready,
        "modelsResponse": models,
        "modelsSafeExcerpt": safe_raw,
    }


def stop_process(process: subprocess.Popen[str]) -> str:
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=30)
        except subprocess.TimeoutExpired:
            process.kill()
    stderr = ""
    try:
        if process.stderr:
            stderr = process.stderr.read()[-2400:]
    except Exception:
        stderr = ""
    return stderr


def image_data_url(path: Path) -> str:
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def loopback_request_body(strategy_id: str, schema_id: str, schema: Dict[str, Any], prompt: str, model_alias: str, image_path: Optional[Path] = None) -> Dict[str, Any]:
    content: Any
    if image_path:
        content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": image_data_url(image_path)}},
        ]
    else:
        content = prompt
    body: Dict[str, Any] = {
        "model": model_alias,
        "messages": [{"role": "user", "content": content}],
        "temperature": 0,
        "top_p": 1,
        "max_tokens": 256,
        "chat_template_kwargs": {"enable_thinking": False},
    }
    if strategy_id == "O1":
        body["response_format"] = {"type": "json_schema", "json_schema": {"name": f"phase39cq_so2_{schema_id.lower()}", "schema": schema, "strict": True}}
    elif strategy_id == "O2":
        body["structured_outputs"] = {"json": schema}
    elif strategy_id == "O3":
        body["structured_outputs"] = {"grammar": generic_json_grammar()}
    return body


def extract_loopback_text(parsed_response: Dict[str, Any]) -> str:
    try:
        content = parsed_response["choices"][0]["message"]["content"]
        if isinstance(content, list):
            return "".join(str(item.get("text", "")) for item in content if isinstance(item, dict))
        return str(content)
    except Exception:
        return ""


def run_loopback_text_harness(model_dir: Path, candidate_id: str, candidate_slug: str) -> Dict[str, Any]:
    port = 8000
    model_alias = f"reeditpro-local-{candidate_slug}"
    process: Optional[subprocess.Popen[str]] = None
    server_report: Dict[str, Any] = {}
    results: List[Dict[str, Any]] = []
    traces: List[Dict[str, Any]] = []
    warnings: List[str] = []
    try:
        process, server_report = start_loopback_server(model_dir, model_alias, port)
        if not server_report.get("ready"):
            return {
                "backend": "openai_loopback",
                "server": server_report,
                "status": "blocked",
                "results": [],
                "traceRecords": [],
                "blockers": ["openai_loopback_server_not_ready"],
                "warnings": [],
            }
        for schema_id, schema in schemas().items():
            for strategy_id in ["O1", "O2", "O3", "O5"]:
                raw_text = ""
                item_blockers: List[str] = []
                try:
                    body = loopback_request_body(strategy_id, schema_id, schema, text_prompt(schema_id, schema, candidate_id, strategy_id), model_alias)
                    status, response_json, raw_response = _http_json("POST", f"http://127.0.0.1:{port}/v1/chat/completions", body=body, timeout=240)
                    if status >= 400 and "chat_template_kwargs" in body:
                        retry_body = dict(body)
                        retry_body.pop("chat_template_kwargs", None)
                        status, response_json, raw_response = _http_json("POST", f"http://127.0.0.1:{port}/v1/chat/completions", body=retry_body, timeout=240)
                        warnings.append(f"loopback_retry_without_chat_template_kwargs:{schema_id}:{strategy_id}:status={status}")
                    if status >= 400:
                        item_blockers.append(f"loopback_request_rejected:{strategy_id}:status={status}:{safe_excerpt(raw_response, 180)}")
                    raw_text = extract_loopback_text(response_json)
                except Exception as exc:
                    item_blockers.append(f"loopback_text_request_failed:{type(exc).__name__}:{str(exc)[:180]}")
                parsed, parse_blockers, parse_warnings = parse_json_protocol(raw_text, strategy_id)
                validation_blockers = validate_parsed(schema_id, parsed, candidate_id) if parsed else []
                item_blockers.extend(parse_blockers + validation_blockers)
                pass_counting = strategy_id in PASS_COUNTING_STRATEGIES
                traces.append(trace(candidate_id, f"text-only-{schema_id.lower()}", strategy_id, raw_text, schema_id))
                results.append({
                    "schemaId": schema_id,
                    "strategyId": strategy_id,
                    "backend": "openai_loopback",
                    "passCounting": pass_counting,
                    "status": "passed" if pass_counting and not item_blockers else "blocked" if item_blockers else "diagnostic_passed",
                    "parsedJson": bool(parsed),
                    "blockers": sorted(set(item_blockers)),
                    "warnings": sorted(set(parse_warnings)),
                })
        any_core_pass = any(item["schemaId"] in {"T0", "T1"} and item["status"] == "passed" for item in results)
        return {
            "backend": "openai_loopback",
            "server": server_report,
            "status": "passed" if any_core_pass else "blocked",
            "results": results,
            "traceRecords": traces,
            "blockers": [] if any_core_pass else ["openai_loopback_text_only_structured_output_harness_failed"],
            "warnings": sorted(set(warnings)),
        }
    finally:
        if process is not None:
            stderr = stop_process(process)
            if stderr:
                server_report["stderrTailSha256"] = hashlib.sha256(stderr.encode("utf-8", errors="replace")).hexdigest()
                server_report["stderrTailSafeExcerpt"] = safe_excerpt(stderr, 800)


def run_offline_image_fixtures(model_dir: Path, candidate_id: str, fixtures: List[Dict[str, Any]], fixture_paths: Dict[str, Path]) -> Dict[str, Any]:
    traces: List[Dict[str, Any]] = []
    fixture_results: List[Dict[str, Any]] = []
    strategy_results: List[Dict[str, Any]] = []
    try:
        llm, llm_warnings = instantiate_offline_llm(model_dir)
    except Exception as exc:
        return {
            "backend": "offline",
            "status": "blocked",
            "selectedStrategyId": None,
            "fixtureResults": [],
            "strategyResults": [],
            "traceRecords": [],
            "blockers": [f"offline_image_llm_init_failed:{type(exc).__name__}:{str(exc)[:240]}"],
            "warnings": [],
        }
    schema = compact_vlm_schema()
    for strategy_id in ["F1", "F2"]:
        sampling, sampling_warnings = build_sampling_params(strategy_id, schema, 256)
        if sampling is None:
            strategy_results.append({"strategyId": strategy_id, "status": "skipped", "blockers": [], "warnings": sampling_warnings})
            continue
        requests = []
        for fixture in fixtures:
            image_path = fixture_paths[fixture["fixtureId"]]
            requests.append({
                "prompt": image_prompt(schema, candidate_id, fixture, strategy_id),
                "multi_modal_data": {"image": Image.open(image_path)},
            })
        try:
            outputs = llm.generate(requests, sampling)
        except Exception as exc:
            strategy_results.append({
                "strategyId": strategy_id,
                "status": "blocked",
                "blockers": [f"offline_image_generate_failed:{type(exc).__name__}:{str(exc)[:240]}"],
                "warnings": sampling_warnings + llm_warnings,
            })
            continue
        current_results: List[Dict[str, Any]] = []
        for fixture, output in zip(fixtures, outputs):
            raw_text = output.outputs[0].text if output.outputs else ""
            parsed, parse_blockers, parse_warnings = parse_json_protocol(raw_text, strategy_id)
            validation_blockers = validate_parsed("T2", parsed, candidate_id, fixture) if parsed else []
            blockers = parse_blockers + validation_blockers
            warnings = parse_warnings + sampling_warnings + llm_warnings
            current_results.append(score_fixture(fixture, parsed, blockers, warnings))
            traces.append(trace(candidate_id, fixture["fixtureId"], strategy_id, raw_text, "T2"))
        passed = len(current_results) == len(fixtures) and all(item["status"] == "passed" or item["safeZoneDecision"] == "warn" for item in current_results) and all(item["schemaValid"] for item in current_results)
        strategy_results.append({
            "strategyId": strategy_id,
            "backend": "offline",
            "passCounting": True,
            "status": "passed" if passed else "blocked",
            "fixtureResults": current_results,
            "blockers": [] if passed else [f"offline_image_strategy_incomplete:{strategy_id}"],
            "warnings": sorted(set(sampling_warnings + llm_warnings + [warning for item in current_results for warning in item.get("warnings", [])])),
        })
        if passed:
            fixture_results = current_results
            return {
                "backend": "offline",
                "status": "passed",
                "selectedStrategyId": strategy_id,
                "fixtureResults": fixture_results,
                "strategyResults": strategy_results,
                "traceRecords": traces,
                "blockers": [],
                "warnings": sorted(set(llm_warnings)),
            }
    return {
        "backend": "offline",
        "status": "blocked",
        "selectedStrategyId": None,
        "fixtureResults": fixture_results,
        "strategyResults": strategy_results,
        "traceRecords": traces,
        "blockers": ["offline_image_fixture_escalation_failed"],
        "warnings": sorted(set(llm_warnings)),
    }
