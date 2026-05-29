# Phase 35C SAM2 Runtime Artifact Policy

Runtime artifacts must remain private and must not be committed to git.

Generated-assets prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-sam2-runtime/phase35c/<runId>/`

Expected generated artifacts:

- `fixture/frames/frame-000.png` through `frame-004.png`
- `fixture/fixture-manifest.json`
- `prompt/prompt-metadata.json`
- `masks/frame-000-mask.png` through `frame-004-mask.png`
- `overlays/frame-000-overlay.png` through `frame-004-overlay.png`
- `metadata/sam2-runtime-metadata.json`
- `metadata/model-checksum-verification.json`

QA prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-sam2-runtime/phase35c/<runId>/`

Expected QA artifacts:

- `qa/sam2-runtime-qa.json`
- `reports/phase35c-report.json`

No public URLs, signed URLs, generated frames, masks, overlays, model weights,
downloaded configs, logs, credentials, or private artifacts may be committed.
