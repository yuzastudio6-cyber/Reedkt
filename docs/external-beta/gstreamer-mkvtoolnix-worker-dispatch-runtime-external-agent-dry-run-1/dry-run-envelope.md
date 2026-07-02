# External-Agent Dry-Run Envelope

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-DRY-RUN-1`

Envelope mode: `confirmation_gated_external_agent_dispatch_dry_run_metadata_only`

Decision: `completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_dry_run_envelope`

Execution: `completed_confirmation_gated_external_agent_dry_run_metadata_only_no_runtime_execution`

## Envelope Fields

- Envelope ID: `external-agent-dry-run-gstreamer-mkvtoolnix-worker-dispatch-runtime-1`
- Route path: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`
- Worker source: `server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts`
- Worker source ID: `worker.gstreamerMkvtoolnix.narrowSourceExecution.notRegistered`
- Persisted job ID: `job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-source-gate-1`
- Persisted job type: `quality_check`
- Persisted job payload kind: `gstreamer_mkvtoolnix_generated_fixture_runtime`
- Worker type: `gstreamer_mkvtoolnix_generated_fixture_worker`
- Fixture scope: `controlled_generated_fixture_only`
- Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`
- Idempotency key: `external-agent-dry-run:<handoff-merge-sha>:<runId>`

## Dry-Run Request Flags

- Route execution requested now: `false`
- External agent runtime invocation requested now: `false`
- Worker dispatch requested now: `false`
- Worker process start requested now: `false`
- Worker lease claim requested now: `false`
- Persistent queue write requested now: `false`
- Tool execution requested now: `false`
- Media processing requested now: `false`

## Blocked Inputs

- Raw caller commands: `blocked`
- Arbitrary private user media: `blocked`
- Public URL source of truth: `blocked`
- Signed URL source of truth: `blocked`
- Service-role secret payload: `blocked`
- Broad worker registration: `blocked`
- Final render/export: `blocked`
- Production unlock: `blocked`

## Local Evidence

Run ID: `2026-07-02T17-27-30-594Z-c3ff4d53`

Envelope checksum: `d1ccc7464aba70a628a875896aa921eea763e95cddc41c4551ac04c8b2171411`
