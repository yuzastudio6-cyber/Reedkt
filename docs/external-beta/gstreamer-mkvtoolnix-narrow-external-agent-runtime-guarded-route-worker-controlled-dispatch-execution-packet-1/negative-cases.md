# Negative Cases

The controlled-dispatch execution packet rejected these unsafe envelope mutations:

- `reject_route_registered_at_runtime`
- `reject_route_execution`
- `reject_worker_dispatch`
- `reject_worker_execution`
- `reject_worker_process_start`
- `reject_worker_lease_claim`
- `reject_persistent_queue_write`
- `reject_tool_execution`
- `reject_docker_ffmpeg`
- `reject_supabase_sql`
- `reject_public_artifact`
- `reject_final_delivery_unlock`
- `reject_raw_command`
- `reject_media_path`

Negative fail-closed controlled dispatch blocker matrix: `passed`
