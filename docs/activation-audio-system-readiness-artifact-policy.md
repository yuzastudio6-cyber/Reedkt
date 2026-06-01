# Phase 36F Audio System Readiness Artifact Policy

Phase 36F reads private Phase 31, Phase 32, and Phase 36E artifacts only. It
does not commit or create generated audio, cleaned audio, videos, private JSON
reports, logs, credentials, or large binaries in git.

Canonical Phase 36F artifacts are private GCS objects under:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36f/<runId>/beta-scope/audio-system-beta-scope.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36f/<runId>/reports/phase36f-report.json`

Signed URLs and public URLs must not be used as source of truth.
