# Phase 33E Text-Behind-Subject Frame Artifact Policy

Phase 33E artifacts are private and retained for review under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33e/<runId>/`
- `gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase33e/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase33e/<runId>/`

Expected artifacts are `text-layer-plan.json`,
`depth-composition-manifest.json`, `text-behind-subject-preview.png`,
`text-behind-subject-frame-qa.json`, and `phase33e-report.json`.

Preview images and generated metadata must not be committed to git. No public
signed URL may be used as source of truth.
