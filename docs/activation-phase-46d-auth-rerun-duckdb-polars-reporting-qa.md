# Phase 46D-AUTH-RERUN DuckDB/Polars Reporting QA

Phase 46D-AUTH-RERUN adds a noninteractive GCP auth/access gate in front of the existing Phase 46D metadata-only DuckDB/Polars reporting QA integration.

The rerun is still metadata-only. It may read only approved Phase 46B and Phase 46C private JSON metadata artifacts and may upload only Phase 46D metadata-only QA reports to the approved private QA prefix.

It must not process media, generated media, real media, frames, thumbnails, OCR, VLM, providers, Docker, Cloud Build, Cloud Run, GPU jobs, broad IAM, beta, production, public output, or Track A.

Required execution confirmations are current-shell only:

- `REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA_AUTH_PREFLIGHT=true`
- `REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA=true`
- `REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_READ=true`
- `REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD=true`

If auth/access passes, the rerun delegates to the existing Phase 46D reporting worker and records auth-rerun copies of the input manifest, DuckDB tables, Polars tables, consistency report, readiness scorecard, private artifact manifest, and recovery report.

If auth/access fails, the rerun stops before private reads and writes exact blocker/operator-action reports. Media/data tool-family beta status remains `blocked`.
