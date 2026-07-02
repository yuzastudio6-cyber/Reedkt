# Runtime Execution Packet

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-RUNTIME-EXECUTION-PACKET-1`

Decision: `completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_runtime_execution_packet`

Execution: `completed_docs_only_runtime_execution_packet_no_route_worker_tool_or_media_execution`

## Required Future Confirmation

Future execution remains blocked unless the executor explicitly supplies:

```bash
REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXTERNAL_AGENT_RUNTIME_EXECUTION=true
```

That confirmation alone is not enough. The future execution packet must also name the exact runtime invoker and must verify that it is bound to the approved route, generated fixture, idempotency key, service-role boundary, cleanup plan, rollback plan, manifest, QA report, and safety evidence before any route, worker, lease, tool, or media path runs.

## Accepted Runtime Invocation Shape

- Route path: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`.
- Worker source path: `server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts`.
- Worker source id: `worker.gstreamerMkvtoolnix.narrowSourceExecution.notRegistered`.
- Persisted job id: `job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-source-gate-1`.
- Persisted job type: `quality_check`.
- Persisted job payload kind: `gstreamer_mkvtoolnix_generated_fixture_runtime`.
- Worker type: `gstreamer_mkvtoolnix_generated_fixture_worker`.
- Fixture scope: `controlled_generated_fixture_only`.
- Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.

## Runtime Packet Requirements

- Route/runtime invocation must be explicitly named and confirmation-gated.
- Worker process behavior must be described before execution, including whether it is local, external-agent mediated, or remote.
- Service-role secret payload access must remain forbidden unless a later prompt explicitly authorizes a verified secret source and redaction policy.
- Idempotency must bind to the merged #2181 source and the future runtime run ID.
- Rollback must prove that failed or partial route/worker state leaves no persistent public artifacts and no broad-media unlock.
- Cleanup must cover local `/tmp` evidence and any transient generated fixture artifacts.
- Output manifest must include sanitized file names, byte counts, checksums, and no secret payloads.
- QA report must confirm command/result matrix, route/worker state, artifact manifest, and safety boundaries.

## Not Authorized Here

Route execution in this runtime-execution-packet phase: `false`

External agent runtime invocation in this runtime-execution-packet phase: `false`

Real worker dispatch in this runtime-execution-packet phase: `false`

Worker process started in this runtime-execution-packet phase: `false`

Worker execution in this runtime-execution-packet phase: `false`

Worker lease claim in this runtime-execution-packet phase: `false`

Persistent job queue write in this runtime-execution-packet phase: `false`

GStreamer execution in this runtime-execution-packet phase: `false`

MKVToolNix execution in this runtime-execution-packet phase: `false`

FFmpeg/FFprobe execution in this runtime-execution-packet phase: `false`

Docker execution in this runtime-execution-packet phase: `false`

Supabase mutation in this runtime-execution-packet phase: `false`

SQL execution in this runtime-execution-packet phase: `false`

Public artifact creation in this runtime-execution-packet phase: `false`

Final render/export in this runtime-execution-packet phase: `false`
