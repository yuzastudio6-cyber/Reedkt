# Narrow Guarded Route/Worker Boundary Negative Cases

The no-op boundary helper rejects:

- `blocked_missing_narrow_route_worker_boundary_reference`
- `blocked_invalid_narrow_route_worker_boundary_state`
- `blocked_narrow_bridge_validation_failed`
- `blocked_narrow_route_worker_boundary_idempotency_mismatch`
- `blocked_route_or_worker_runtime_not_enabled`
- `blocked_public_or_signed_artifact_attempt`
- `blocked_delivery_or_unlock_attempt`

Rejected examples include:

- missing boundary ID;
- invalid or unsafe source bridge input;
- frontend route ownership;
- broad service-role ownership;
- live route handler mode;
- live worker dispatch mode;
- idempotency mismatch;
- route registration or route enablement;
- route execution;
- worker dispatch;
- worker execution;
- worker process start;
- worker lease claim;
- persistent queue write;
- GStreamer execution;
- MKVToolNix execution;
- Docker execution;
- FFmpeg/FFprobe execution;
- media processing;
- Supabase mutation;
- SQL execution;
- signed/public artifact creation;
- final render/export;
- broad external beta, paid production, or production unlock.
