# Phase 35F SAM2 Feature E2E Artifact Policy

All Phase 35F artifacts are private staging artifacts.

Generated assets:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35f/<runId>/plan/approved-plan-snapshot.json`
- source validation, preview scope, extracted preview frames, composition metadata, model checksum verification, and runtime metadata

Masks:

- `gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35f/<runId>/masks/`
- overlays and mask-sequence metadata

Previews:

- `gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35f/<runId>/preview-frames/`
- optional private MP4/contact sheet when available
- private review manifest

QA:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35f/<runId>/qa/`
- `reports/phase35f-report.json`

Do not commit generated frames, masks, overlays, preview clips, private reports, model files, logs, credentials, or large binary artifacts to git.
