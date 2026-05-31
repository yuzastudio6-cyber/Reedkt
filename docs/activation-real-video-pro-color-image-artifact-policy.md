# Phase 40C Real-Video Pro Color/Image Artifact Policy

Phase 40C artifacts are private staging artifacts only.

## Allowed Prefixes

- Generated assets: `gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40c/<runId>/`
- Previews: `gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40c/<runId>/`
- QA: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40c/<runId>/`
- Worker temp: `gs://reeditpro-staging-reeditpro-worker-temp/activation-pro-color-image/phase40c/<runId>/`

## Commit Policy

Do not commit generated frames, transformed frames, contact sheets, private JSON
reports, logs, credentials, public URLs, signed URLs, or large binary outputs.
Commit only code, docs, and sanitized evidence summaries.

