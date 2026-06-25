# RP-INTERNAL-BETA Google Cloud Managed Runtime Implementation Sequence

This sequence is the required order before any internal beta execution can be considered.

## Phase 1: Environment Boundary

1. Name Google Cloud project/environment class.
2. Name region and non-production boundary.
3. Name Supabase target and confirm local/staging/production separation.
4. Name private artifact bucket classes without creating buckets.
5. Name Secret Manager secret identifiers without reading payloads.

Phase 1 status: `blocked_pending_owner_environment_names`

## Phase 2: Backend Data Runtime

1. Validate remote Supabase target readiness and RLS/storage policy.
2. Implement service-role route runtime behind disabled internal beta flags.
3. Implement immutable approved snapshot persistence.
4. Implement credit reservation, release, refund, and readback.
5. Add audit events for every service-role mutation.

Phase 2 status: `blocked_pending_environment_boundary`

## Phase 3: Job And Artifact Runtime

1. Implement job enqueue with approved snapshot, credit reservation, idempotency key, and project membership checks.
2. Implement worker lease, heartbeat, retry, cancellation, and status events.
3. Implement artifact manifest write/readback with checksum and QA links.
4. Implement private artifact retention and cleanup policy.

Phase 3 status: `blocked_pending_backend_data_runtime`

## Phase 4: Render And Provider Runtime

1. Implement Remotion private preview runtime with generated/local fixtures first.
2. Keep final export blocked until QA, artifact manifest, and cleanup pass.
3. Implement provider adapters disabled by default with secret, model-routing, cost, and approval gates.
4. Keep provider/model calls blocked until credit reservation and explicit provider runtime approval.

Phase 4 status: `blocked_pending_job_and_artifact_runtime`

## Phase 5: Internal Beta E2E Validation

1. Run generated/local fixture end-to-end first.
2. Run approved private test media only after private artifact source, checksum, storage, cleanup, and owner authorization are named.
3. Verify negative gates: no generation before approval, no credits spent without reservation, no frontend provider call, no raw chat worker execution, no public artifact, and no production unlock.
4. Only after all gates pass, record internal beta readiness.

Phase 5 status: `blocked_pending_render_provider_runtime_and_negative_gates`

## Current Outcome

Internal beta end-to-end status: `not_ready_pending_runtime_implementation_and_validation`

Next recommended milestone: `RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-BOUNDARY-1`
