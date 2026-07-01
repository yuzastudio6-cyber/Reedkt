# Negative Cases

The confirmed dry run validated these fail-closed cases:

| Case | Expected blocker | Status |
| --- | --- | --- |
| Missing source reference | `blocked_missing_narrow_route_worker_noop_source_reference` | `passed` |
| Invalid upstream boundary | `blocked_narrow_route_worker_boundary_validation_failed` | `passed` |
| Enabled runtime | `blocked_invalid_narrow_route_worker_noop_source_state` | `passed` |
| Route execution requested | `blocked_route_worker_queue_or_runtime_execution_not_enabled` | `passed` |
| Worker dispatch requested | `blocked_route_worker_queue_or_runtime_execution_not_enabled` | `passed` |
| GStreamer execution requested | `blocked_route_worker_queue_or_runtime_execution_not_enabled` | `passed` |
| MKVToolNix execution requested | `blocked_route_worker_queue_or_runtime_execution_not_enabled` | `passed` |
| Supabase/SQL requested | `blocked_route_worker_queue_or_runtime_execution_not_enabled` | `passed` |
| Public artifact requested | `blocked_public_or_signed_artifact_attempt` | `passed` |
| Final export requested | `blocked_delivery_or_unlock_attempt` | `passed` |
