# Negative Cases

The no-op boundary dry-run rejected all required fail-closed cases:

| Case | Result |
| --- | --- |
| `reject_missing_boundary_reference` | `rejected` |
| `reject_route_registered` | `rejected` |
| `reject_route_enabled` | `rejected` |
| `reject_route_execution` | `rejected` |
| `reject_worker_dispatch` | `rejected` |
| `reject_worker_execution` | `rejected` |
| `reject_worker_lease_claim` | `rejected` |
| `reject_persistent_queue_write` | `rejected` |
| `reject_tool_execution` | `rejected` |
| `reject_supabase_sql` | `rejected` |
| `reject_signed_public_artifact` | `rejected` |
| `reject_final_export_unlock` | `rejected` |

These negative cases prove the dry-run validator rejects boundary drift toward real route execution, worker execution, tool execution, persistent queue writes, Supabase/SQL mutation, public artifact creation, and delivery/unlock claims.
