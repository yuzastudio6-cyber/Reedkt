from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from structured_output_schemas import MATRIX_ID


@dataclass(frozen=True)
class StructuredOutputStrategy:
    strategy_id: str
    name: str
    description: str
    pass_counting: bool
    backend: str
    max_tokens: int = 256
    temperature: float = 0.0
    top_p: float = 1.0
    image_max_size: int = 256

    def to_report(self) -> Dict[str, Any]:
        return {
            "strategyId": self.strategy_id,
            "name": self.name,
            "description": self.description,
            "matrixId": MATRIX_ID,
            "passCounting": self.pass_counting,
            "backend": self.backend,
            "sampling": {
                "temperature": self.temperature,
                "topP": self.top_p,
                "maxTokens": self.max_tokens,
            },
            "fixtureConstraints": {
                "generatedOnly": True,
                "imageCountPerPrompt": 1,
                "maxSizePx": self.image_max_size,
            },
        }


STRATEGIES: List[StructuredOutputStrategy] = [
    StructuredOutputStrategy(
        "S0",
        "baseline trace only",
        "Current PR #87 prompt behavior; captures safe traces and does not count as a pass.",
        False,
        "baseline",
        max_tokens=160,
        image_max_size=256,
    ),
    StructuredOutputStrategy(
        "S1",
        "no-thinking strict prompt",
        "JSON-only compact-schema prompt with no prose, no markdown, no tools, and prompt-level no-thinking guidance.",
        True,
        "strict_prompt",
    ),
    StructuredOutputStrategy(
        "S2",
        "OpenAI response_format JSON Schema",
        "OpenAI-compatible response_format json_schema; skipped by the offline LLM worker when no loopback server path is enabled.",
        True,
        "openai_response_format",
    ),
    StructuredOutputStrategy(
        "S3",
        "vLLM structured_outputs JSON",
        "vLLM guided JSON schema via the installed runtime's SamplingParams support.",
        True,
        "guided_json",
    ),
    StructuredOutputStrategy(
        "S4",
        "vLLM grammar",
        "vLLM grammar-constrained JSON output if the installed runtime supports grammar guided decoding.",
        True,
        "guided_grammar",
    ),
    StructuredOutputStrategy(
        "S5",
        "structural tag",
        "Structural-tag JSON protocol; skipped by the offline LLM worker unless supported.",
        True,
        "structural_tag",
    ),
    StructuredOutputStrategy(
        "S6",
        "deterministic repair diagnostic only",
        "Deterministic wrapper/markdown extraction diagnostic; never counts as a Phase 39C-Q-SO pass.",
        False,
        "repair_diagnostic",
    ),
]


def all_strategy_reports() -> List[Dict[str, Any]]:
    return [strategy.to_report() for strategy in STRATEGIES]


def pass_counting_strategy(strategy_id: str) -> bool:
    return any(strategy.strategy_id == strategy_id and strategy.pass_counting for strategy in STRATEGIES)
