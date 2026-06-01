# Phase 39C-Q VLM Candidate Fallback Matrix

| Candidate | Attempt condition | Pass condition | Failure action |
| --- | --- | --- | --- |
| `Qwen/Qwen3-VL-8B-Instruct-FP8` | Source/license/runtime metadata passes | Full generated fixture QA passes on Cloud Run L4 | Record FP8/vLLM/L4 failure and attempt 4B if access allows |
| `Qwen/Qwen3-VL-4B-Instruct` | Candidate A fails before generated inference or is blocked | Full generated fixture QA passes on Cloud Run L4 | Record 4B failure and attempt 2B if access allows |
| `Qwen/Qwen3-VL-2B-Instruct` | Candidate A and B fail before generated inference or are blocked | Full generated fixture QA passes on Cloud Run L4 | Keep VLM blocked and recommend a new approval path |

Minimal smoke or partial fixture success does not complete Phase 39C-Q. All required generated fixtures and QA gates must pass.

## Run Result

`phase39cq-20260531T235421` attempted Candidate A, Candidate B, and Candidate C in order. No candidate passed. All three candidates verified private staged assets and aggregate SHA-256 before runtime, then failed generated runtime verification because fixture outputs failed `output_json_parse_failed` and `output_schema_invalid`. Candidate fallback is exhausted for this prompt, so Phase 39D remains blocked and VLM tool-family beta status is `blocked`.
