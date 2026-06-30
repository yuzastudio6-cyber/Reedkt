# External-Agent Request Envelope

The accepted request envelope is reference-only. It is designed for a later bridge dry run and then a later guarded agent execution path.

## Accepted Shape

An external agent must provide structured IDs and statuses for approved snapshot, approval, credit/no-spend policy, job, lease, idempotency, command template, private manifest, QA, cleanup, retention, failure, audit, and #1882 runtime evidence.

The bridge validates the envelope and returns `ready_for_confirmation_gated_agent_execution_bridge_dry_run` only when the full reference set is present and safe.

## Rejected Inputs

- raw command strings
- raw chat
- arbitrary file paths
- public URL source-of-truth
- signed URL source-of-truth
- arbitrary private media
- FFmpeg/FFprobe expansion
- route execution request
- worker dispatch request
- worker execution request
- GStreamer or MKVToolNix execution request in this bridge
- Docker push/deploy request
- Remotion render request
- Supabase mutation request
- SQL execution request
- signed URL or public artifact request
- final render/export request
- broad external beta, paid production, or production unlock request

## Result

Valid envelope result: `ready_for_confirmation_gated_agent_execution_bridge_dry_run`

Runtime/tool execution in this phase: `false`

Generated artifacts committed: `none`
