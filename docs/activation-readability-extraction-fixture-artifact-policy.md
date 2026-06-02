# Phase 49D Readability Extraction Fixture Artifact Policy

Phase 49D stores only private generated/local extraction artifacts:

- Plan snapshot.
- Generated local article HTML.
- Raw Readability extraction JSON, private QA-only and not display-safe.
- Sanitized extraction JSON.
- Extracted text TXT.
- Extraction metadata JSON.
- Extraction artifact manifest JSON.
- QA and Phase 49D report JSON.

Artifacts are stored under private staging prefixes:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49d/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49d/<runId>/`

Do not commit generated HTML, raw/sanitized extraction JSON, extracted text, private reports, logs, credentials, screenshots, browser artifacts, public URLs, signed URLs, or large binaries.
