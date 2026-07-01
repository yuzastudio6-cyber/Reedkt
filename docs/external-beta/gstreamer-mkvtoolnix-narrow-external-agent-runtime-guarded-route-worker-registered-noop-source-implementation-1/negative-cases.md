# Negative Cases

The registered no-op source implementation smoke and diagnostics require these fail-closed blockers:

| Case | Blocker |
| --- | --- |
| Missing registered source reference | `blocked_missing_registered_noop_source_reference` |
| Invalid route owner, registration mode, runtime mode, worker mode, or gate | `blocked_invalid_registered_noop_source_state` |
| Invalid upstream route/worker boundary | `blocked_narrow_route_worker_registered_noop_boundary_validation_failed` |
| Source idempotency mismatch | `blocked_registered_noop_source_idempotency_mismatch` |
| Runtime enablement drift | `blocked_registered_noop_source_runtime_enabled_without_future_packet` |
| Production route file, route execution, worker dispatch, worker execution, queue write, tool execution, media processing, Supabase mutation, or SQL execution request | `blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled` |
| Signed/public artifact attempt | `blocked_registered_noop_public_or_signed_artifact_attempt` |
| Final export or unlock attempt | `blocked_registered_noop_delivery_or_unlock_attempt` |

The source implementation intentionally rejects any drift toward live route registration, route execution, worker dispatch, tool execution, media processing, Supabase/SQL mutation, public artifacts, or delivery/unlock behavior.
