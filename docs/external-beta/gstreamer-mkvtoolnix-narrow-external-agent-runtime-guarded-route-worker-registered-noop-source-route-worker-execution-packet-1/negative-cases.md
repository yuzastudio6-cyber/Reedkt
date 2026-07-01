# Negative Cases

The local envelope validator rejected each attempted drift from the registered no-op boundary.

| Case | Status |
| --- | --- |
| `reject_route_registered_at_runtime` | `passed` |
| `reject_route_execution` | `passed` |
| `reject_worker_dispatch` | `passed` |
| `reject_worker_execution` | `passed` |
| `reject_worker_process_start` | `passed` |
| `reject_worker_lease_claim` | `passed` |
| `reject_persistent_queue_write` | `passed` |
| `reject_tool_execution` | `passed` |
| `reject_supabase_sql` | `passed` |
| `reject_public_artifact` | `passed` |
| `reject_final_delivery_unlock` | `passed` |
| `reject_raw_command` | `passed` |
| `reject_media_path` | `passed` |
