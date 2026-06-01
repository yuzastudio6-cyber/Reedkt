from __future__ import annotations

from typing import Any, Dict, List


SCHEMA_VERSION = "phase39c_qwen_vlm_v1"
MATRIX_ID = "phase39c-qwen-structured-output-v1"
REQUIRED_ROOT_FIELDS = [
    "fixture_id",
    "candidate_id",
    "prompt_template_id",
    "schema_version",
    "objects",
    "text_like_regions",
    "safe_zone_suggestions",
    "spatial_relations",
    "uncertainty",
    "blocked_actions",
]
ALLOWED_ROOT_FIELDS = set(REQUIRED_ROOT_FIELDS)
PASS_COUNTING_STRATEGIES = {"S1", "S2", "S3", "S4", "S5"}


def confidence_schema() -> Dict[str, Any]:
    return {"type": "number", "minimum": 0, "maximum": 1}


def box_schema() -> Dict[str, Any]:
    return {"type": "array", "minItems": 4, "maxItems": 4, "items": confidence_schema()}


def region_item_schema() -> Dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["label", "confidence", "box", "evidence"],
        "properties": {
            "label": {"type": "string", "minLength": 1, "maxLength": 80},
            "confidence": confidence_schema(),
            "box": box_schema(),
            "evidence": {"type": "string", "minLength": 1, "maxLength": 180},
        },
    }


def compact_schema(candidate_ids: List[str]) -> Dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": SCHEMA_VERSION,
        "type": "object",
        "additionalProperties": False,
        "required": REQUIRED_ROOT_FIELDS,
        "properties": {
            "fixture_id": {"type": "string", "minLength": 1, "maxLength": 80},
            "candidate_id": {"type": "string", "enum": candidate_ids},
            "prompt_template_id": {"type": "string", "minLength": 1, "maxLength": 120},
            "schema_version": {"const": SCHEMA_VERSION},
            "objects": {"type": "array", "maxItems": 12, "items": region_item_schema()},
            "text_like_regions": {"type": "array", "maxItems": 12, "items": region_item_schema()},
            "safe_zone_suggestions": {
                "type": "array",
                "maxItems": 8,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["zone_id", "box", "confidence", "status", "reason"],
                    "properties": {
                        "zone_id": {"type": "string", "minLength": 1, "maxLength": 80},
                        "box": box_schema(),
                        "confidence": confidence_schema(),
                        "status": {"enum": ["pass", "warn", "block"]},
                        "reason": {"type": "string", "minLength": 1, "maxLength": 180},
                    },
                },
            },
            "spatial_relations": {
                "type": "array",
                "maxItems": 12,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["relation", "confidence", "evidence"],
                    "properties": {
                        "relation": {"type": "string", "minLength": 1, "maxLength": 160},
                        "confidence": confidence_schema(),
                        "evidence": {"type": "string", "minLength": 1, "maxLength": 180},
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
                    "reason": {"type": "string", "minLength": 1, "maxLength": 180},
                },
            },
            "blocked_actions": {
                "type": "array",
                "maxItems": 8,
                "items": {"type": "string", "maxLength": 120},
            },
        },
    }


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
