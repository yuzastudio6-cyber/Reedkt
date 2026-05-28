# Activation Real Video Enhancement Sample Artifact Policy

Phase 34D artifacts are private and retained for review.

Generated artifacts live under:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase34d/<runId>/`

QA artifacts live under:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase34d/<runId>/`

Expected artifacts:

- `sample/input-sample.png`
- `enhanced/enhanced-sample.png`
- `metadata/before-after-metadata.json`
- `qa/enhancement-sample-qa.json`
- `reports/phase34d-report.json`

Do not commit image outputs, model weights, or temporary runtime files to git. Do not create public signed URLs.
