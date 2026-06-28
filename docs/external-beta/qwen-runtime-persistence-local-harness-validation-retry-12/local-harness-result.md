# QWEN Runtime Persistence Local Harness Validation Retry 12 Result

Local Supabase project id: `reeditpro-rp-data-04-local-validation`

Harness start: `passed`

Active baseline migration status: `passed_through_latest_integration_migration`

Latest migration reached: `20260626233000`

Draft SQL apply: `passed`

Local SQL tests: `passed`

Readbacks:

- Required runtime baseline tables: `13`
- `media_analysis` job type: `1`
- `qwen25_vl_jobs_payload_refs_check`: `1`
- `qwen25_vl_job_events_sanitized_payload_check`: `1`
- `qwen25_vl_worker_runtime_config_check`: `1`
- `qwen25_vl_worker_leases_refs_check`: `1`
- `qwen25_vl_backend_runtime_messages_sanitized_check`: `1`
- `qwen25_vl_job_claim_attempts_sanitized_check`: `1`
- `tool_runtime_checks_tool_name_check` includes `qwen_vl`: `1`
- QWEN-specific indexes: `5`
- Existing active claim/lease indexes: `2`
- storage object signed URL columns: `0`
- signed URL event URL value columns: `0`
- runtime raw prompt columns: `0`

Cleanup result: `passed`

Isolated harness containers left running: `0`

Unrelated local Supabase project stopped: `false`
