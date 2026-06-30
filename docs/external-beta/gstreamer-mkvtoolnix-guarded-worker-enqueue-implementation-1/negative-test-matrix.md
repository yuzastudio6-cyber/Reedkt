# Negative Test Matrix

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1`

Smoke: `smoke:rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-enqueue-implementation-1`

## Expected Pass Case

- `enqueue_input_validates`
- `mock_queue_item_created`
- `queue_payload_sanitized_refs_only`

## Expected Fail-Closed Cases

| Case | Expected blocker |
| --- | --- |
| Invalid guarded route request | `blocked_route_contract_invalid` |
| Worker dispatch attempt | `blocked_worker_dispatch_not_enabled` |
| Worker execution attempt | `blocked_worker_execution_not_enabled` |
| GStreamer or MKVToolNix execution attempt | `blocked_tool_execution_not_enabled` |
| Media processing attempt | `blocked_media_processing_not_enabled` |
| Route idempotency mismatch | `blocked_idempotency_mismatch` |
| Signed URL or public artifact attempt | `blocked_public_or_signed_artifact_attempt` |
| Final render/export or unlock attempt | `blocked_delivery_or_unlock_attempt` |
| Local mock queue gate failure | `blocked_job_queue_gate_failed` |

The smoke is mock-queue-contract-only and does not dispatch a worker, invoke GStreamer, invoke MKVToolNix, run FFmpeg/FFprobe, run Docker, mutate Supabase, run SQL, or process media.
