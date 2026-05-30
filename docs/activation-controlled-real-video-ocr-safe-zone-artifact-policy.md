# Controlled Real-Video OCR Safe-Zone Artifact Policy

Phase 37D does not upload artifacts. It defines future private artifact schemas only.

If a later approved execution phase runs, artifacts must be written only under:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37d/controlled-real-video-ocr-safe-zone/<run-id>/`

Allowed future artifacts are private JSON reports, private sampled frame artifacts, private OCR text-region metadata, private caption safe-zone metadata, private collision reports, and private artifact manifests.

Disallowed artifacts include committed media files, model archives, extracted model directories, venvs, node_modules, credentials, secrets, signed URLs, public URLs, arbitrary source media, temporary runtime folders, and Track A outputs.
