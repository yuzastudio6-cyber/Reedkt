# Phase 45C OpenTimelineIO Artifact Policy

Phase 45C artifacts must remain private staging artifacts.

Generated-assets prefix:

- `activation-render-hardening/phase45c/<runId>/timeline/opentimelineio-timeline.json`

QA-artifacts prefix:

- `activation-render-hardening/phase45c/<runId>/plan/approved-plan-snapshot.json`
- `activation-render-hardening/phase45c/<runId>/source/source-validation.json`
- `activation-render-hardening/phase45c/<runId>/timeline/timeline-validation.json`
- `activation-render-hardening/phase45c/<runId>/qa/opentimelineio-validation-qa.json`
- `activation-render-hardening/phase45c/<runId>/reports/phase45c-report.json`

Do not commit generated timeline JSON, private reports, logs, credentials, public URLs, signed URLs, or large artifacts.
