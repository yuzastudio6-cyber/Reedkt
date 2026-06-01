# Phase 39C-Q-SO Guided Decoding Strategy

The structured-output matrix is `phase39c-qwen-structured-output-v1`.

| Strategy | Purpose | Pass-counting |
| --- | --- | --- |
| S0 baseline trace | Capture PR #87-style output failure traces | No |
| S1 no-thinking strict prompt | JSON-only compact-schema prompt with no tools/prose/markdown | Yes |
| S2 response_format JSON Schema | OpenAI-compatible response format if a loopback server path is available | Yes when supported |
| S3 vLLM structured JSON | vLLM guided/structured JSON schema through installed runtime APIs | Yes |
| S4 vLLM grammar | Grammar-constrained JSON when supported by runtime | Yes |
| S5 structural tag | JSON inside an approved tag when supported by runtime | Yes |
| S6 deterministic repair | Diagnose simple wrappers or markdown extraction | No |

All strategies run with deterministic settings, one generated image per prompt, generated fixtures only, no raw prompts, no provider calls, no real media, no public output, and local verified model paths only.

## Runtime Outcome

The final run `phase39cq-so-20260601T041325` confirmed that S6 repair remains diagnostic-only and cannot count as a pass. For `Qwen/Qwen3-VL-2B-Instruct`, S1/S3/S4 generated outputs still failed the compact direct JSON/schema gate and downstream object-region/safe-zone QA. The 4B and 8B FP8 direct-constructor retries were cancelled after no safe report artifacts were produced, so their last complete evidence remains the `phase39cq-so-20260601T035158` blocked matrix.

The next structured-output follow-up, if approved, should be limited to vLLM structured-output compatibility/debugging for the local API path or OpenAI-compatible loopback `response_format`; it must not move to Phase 39D until a pass-counting S1-S5 strategy validates all five generated fixtures.
