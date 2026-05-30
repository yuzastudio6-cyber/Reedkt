# Phase 36B DeepFilterNet Download Policy

Phase 36B approves a narrow artifact storage action only.

## Approved Scope

- project: `reeditpro`
- region: `us-central1`
- environment: `staging`
- tool: DeepFilterNet
- version: `v0.5.6`
- license decision: `staging_download_approved_by_codex`
- humanLicenseApprovalRequired: `false`
- target: private staging GCS model-weight prefix

## Required Guards

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_DEEPFILTERNET_ARTIFACT_DOWNLOAD=true`
- exact approved artifact URLs only
- temp directory outside the git worktree
- private bucket only
- no public IAM principals
- no signed URL source of truth

## Blocked

- DeepFilterNet runtime
- audio/media processing
- RNNoise download/runtime
- Demucs download/runtime
- Docker build or push
- Cloud Run deploy or execution
- provider calls
- Revideo
- FILM
- slow motion
- production, external beta, paid production, and broad real media

Phase 36B does not grant runtime access to service accounts by default. Runtime
read access is deferred to Phase 36C unless upload/read verification exposes a
hard blocker.
