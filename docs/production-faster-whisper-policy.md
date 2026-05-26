# Production Faster Whisper Policy

`faster_whisper` is a worker-only transcription tool candidate. It is never bundled into frontend code and is not executed in production by Milestone 7.

## Execution Modes

- `dry_run`: validates planned transcription and returns expected actions without requiring faster-whisper, Python packages, or model files.
- `local_dev`: may run only when a local audio path, existing local model path/reference, safe output path, and existing tool installation are provided. No model download is attempted.
- `production_blocked`: refuses real transcription until a future milestone approves deployment, model-weight manifests, and worker runtime execution.

## Model Weight Rules

A package or repository license is not enough. The model/checkpoint/weight license must be tracked separately in `ModelWeightManifest`.

Production transcription must not run when model weights are unknown, non-commercial, unreviewed, or blocked. Unknown model weights stay blocked for paid Reeditpro production until reviewed.

## Safety Rules

- no signed URLs or raw URLs as source of truth
- no raw prompt/chat execution payloads
- no arbitrary user-provided command arguments
- allowlisted command options only
- timeouts and bounded output buffers
- sanitized path summaries in logs
- no provider calls or secrets
