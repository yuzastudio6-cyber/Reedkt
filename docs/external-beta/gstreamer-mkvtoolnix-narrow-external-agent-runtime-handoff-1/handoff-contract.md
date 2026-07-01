# Narrow External-Agent Runtime Handoff Contract

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-HANDOFF-1`

Decision: `completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_handoff_contract_ready_for_confirmation_gated_dry_run`

Execution: `completed_docs_only_narrow_external_agent_runtime_handoff_no_route_worker_or_tool_execution`

Handoff status: `ready_for_confirmation_gated_narrow_external_agent_runtime_dry_run`

## Contract

A future external agent may request only a confirmation-gated dry run that validates structured references. The agent must not provide raw command strings, arbitrary file paths, broad media, public URLs, signed URLs as source-of-truth, private/user media outside the approved manifest, route execution instructions, worker dispatch instructions, queue writes, or production unlock requests.

The future dry run must fail closed unless every required reference is present and consistent with the accepted packet-2 runtime source:

- `approvedSnapshotId`: `approved-snapshot-agent-controlled-dispatch-1`
- `approvalRecordId`: `approval-record-agent-controlled-dispatch-1`
- `creditPolicyId`: `no-spend-fixture-policy-agent-controlled-dispatch-1`
- `jobId`: `job-agent-controlled-dispatch-1`
- `workerLeaseId`: `worker-lease-agent-controlled-dispatch-1`
- `localMockQueueItem`: `mock-job-runtime-queue-item-0001`
- `runtimePacketId`: `runtime-packet-gstreamer-mkvtoolnix-post-dispatch-worker-2`
- `runtimeExecutionId`: `runtime-execution-gstreamer-mkvtoolnix-post-dispatch-worker-2`
- `privateInputManifestSha256`: `4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357`
- `outputManifestSchemaId`: `output-manifest-schema-agent-controlled-dispatch-1`
- `qaReportSchemaId`: `qa-report-schema-agent-controlled-dispatch-1`
- `dockerImageTag`: `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8`
- `dockerNetwork`: `none`

## Handoff Boundary

This contract is a source-controlled handoff only. It does not register a runtime route, enqueue a job, start a worker, claim a worker lease, write a persistent job queue, execute tools, process media, create artifacts, access Supabase, run SQL, expose service-role credentials, or unlock internal/external beta or production.

The next packet may implement a confirmation-gated narrow external-agent runtime dry run. That dry run may validate the handoff envelope and produce local sanitized `/tmp` validation reports only if explicitly confirmed. It still must not execute GStreamer, MKVToolNix, FFmpeg/FFprobe, Docker, Remotion, routes, workers, Supabase, SQL, signed/public artifacts, or final render/export unless a later packet explicitly authorizes that exact action.
