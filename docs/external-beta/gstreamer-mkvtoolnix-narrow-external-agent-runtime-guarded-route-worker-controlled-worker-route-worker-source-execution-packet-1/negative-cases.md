# Negative Cases

The confirmed runner includes a bounded negative matrix. Each case must reject the unsafe or incomplete packet.

| Case | Expected blocker |
| --- | --- |
| `missing_confirmation` | `blocked_missing_narrow_route_worker_source_execution_confirmation` |
| `missing_source_qa` | `blocked_missing_runtime_integration_implementation_qa_source` |
| `runtime_route_mode` | `blocked_invalid_route_worker_source_execution_state` |
| `runtime_worker_mode` | `blocked_invalid_route_worker_source_execution_state` |
| `persistent_queue_write` | `blocked_invalid_route_worker_source_execution_state` |
| `private_media_source` | `blocked_invalid_route_worker_source_execution_state` |
| `route_execution_request` | `blocked_runtime_execution_not_enabled` |
| `worker_execution_request` | `blocked_runtime_execution_not_enabled` |
| `tool_execution_request` | `blocked_runtime_execution_not_enabled` |
| `supabase_sql_request` | `blocked_runtime_execution_not_enabled` |
| `public_artifact_request` | `blocked_runtime_execution_not_enabled` |
| `idempotency_mismatch` | `blocked_route_worker_source_execution_idempotency_mismatch` |

This prevents the packet from silently becoming route execution, worker execution, broad media handling, persistent queue mutation, Supabase/SQL mutation, public artifact creation, or unchecked idempotency.
