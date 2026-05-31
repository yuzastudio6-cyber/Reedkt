# Controlled Real-Video OCR Safe-Zone Artifact Policy

Phase 37D metadata planning does not upload artifacts. The Phase 37D controlled execution follow-up uploads private JSON QA artifacts only after the execution confirmations are set in the current shell.

If a later approved execution phase runs, artifacts must be written only under:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37d/controlled-real-video-ocr-safe-zone/<run-id>/`

Allowed execution artifacts are private JSON reports, private OCR text-region metadata, private caption safe-zone metadata, private collision reports, and private artifact manifests.

Disallowed uploads include raw frames, thumbnails, overlays, source video, model archives, extracted model directories, venvs, node_modules, credentials, secrets, signed URLs, public URLs, arbitrary source media, temporary runtime folders, and Track A outputs.

Phase 37D execution run `phase37d-20260531T002046` uploaded exactly 10 JSON objects to the private prefix and did not upload frames or overlays.
