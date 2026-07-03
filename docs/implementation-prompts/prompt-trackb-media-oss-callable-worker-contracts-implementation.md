# TRACKB_MEDIA_OSS_CALLABLE_WORKER_CONTRACTS_IMPLEMENTATION

Implement the Track B callable worker/API contract lane before any beta tool calls.

Required scope:

- Add Track B tool-call route metadata and fail-closed handlers without executing tools.
- Add Track B worker runtime contract metadata and payload validators.
- Require approved snapshot ids, edit plan ids, idempotency keys, private artifact references, result schemas, QA gates, fallback behavior, sanitized logging, and credit gate linkage where cost-bearing.
- Keep Docker, tool execution, media processing, Supabase/GCS writes, beta, production, public artifacts, signed URLs, and raw prompt execution blocked unless a later gate explicitly approves them.

Expected decision after implementation: `trackb_media_oss_callable_worker_contracts_passed_ready_for_tool_call_beta_readiness_rerun`.
