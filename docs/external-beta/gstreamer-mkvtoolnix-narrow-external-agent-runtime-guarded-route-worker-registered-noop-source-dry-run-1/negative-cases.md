# Negative Cases

The confirmed dry run validated these fail-closed cases:

| Case | Expected blocker | Status |
| --- | --- | --- |
| Missing registered source reference | `blocked_missing_registered_noop_source_reference` | `passed` |
| Invalid upstream boundary | `blocked_narrow_route_worker_registered_noop_boundary_validation_failed` | `passed` |
| Enabled runtime | `blocked_registered_noop_source_runtime_enabled_without_future_packet` | `passed` |
| Source idempotency mismatch | `blocked_registered_noop_source_idempotency_mismatch` | `passed` |
| Route execution requested | `blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled` | `passed` |
| Worker dispatch requested | `blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled` | `passed` |
| GStreamer execution requested | `blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled` | `passed` |
| MKVToolNix execution requested | `blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled` | `passed` |
| Supabase/SQL requested | `blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled` | `passed` |
| Public artifact requested | `blocked_registered_noop_public_or_signed_artifact_attempt` | `passed` |
| Final export requested | `blocked_registered_noop_delivery_or_unlock_attempt` | `passed` |
