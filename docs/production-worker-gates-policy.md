# Production Worker Gates Policy

## Hard Gates

These gates block every execution mode:

- `approvedSnapshotGate`: requires `approvedSnapshotId`.
- `idempotencyGate`: requires a stable ID-based idempotency key.
- `rawPromptBlockGate`: rejects raw prompt/chat execution fields.
- `signedUrlBlockGate`: rejects signed URLs and URL-like storage values.
- `secretBlockGate`: rejects service-role keys, provider keys, and secret values.
- `registryRuntimeGate`: blocks wrong worker placement, GPU tools on CPU workers, and evaluation-only production execution.
- `artifactPolicyGate`: requires storage references to be IDs/paths, not signed URLs.
- `qaPolicyGate`: blocks render final export without required QA gate references.
- `workerModeGate`: blocks `production_blocked` dispatch.

## Mode Behavior

`production_ready` must pass license and model-weight policy. `dry_run` and `mock_safe` may surface license/model-weight review gaps as warnings, but they still block raw prompts, signed URLs, secrets, missing approved snapshots, missing idempotency keys, and wrong worker/tool placement.

## Revideo

Revideo is evaluation-only. It is not a core render dependency and cannot be production executed.
