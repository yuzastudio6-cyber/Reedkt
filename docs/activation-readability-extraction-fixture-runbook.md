# Phase 49D Readability Extraction Fixture Runbook

Phase 49D validates Mozilla Readability on a generated local article fixture only.

Default report mode is static:

```sh
npm run activation:readability-extraction-fixture:report
npm run activation:readability-extraction-fixture:iam-plan
```

Execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_READABILITY_EXTRACTION_FIXTURE=true \
npm run activation:readability-extraction-fixture -- --execute
```

The runner creates a temp non-repo HTML article fixture, parses it with Mozilla Readability through jsdom, sanitizes and normalizes the result, and uploads private JSON/text artifacts under Phase 49D GCS prefixes.

Live search, public page extraction, browser capture, screenshots, Playwright, Sharp, paid providers, Docker, Cloud Run deploy, public artifacts, production, external beta, paid production, broad media, providers, and Revideo remain blocked.
