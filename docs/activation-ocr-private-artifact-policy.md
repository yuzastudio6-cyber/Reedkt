# OCR Private Artifact Policy

Phase 37C artifacts are private QA artifacts only. They may include generated fixture images and JSON reports. They must not include model archives, extracted model files, venvs, credentials, signed URLs, node_modules, temp directories, or real media.

Allowed upload prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37c/generated-ocr-runtime/<run-id>/`

The upload confirmation `REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD=true` is required. Public ACLs, public buckets, signed URL source-of-truth, and production delivery paths remain blocked.

Phase 37D metadata planning defines private controlled-real-video OCR safe-zone schemas only. Phase 37D controlled execution run `phase37d-20260531T002046` uploaded only private JSON QA artifacts to:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37d/controlled-real-video-ocr-safe-zone/phase37d-20260531T002046/`

Future Phase 37D execution reruns require `REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD=true` in the current shell. The metadata-only gate still rejects that confirmation when set. Raw frames, overlays, source media, model files, venvs, temp folders, signed URLs, public URLs, credentials, and Track A outputs remain disallowed.
