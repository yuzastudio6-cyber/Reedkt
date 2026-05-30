# OCR Private Artifact Policy

Phase 37C artifacts are private QA artifacts only. They may include generated fixture images and JSON reports. They must not include model archives, extracted model files, venvs, credentials, signed URLs, node_modules, temp directories, or real media.

Allowed upload prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37c/generated-ocr-runtime/<run-id>/`

The upload confirmation `REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD=true` is required. Public ACLs, public buckets, signed URL source-of-truth, and production delivery paths remain blocked.

Phase 37D does not upload artifacts. It defines future private controlled-real-video OCR safe-zone schemas only. If a later approved execution phase runs, its private QA prefix must be:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37d/controlled-real-video-ocr-safe-zone/<run-id>/`

The future upload confirmation `REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD=true` must not be set during the Phase 37D metadata-only gate.
