# Smoke Result

Smoke command: `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1`

Smoke status: `passed`

Covered checks:

- `valid_registered_noop_source_contract_validates`
- `response_shape_remains_runtime_disabled`
- `missing_registered_source_reference_blocks`
- `invalid_boundary_blocks`
- `invalid_registered_owner_modes_or_gate_block`
- `idempotency_mismatch_blocks`
- `route_worker_queue_tool_media_supabase_sql_runtime_requests_block`
- `signed_public_artifact_and_delivery_unlock_requests_block`
- `safety_flags_remain_false`

The smoke command validates TypeScript source helpers only. It does not execute a production route, dispatch a worker, start a worker process, claim a worker lease, write a persistent queue, execute GStreamer/MKVToolNix, process media, mutate Supabase, run SQL, create signed/public artifacts, or unlock beta/production/final delivery.
