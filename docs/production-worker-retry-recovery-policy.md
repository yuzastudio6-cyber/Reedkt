# Production Worker Retry And Recovery Policy

## Failure Categories

- `transient_runtime`
- `tool_unavailable`
- `missing_artifact`
- `qa_failed`
- `policy_blocked`
- `license_blocked`
- `model_weight_blocked`
- `credit_blocked`
- `invalid_payload`
- `unknown`

## Retry Rules

Retry is allowed only for safe transient categories and only within worker-specific max attempts. Policy violations, license blocks, model-weight blocks, credit blocks, invalid payloads, raw prompts, signed URLs, and secret payloads are never retried.

## Recovery

Milestone 4 records retry decisions as policy helpers only. Future persistence and job scheduling will use production worker attempts and retry-wait states after schema review.
