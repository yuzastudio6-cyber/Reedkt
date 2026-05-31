# Phase 45A Libass Burn-In Artifact Policy

Phase 45A writes only private staging artifacts under:

- `gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45a/<runId>/`

Expected artifacts:

- approved plan snapshot
- source validation JSON
- caption validation JSON
- private burn-in preview MP4
- FFprobe preview validation JSON
- QA report
- Phase 45A report

Do not commit generated previews, private JSON reports, downloaded source media,
caption sidecars, logs, credentials, signed URLs, or large binary artifacts.
