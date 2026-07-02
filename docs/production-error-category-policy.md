# Production Error Category Policy

M17 defines a shared error taxonomy for production reports and alerts:

- `policy_blocked`
- `readiness_blocked`
- `model_weight_blocked`
- `license_blocked`
- `tool_unavailable`
- `missing_artifact`
- `invalid_payload`
- `qa_failed`
- `timeout`
- `retry_exhausted`
- `cost_limit_exceeded`
- `concurrency_limit_exceeded`
- `secret_safety_violation`
- `signed_url_safety_violation`
- `unknown`

These categories keep operational reports consistent without enabling production execution.
