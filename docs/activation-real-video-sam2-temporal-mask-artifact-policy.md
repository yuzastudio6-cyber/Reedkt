# Phase 35D Real-Video SAM2 Artifact Policy

No model files, extracted frames, masks, overlays, private JSON reports,
credentials, logs, or generated media may be committed to git.

Private generated-assets artifacts:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/<runId>/segment/`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/<runId>/prompt/`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/<runId>/metadata/`

Private mask artifacts:

- `gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/<runId>/masks/`
- `gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/<runId>/overlays/`
- `gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/<runId>/metadata/`

Private QA artifacts:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35d/<runId>/qa/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35d/<runId>/reports/`

Public access, signed URL source-of-truth artifacts, public bucket IAM, and
broad bucket write permissions are blocked.
