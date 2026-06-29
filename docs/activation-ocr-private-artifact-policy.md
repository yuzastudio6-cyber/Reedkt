# OCR Private Artifact Policy

Phase 37C artifacts are private QA artifacts only. They may include generated fixture images and JSON reports. They must not include model archives, extracted model files, venvs, credentials, signed URLs, node_modules, temp directories, or real media.

Allowed upload prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37c/generated-ocr-runtime/<run-id>/`

The upload confirmation `REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD=true` is required. Public ACLs, public buckets, signed URL source-of-truth, and production delivery paths remain blocked.
