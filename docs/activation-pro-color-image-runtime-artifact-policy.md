# Phase 40B Pro Color/Image Artifact Policy

Phase 40B artifacts are private staging artifacts only.

Generated assets:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/<runId>/`

QA artifacts:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40b/<runId>/`

Optional worker temp:

`gs://reeditpro-staging-reeditpro-worker-temp/activation-pro-color-image/phase40b/<runId>/`

Allowed artifacts:

- generated fixture PNGs
- fixture manifest
- OpenImageIO/Kornia derived generated-fixture outputs
- runtime metadata
- QA JSON
- Phase 40B report

Do not commit generated images, private report JSON, logs, credentials, Docker
outputs, or large binaries. Do not create public URLs or signed URLs as source
of truth.
