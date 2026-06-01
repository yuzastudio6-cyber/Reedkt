# Phase 36A Audio AI Approval Runbook

Phase 36A is static/report-only. It reviews DeepFilterNet, RNNoise, and Demucs
as future worker-only audio AI candidates after the Phase 35F SAM2 feature E2E
gate.

## Commands

- `npm run activation:audio-ai-approval:plan`
- `npm run activation:audio-ai-approval:report`
- `npm run activation:audio-ai-tool:summary`
- `npm run smoke:activation-audio-ai-approval-workflow`

These commands must not download models, process audio, run Docker, mutate GCP,
call providers, create public URLs, or write private media artifacts.

## Decision

Phase 36A recommends `deepfilternet_first` for future staging planning because
DeepFilterNet is the best first fit for speech enhancement/noise suppression
and its official repo records permissive dual MIT/Apache-2.0 licensing.

RNNoise remains a lightweight fallback candidate. Demucs remains restricted and
deferred for source-separation/stem workflows only.

## Exit State

Phase 36B remains blocked until the exact DeepFilterNet artifact source,
checksum plan, private staging GCS path, and no-runtime-download constraint are
recorded. Production, external beta, broad real media, providers, Revideo, and
all audio AI runtime remain blocked.
