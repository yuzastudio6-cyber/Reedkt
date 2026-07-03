# Three-Tool External Agent Persisted Job Runtime Handoff

Packet: `TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTED-JOB-RUNTIME-HANDOFF-1`

Route path: `/v1/external-beta/tracka/three-tool/generated-fixture-runtime/approved-snapshot/jobs/persisted-handoff`

Confirmation gate: `REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF=true`

Handoff mode: `local_mock_job_service_handoff_no_remote_mutation`

Job type: `quality_check`

Payload kind: `tracka_three_tool_external_agent_generated_fixture_runtime`

What this packet proves:

- A backend route/schema/service exists for a three-tool external-agent persisted job runtime handoff.
- The service accepts only the structured approved-snapshot generated-fixture envelope.
- The service creates local/mock job batch and job records through the existing job service during validation.
- The payload records the prior approved-snapshot job execution source, approved snapshot ID, job ID, tool list, manifest references, QA reference, cleanup/retention/failure policies, and safety flags.
- The route fails closed unless the confirmation gate is present.
- The service fails closed if a service-role remote job-service write is available, because remote mutation is not approved in this phase.

What this packet does not do:

- It does not invoke the runtime route.
- It does not write to a remote persistent job queue.
- It does not claim a worker lease.
- It does not dispatch or start a worker.
- It does not execute GStreamer, MKVToolNix, GPAC/MP4Box, FFmpeg/FFprobe, Docker, Remotion, providers, models, or media processing.
- It does not create signed URLs, public artifacts, private media outputs, or final render/export.

Next milestone: `TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTED-JOB-ROUTE-INVOCATION-1`
