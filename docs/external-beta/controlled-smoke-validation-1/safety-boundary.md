# Safety Boundary

Packet: `RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1`

Execution: `completed_authenticated_health_readiness_source_status_smoke_only`

Allowed in this phase:

- Cloud Run source-status readback for `reeditpro-staging-api`
- authenticated `GET /health`
- authenticated `GET /ready`
- authenticated `GET /api/runtime/status`
- unauthenticated negative access check returning `403`

Not allowed and not performed:

- Supabase mutation
- SQL execution
- Secret Manager payload access
- provider/model call
- worker execution or dispatch
- mutating route execution
- media processing
- Remotion execution
- FFmpeg/FFprobe execution
- signed URL creation
- public artifact creation
- credit mutation
- Stripe checkout/webhook/payment processing
- Docker execution
- package installation beyond validation `npm ci`
- dependency mutation
- package-lock mutation
- internal beta unlock
- paid production unlock
- production unlock
- final render/export
- broad service-role handler

External beta remains scoped to `controlled_private_preview` on the staging API. Public beta, public artifacts, signed URL source-of-truth, broad media, paid production, production, and final delivery/export remain blocked.
