# WORKER-6 Controlled No-Op Safety Policy

safetyPolicyState: `controlled_noop_policy_ready_with_warnings`

## Controlled No-Op Definition

A controlled no-op worker gate is a local/offline fixture gate that proves source evidence, approved plan snapshot refs, scoped tool-call manifest refs, worker payload placeholders, idempotency refs, artifact placeholders, QA requirements, observability requirements, and cleanup requirements without touching live worker infrastructure.

It is not live worker execution. It is not a job claim. It is not worker lease mutation. It is not queue execution.

## Required Blocks

- No job claim.
- No worker lease mutation.
- No queue execution.
- No route dispatch.
- No tool dispatch.
- No provider fallback.
- No Supabase mutation.
- No SQL execution.
- No GCS upload or storage transfer.
- No artifact delivery.
- No signed URLs.
- No public artifacts.
- No live worker runtime import.
- No route handler import.
- No tool runtime import.
- No broad service-role handler.
- No raw prompt to worker path.
- No media/audio processing, audio generation, SFX/music generation, FFmpeg/FFprobe execution, DeepFilterNet execution, or Demucs execution.

## Allowed Evidence

Future WORKER-7 may write ignored local/offline output only under a placeholder local directory. Committed evidence must remain sanitized summaries, relative ignored paths, checksums, fixture IDs, and false approval booleans.

Workers consume approved plan snapshots and scoped tool-call manifests. Signed URLs are not source of truth.
