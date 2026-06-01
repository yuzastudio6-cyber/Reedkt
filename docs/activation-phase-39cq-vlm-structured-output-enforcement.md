# Phase 39C-Q-SO VLM Structured Output Enforcement

Phase 39C-Q-SO is a Track B-only follow-up after PR #87 verified official Qwen L4-compatible candidates but left generated VLM runtime verification blocked by `output_json_parse_failed` and `output_schema_invalid`.

This phase reuses only the already staged PR #87 private candidate assets:

- `Qwen/Qwen3-VL-8B-Instruct-FP8`
- `Qwen/Qwen3-VL-4B-Instruct`
- `Qwen/Qwen3-VL-2B-Instruct`

No new model download, model upload, non-Qwen candidate, community quantization, provider API, real media, public output, production, beta, Phase 39D, Phase 39E, or Track A path is approved.

The guarded CLI is:

```bash
npm run activation:vlm-structured-output -- --execute --keep-temp
```

Execution requires current-shell confirmations for structured-output rerun, private GCS read, runtime execution, private artifact upload, Docker build/push, staging Cloud Run Job, and L4 GPU execution. Plan/report/IAM/cost/smoke modes are non-mutating by default.

Phase 39C-Q-SO can pass only when one staged official Qwen candidate copies exact PR #87 private model objects, verifies SHA-256, uses a local model path, keeps runtime auto-download blocked, runs the five generated fixtures, produces direct structured JSON through a pass-counting strategy S1-S5, and passes schema, object-region, safe-zone, and hallucination/safety QA.

If it passes, VLM status becomes `phase-complete but tool-family incomplete`. Phase 39D controlled real-frame VLM and Phase 39E planning integration remain blocked.

## Execution Result

Phase 39C-Q-SO implementation is complete, but the guarded generated-fixture runtime remains blocked.

- Complete matrix run `phase39cq-so-20260601T035158` attempted all PR #87 candidates and uploaded 17 private JSON artifacts per candidate. All candidates remained blocked by direct JSON/schema QA failure.
- Follow-up run `phase39cq-so-20260601T041325` rebuilt and pushed image digest `sha256:5ced3307ff21106af7356e1ae2520283fede70e89fe1140e69522c6fb0c260b1`.
- `Qwen/Qwen3-VL-2B-Instruct` reached S1, S3, and S4 generated-fixture execution, but no pass-counting strategy satisfied the compact schema, object-region QA, safe-zone QA, and hallucination/safety gates. S6 remained diagnostic-only.
- `Qwen/Qwen3-VL-4B-Instruct` and `Qwen/Qwen3-VL-8B-Instruct-FP8` were attempted in the final direct-constructor retry and then cancelled after the staging Cloud Run executions produced no safe report artifacts; the earlier complete matrix remains their structured-output blocker evidence.
- Scoped private QA prefix IAM was added only for `activation/phase39c/generated-vlm-structured-output/`; no broad IAM or public access was granted.

VLM tool-family beta status remains `blocked`. Phase 39D, Phase 39E, providers, production, beta, public output, broad media, arbitrary media, unapproved GPU types, non-Qwen candidates, community quantizations, and Track A remain blocked.
