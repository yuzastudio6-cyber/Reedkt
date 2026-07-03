# Three-Tool Persisted Handoff Safety Boundary

Decision: `completed_three_tool_external_agent_persisted_job_runtime_handoff`

Execution: `completed_local_mock_job_service_handoff_no_route_worker_tool_media_execution`

Allowed in this phase:

- Strict schema validation for the three-tool approved-snapshot generated-fixture handoff envelope.
- Local/mock job-service handoff record creation in validation.
- Express route registration that fails closed without confirmation.
- Non-executing diagnostics, smoke tests, and file-content safety scans.

Not allowed in this phase:

- Remote Supabase mutation.
- SQL execution.
- Service-role secret payload access.
- Persistent remote queue writes.
- Runtime route invocation.
- Worker dispatch, worker lease claim, worker process start, or worker execution.
- GStreamer execution in this persisted-handoff phase.
- MKVToolNix execution in this persisted-handoff phase.
- GPAC/MP4Box execution in this persisted-handoff phase.
- FFmpeg/FFprobe execution.
- Docker execution.
- Remotion execution.
- Private/user media processing.
- Signed URL creation.
- Public artifact creation.
- Final render/export.
- External beta expansion, paid production unlock, or production unlock.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route runtime invocation, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, external beta expansion, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this persisted-handoff phase, MKVToolNix execution in this persisted-handoff phase, GPAC/MP4Box execution in this persisted-handoff phase, FFmpeg/FFprobe execution, Docker execution, Remotion execution, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled.
