# GPAC/MP4Box Route Worker Bridge Safety Boundary

This phase is source implementation and validation for the guarded bridge.

Allowed source changes:

- GPAC/MP4Box generated-fixture runtime runner source.
- Backend route-worker bridge source.
- Worker route schema and route registration.
- Smoke and diagnostics.
- Track A docs/status/prompt records.

Forbidden in this phase:

- Private media processing.
- User media processing.
- Raw command execution from request payloads.
- Public URL or signed URL source-of-truth.
- Supabase mutation.
- SQL execution.
- Service-role secret payload access.
- Persistent job queue mutation.
- Real worker dispatch or worker lease claim.
- Public artifact creation.
- Final render/export.
- External beta expansion or production unlock.

The generated-fixture runtime runner itself is fail-closed unless `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION=true` is present. Its approved runtime scope is limited to generated SRT input, subtitle-only MP4 output, Docker network `none`, and MP4Box `-add` / `-info` templates.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution outside this guarded source bridge, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, FFmpeg/FFprobe execution, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled by this packet.
