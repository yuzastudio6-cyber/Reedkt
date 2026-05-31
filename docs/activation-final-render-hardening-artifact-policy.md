# Phase 45D Final Render Hardening Artifact Policy

Phase 45D stores only private review and QA artifacts.

## Private Prefixes

- Hardened review export: `gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/<runId>/review/`
- QA artifacts and report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45d/<runId>/`

Expected artifacts:

- `plan/approved-plan-snapshot.json`
- `source/source-validation.json`
- `evidence/evidence-validation.json`
- `review/hardened-review-export.mp4`
- `export/ffprobe-export-validation.json`
- `qa/final-render-hardening-qa.json`
- `reports/phase45d-report.json`

Do not commit generated exports, private JSON reports, logs, credentials, signed URLs, public URLs, or large binaries.
