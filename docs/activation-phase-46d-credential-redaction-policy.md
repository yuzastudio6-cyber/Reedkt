# Phase 46D Credential Redaction Policy

Phase 46D-AUTH-RERUN auth diagnostics must never print or commit:

- access tokens
- refresh tokens
- service-account keys
- credential file contents
- JSON private keys
- authorization headers
- local credential paths when they reveal sensitive user paths

Reports may record:

- whether an environment variable is present
- active principal email
- impersonated service-account email
- auth path used
- token validation pass/fail
- sanitized command summaries

Service-account keys are not used, not created, and not committed. Browser login inside Codex is blocked.
