from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional, Tuple

from perception_alias_map import aliases_for


SCHEMA_VERSION = "phase39c_sg_perception_v1"
CANARY_LABEL_THRESHOLD = 0.8
CANARY_REGION_THRESHOLD = 0.8
FIXTURE_LABEL_THRESHOLD = 0.6
FIXTURE_REGION_THRESHOLD = 0.6
COARSE_ZONES = {"top", "bottom", "left", "right", "center", "lower_third", "upper_third"}


def labels_schema(candidate_ids: List[str]) -> Dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["fixture_id", "candidate_id", "stage_id", "schema_version", "labels", "uncertainty", "blocked_actions"],
        "properties": {
            "fixture_id": {"type": "string"},
            "candidate_id": {"type": "string", "enum": candidate_ids},
            "stage_id": {"const": "SG3"},
            "schema_version": {"const": SCHEMA_VERSION},
            "labels": {
                "type": "array",
                "maxItems": 12,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["label", "confidence"],
                    "properties": {
                        "label": {"type": "string"},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                },
            },
            "uncertainty": uncertainty_schema(),
            "blocked_actions": {"type": "array", "items": {"type": "string"}, "maxItems": 8},
        },
    }


def regions_schema(candidate_ids: List[str]) -> Dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["fixture_id", "candidate_id", "stage_id", "schema_version", "regions", "uncertainty", "blocked_actions"],
        "properties": {
            "fixture_id": {"type": "string"},
            "candidate_id": {"type": "string", "enum": candidate_ids},
            "stage_id": {"const": "SG4"},
            "schema_version": {"const": SCHEMA_VERSION},
            "regions": {
                "type": "array",
                "maxItems": 12,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["label", "zone", "confidence"],
                    "properties": {
                        "label": {"type": "string"},
                        "zone": {"type": "string", "enum": sorted(COARSE_ZONES)},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                },
            },
            "uncertainty": uncertainty_schema(),
            "blocked_actions": {"type": "array", "items": {"type": "string"}, "maxItems": 8},
        },
    }


def safe_zone_schema(candidate_ids: List[str]) -> Dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["fixture_id", "candidate_id", "stage_id", "schema_version", "safe_zone", "uncertainty", "blocked_actions"],
        "properties": {
            "fixture_id": {"type": "string"},
            "candidate_id": {"type": "string", "enum": candidate_ids},
            "stage_id": {"const": "SG5"},
            "schema_version": {"const": SCHEMA_VERSION},
            "safe_zone": {
                "type": "object",
                "additionalProperties": False,
                "required": ["decision", "avoid_zones", "preferred_zones", "confidence", "reason"],
                "properties": {
                    "decision": {"type": "string", "enum": ["pass", "warn", "block", "manual_review"]},
                    "avoid_zones": {"type": "array", "items": {"type": "string", "enum": sorted(COARSE_ZONES)}, "maxItems": 7},
                    "preferred_zones": {"type": "array", "items": {"type": "string", "enum": sorted(COARSE_ZONES)}, "maxItems": 7},
                    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    "reason": {"type": "string"},
                },
            },
            "uncertainty": uncertainty_schema(),
            "blocked_actions": {"type": "array", "items": {"type": "string"}, "maxItems": 8},
        },
    }


def uncertainty_schema() -> Dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["manual_review_required", "confidence", "reason"],
        "properties": {
            "manual_review_required": {"type": "boolean"},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "reason": {"type": "string"},
        },
    }


def parse_direct_json(raw_text: str) -> Tuple[Optional[Dict[str, Any]], List[str], List[str]]:
    blockers: List[str] = []
    warnings: List[str] = []
    text = raw_text.strip()
    if "```" in text:
        blockers.append("markdown_or_code_fence_detected")
    if not text.startswith("{") or not text.endswith("}"):
        blockers.append("direct_json_object_required")
    try:
        parsed = json.loads(text)
    except Exception:
        blockers.append("output_json_parse_failed")
        return None, blockers, warnings
    if not isinstance(parsed, dict):
        blockers.append("wrong_root_type")
        return None, blockers, warnings
    return parsed, blockers, warnings


def validate_common(parsed: Dict[str, Any], fixture: Dict[str, Any], candidate_id: str, stage_id: str) -> List[str]:
    blockers: List[str] = []
    if parsed.get("fixture_id") != fixture.get("fixtureId"):
        blockers.append("fixture_id_mismatch")
    if parsed.get("candidate_id") != candidate_id:
        blockers.append("candidate_id_mismatch")
    if parsed.get("stage_id") != stage_id:
        blockers.append("stage_id_mismatch")
    if parsed.get("schema_version") != SCHEMA_VERSION:
        blockers.append("schema_version_mismatch")
    uncertainty = parsed.get("uncertainty")
    if not isinstance(uncertainty, dict):
        blockers.append("uncertainty_not_object")
    else:
        if not isinstance(uncertainty.get("manual_review_required"), bool):
            blockers.append("uncertainty_manual_review_required_invalid")
        if not valid_confidence(uncertainty.get("confidence")):
            blockers.append("uncertainty_confidence_invalid")
        if not bounded_string(uncertainty.get("reason"), 220):
            blockers.append("uncertainty_reason_invalid")
    blocked_actions = parsed.get("blocked_actions")
    if not isinstance(blocked_actions, list):
        blockers.append("blocked_actions_not_array")
    else:
        for item in blocked_actions:
            text = str(item).lower()
            if any(token in text for token in ["provider", "openai", "dashscope", "tool call", "real media", "public url"]):
                blockers.append("blocked_actions_contains_forbidden_claim")
    return blockers


def validate_labels(parsed: Optional[Dict[str, Any]], fixture: Dict[str, Any], candidate_id: str) -> Tuple[Dict[str, Any], List[str], List[str]]:
    blockers: List[str] = []
    warnings: List[str] = []
    if not parsed:
        return {"labels": [], "matchedLabels": [], "labelRecall": 0.0, "schemaValid": False}, ["labels_output_missing"], warnings
    blockers.extend(validate_common(parsed, fixture, candidate_id, "SG3"))
    labels = parsed.get("labels")
    observed = []
    if not isinstance(labels, list):
        blockers.append("labels_not_array")
    else:
        for item in labels:
            if not isinstance(item, dict):
                blockers.append("label_item_not_object")
                continue
            if not bounded_string(item.get("label"), 120):
                blockers.append("label_item_label_invalid")
            if not valid_confidence(item.get("confidence")):
                blockers.append("label_item_confidence_invalid")
            observed.append(str(item.get("label", "")))
    matched = match_expected_labels(fixture.get("expectedLabels", []), observed)
    recall = len(matched) / len(fixture.get("expectedLabels", [])) if fixture.get("expectedLabels") else 0.0
    return {"labels": observed, "matchedLabels": matched, "labelRecall": recall, "schemaValid": not blockers}, blockers, warnings


def validate_regions(parsed: Optional[Dict[str, Any]], fixture: Dict[str, Any], candidate_id: str) -> Tuple[Dict[str, Any], List[str], List[str]]:
    blockers: List[str] = []
    warnings: List[str] = []
    if not parsed:
        return {"regions": [], "matchedRegions": [], "coarseRegionAccuracy": 0.0, "schemaValid": False}, ["regions_output_missing"], warnings
    blockers.extend(validate_common(parsed, fixture, candidate_id, "SG4"))
    regions = parsed.get("regions")
    observed = []
    if not isinstance(regions, list):
        blockers.append("regions_not_array")
    else:
        for item in regions:
            if not isinstance(item, dict):
                blockers.append("region_item_not_object")
                continue
            label = str(item.get("label", ""))
            zone = str(item.get("zone", ""))
            if not bounded_string(label, 120):
                blockers.append("region_item_label_invalid")
            if zone not in COARSE_ZONES:
                blockers.append("region_item_zone_invalid")
            if not valid_confidence(item.get("confidence")):
                blockers.append("region_item_confidence_invalid")
            observed.append({"label": label, "zone": zone})
    matched = match_expected_regions(fixture.get("expectedZones", {}), observed)
    total = len(fixture.get("expectedZones", {}))
    accuracy = len(matched) / total if total else 0.0
    return {"regions": observed, "matchedRegions": matched, "coarseRegionAccuracy": accuracy, "schemaValid": not blockers}, blockers, warnings


def validate_safe_zone(parsed: Optional[Dict[str, Any]], fixture: Dict[str, Any], candidate_id: str) -> Tuple[Dict[str, Any], List[str], List[str]]:
    blockers: List[str] = []
    warnings: List[str] = []
    if not parsed:
        return {"decision": "unknown", "schemaValid": False, "manualReview": False}, ["safe_zone_output_missing"], warnings
    blockers.extend(validate_common(parsed, fixture, candidate_id, "SG5"))
    safe_zone = parsed.get("safe_zone")
    decision = "unknown"
    manual_review = False
    if not isinstance(safe_zone, dict):
        blockers.append("safe_zone_not_object")
    else:
        decision = str(safe_zone.get("decision", "unknown"))
        if decision not in {"pass", "warn", "block", "manual_review"}:
            blockers.append("safe_zone_decision_invalid")
            decision = "unknown"
        for field in ["avoid_zones", "preferred_zones"]:
            values = safe_zone.get(field)
            if not isinstance(values, list):
                blockers.append(f"safe_zone_{field}_not_array")
            elif any(str(item) not in COARSE_ZONES for item in values):
                blockers.append(f"safe_zone_{field}_invalid_zone")
        if not valid_confidence(safe_zone.get("confidence")):
            blockers.append("safe_zone_confidence_invalid")
        if not bounded_string(safe_zone.get("reason"), 240):
            blockers.append("safe_zone_reason_invalid")
    uncertainty = parsed.get("uncertainty") if isinstance(parsed.get("uncertainty"), dict) else {}
    manual_review = decision == "manual_review" or bool(uncertainty.get("manual_review_required"))
    if decision == "unknown":
        blockers.append("safe_zone_unknown")
    if fixture.get("riskCategory") == "manual_review_expected" and not manual_review:
        blockers.append("ambiguous_fixture_manual_review_required")
    return {"decision": decision, "schemaValid": not blockers, "manualReview": manual_review}, blockers, warnings


def compose_fixture_result(fixture: Dict[str, Any], label_result: Dict[str, Any], region_result: Dict[str, Any], safe_result: Dict[str, Any], canary: bool) -> Dict[str, Any]:
    label_threshold = CANARY_LABEL_THRESHOLD if canary else FIXTURE_LABEL_THRESHOLD
    region_threshold = CANARY_REGION_THRESHOLD if canary else FIXTURE_REGION_THRESHOLD
    blockers: List[str] = []
    if label_result.get("labelRecall", 0.0) < label_threshold:
        blockers.append("label_recall_below_threshold")
    if region_result.get("coarseRegionAccuracy", 0.0) < region_threshold:
        blockers.append("coarse_region_accuracy_below_threshold")
    if safe_result.get("decision") == "unknown":
        blockers.append("safe_zone_unknown")
    if fixture.get("riskCategory") == "manual_review_expected" and not safe_result.get("manualReview"):
        blockers.append("ambiguous_fixture_manual_review_required")
    if not label_result.get("schemaValid"):
        blockers.append("labels_schema_invalid")
    if not region_result.get("schemaValid"):
        blockers.append("regions_schema_invalid")
    if not safe_result.get("schemaValid"):
        blockers.append("safe_zone_schema_invalid")
    return {
        "fixtureId": fixture.get("fixtureId"),
        "status": "passed" if not blockers else "blocked",
        "canary": canary,
        "labelRecall": label_result.get("labelRecall", 0.0),
        "coarseRegionAccuracy": region_result.get("coarseRegionAccuracy", 0.0),
        "safeZoneDecision": safe_result.get("decision", "unknown"),
        "manualReview": bool(safe_result.get("manualReview")),
        "matchedLabels": label_result.get("matchedLabels", []),
        "matchedRegions": region_result.get("matchedRegions", []),
        "blockers": sorted(set(blockers)),
        "warnings": [],
    }


def match_expected_labels(expected: List[str], observed: List[str]) -> List[str]:
    observed_text = " ".join(observed).lower()
    matched = []
    for label in expected:
        if any(alias in observed_text for alias in aliases_for(str(label))):
            matched.append(str(label))
    return matched


def match_expected_regions(expected_zones: Dict[str, str], observed: List[Dict[str, str]]) -> List[Dict[str, str]]:
    matched: List[Dict[str, str]] = []
    for label, expected_zone in expected_zones.items():
        label_aliases = aliases_for(str(label))
        for item in observed:
            observed_label = str(item.get("label", "")).lower()
            observed_zone = str(item.get("zone", ""))
            if observed_zone == expected_zone and any(alias in observed_label for alias in label_aliases):
                matched.append({"label": str(label), "zone": expected_zone})
                break
    return matched


def parse_label_list_from_freeform(raw_text: str) -> List[str]:
    lowered = re.sub(r"[^0-9a-zA-Z_\-\s]", " ", raw_text.lower())
    return [chunk.strip() for chunk in re.split(r"[,;\n]", lowered) if chunk.strip()]


def valid_confidence(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and 0 <= float(value) <= 1


def bounded_string(value: Any, max_length: int) -> bool:
    return isinstance(value, str) and 0 < len(value) <= max_length
