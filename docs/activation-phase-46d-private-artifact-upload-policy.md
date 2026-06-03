# Phase 46D Private Artifact Upload Policy

Phase 46D-AUTH-RERUN may upload metadata-only QA artifacts to:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46d/reporting-qa-integration/<run-id>/`

Uploads require `REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD=true`.

Allowed uploads:

- JSON auth reports
- private metadata access report
- DuckDB/Polars metadata table summaries
- consistency report
- readiness scorecard
- blocker summaries
- private artifact manifest

Forbidden uploads:

- credentials or tokens
- media files
- frames
- thumbnails
- OCR/VLM/provider logs
- signed URLs
- public artifacts
- raw private payloads

If scoped IAM is missing, broad roles must not be granted. A scoped IAM update may occur only when an existing scoped plan requires it and `REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA_SCOPED_IAM_UPDATE=true` is set.
