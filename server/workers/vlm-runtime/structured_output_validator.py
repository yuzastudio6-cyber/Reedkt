from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Tuple

from structured_output_schemas import ALLOWED_ROOT_FIELDS, REQUIRED_ROOT_FIELDS, SCHEMA_VERSION


def parse_candidate_json(raw_text: str, strategy_id: str) -> Tuple[Dict[str, Any], List[str], List[str]]:
    blockers: List[str] = []
    warnings: List[str] = []
    text = raw_text.strip()
    if strategy_id == "S5":
        match = re.search(r"<vlm_json>(.*?)</vlm_json>", text, flags=re.DOTALL)
        if not match:
            blockers.append("structural_tag_missing")
            return {}, blockers, warnings
        outside = (text[:match.start()] + text[match.end():]).strip()
        if outside:
            blockers.append("content_outside_structural_tag")
        text = match.group(1).strip()
    elif strategy_id == "S6":
        if "```" in text:
            warnings.append("repair_removed_markdown_fence")
            text = text.replace("```json", "```").replace("```", "")
        if not text.startswith("{") and "{" in text and "}" in text:
            warnings.append("repair_extracted_first_json_object")
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


def validate_fixture_output(parsed: Dict[str, Any], fixture: Dict[str, Any], candidate_id: str, prompt_template_id: str) -> Tuple[List[str], List[str]]:
    blockers: List[str] = []
    warnings: List[str] = []
    missing = [field for field in REQUIRED_ROOT_FIELDS if field not in parsed]
    extra = [field for field in parsed if field not in ALLOWED_ROOT_FIELDS]
    if missing:
        blockers.append(f"missing_required_fields:{','.join(missing)}")
    if extra:
        blockers.append(f"extra_root_fields:{','.join(extra)}")
    if parsed.get("fixture_id") != fixture.get("fixtureId"):
        blockers.append("fixture_id_mismatch")
    if parsed.get("candidate_id") != candidate_id:
        blockers.append("candidate_id_mismatch")
    if parsed.get("prompt_template_id") != prompt_template_id:
        blockers.append("prompt_template_id_mismatch")
    if parsed.get("schema_version") != SCHEMA_VERSION:
        blockers.append("schema_version_mismatch")
    for field in ["objects", "text_like_regions", "safe_zone_suggestions", "spatial_relations", "blocked_actions"]:
        if not isinstance(parsed.get(field), list):
            blockers.append(f"{field}_not_array")
    blockers.extend(validate_regions(parsed.get("objects", []), "objects"))
    blockers.extend(validate_regions(parsed.get("text_like_regions", []), "text_like_regions"))
    blockers.extend(validate_safe_zones(parsed.get("safe_zone_suggestions", [])))
    blockers.extend(validate_spatial_relations(parsed.get("spatial_relations", [])))
    uncertainty = parsed.get("uncertainty")
    if not isinstance(uncertainty, dict):
        blockers.append("uncertainty_not_object")
    else:
        if not valid_confidence(uncertainty.get("confidence")):
            blockers.append("uncertainty_confidence_invalid")
        if not isinstance(uncertainty.get("manual_review_required"), bool):
            blockers.append("uncertainty_manual_review_required_invalid")
        if not bounded_string(uncertainty.get("reason"), 180):
            blockers.append("uncertainty_reason_invalid")
        if fixture.get("riskCategory") == "manual_review_expected" and not uncertainty.get("manual_review_required"):
            blockers.append("ambiguous_fixture_manual_review_required")
    for item in parsed.get("blocked_actions", []) if isinstance(parsed.get("blocked_actions"), list) else []:
        if not isinstance(item, str) or len(item) > 120:
            blockers.append("blocked_actions_item_invalid")
        if any(token in item.lower() for token in ["tool", "provider", "openai", "dashscope", "real media", "public url"]):
            blockers.append("blocked_actions_contains_forbidden_tool_or_provider_claim")
    return blockers, warnings


def validate_regions(items: Any, field: str) -> List[str]:
    blockers: List[str] = []
    if not isinstance(items, list):
        return blockers
    for index, item in enumerate(items):
        prefix = f"{field}[{index}]"
        if not isinstance(item, dict):
            blockers.append(f"{prefix}_not_object")
            continue
        if set(item.keys()) != {"label", "confidence", "box", "evidence"}:
            blockers.append(f"{prefix}_fields_invalid")
        if not bounded_string(item.get("label"), 80):
            blockers.append(f"{prefix}_label_invalid")
        if not valid_confidence(item.get("confidence")):
            blockers.append(f"{prefix}_confidence_invalid")
        if not valid_box(item.get("box")):
            blockers.append(f"{prefix}_box_invalid")
        if not bounded_string(item.get("evidence"), 180):
            blockers.append(f"{prefix}_evidence_invalid")
    return blockers


def validate_safe_zones(items: Any) -> List[str]:
    blockers: List[str] = []
    if not isinstance(items, list):
        return blockers
    for index, item in enumerate(items):
        prefix = f"safe_zone_suggestions[{index}]"
        if not isinstance(item, dict):
            blockers.append(f"{prefix}_not_object")
            continue
        if set(item.keys()) != {"zone_id", "box", "confidence", "status", "reason"}:
            blockers.append(f"{prefix}_fields_invalid")
        if not bounded_string(item.get("zone_id"), 80):
            blockers.append(f"{prefix}_zone_id_invalid")
        if not valid_box(item.get("box")):
            blockers.append(f"{prefix}_box_invalid")
        if not valid_confidence(item.get("confidence")):
            blockers.append(f"{prefix}_confidence_invalid")
        if item.get("status") not in {"pass", "warn", "block"}:
            blockers.append(f"{prefix}_status_invalid")
        if not bounded_string(item.get("reason"), 180):
            blockers.append(f"{prefix}_reason_invalid")
    return blockers


def validate_spatial_relations(items: Any) -> List[str]:
    blockers: List[str] = []
    if not isinstance(items, list):
        return blockers
    for index, item in enumerate(items):
        prefix = f"spatial_relations[{index}]"
        if not isinstance(item, dict):
            blockers.append(f"{prefix}_not_object")
            continue
        if set(item.keys()) != {"relation", "confidence", "evidence"}:
            blockers.append(f"{prefix}_fields_invalid")
        if not bounded_string(item.get("relation"), 160):
            blockers.append(f"{prefix}_relation_invalid")
        if not valid_confidence(item.get("confidence")):
            blockers.append(f"{prefix}_confidence_invalid")
        if not bounded_string(item.get("evidence"), 180):
            blockers.append(f"{prefix}_evidence_invalid")
    return blockers


def valid_confidence(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and 0 <= float(value) <= 1


def valid_box(value: Any) -> bool:
    if not isinstance(value, list) or len(value) != 4:
        return False
    if not all(valid_confidence(item) for item in value):
        return False
    x1, y1, x2, y2 = [float(item) for item in value]
    return x1 < x2 and y1 < y2


def bounded_string(value: Any, max_length: int) -> bool:
    return isinstance(value, str) and 0 < len(value) <= max_length
