# Phase 39C-SG Credential Redaction Policy

Phase 39C-SG-AUTH-RERUN records auth metadata only. It must not print, upload, or commit credential material.

Blocked content:

- access tokens,
- refresh tokens,
- authorization headers,
- service-account JSON keys,
- credential file contents,
- `.env` files,
- signed URLs,
- Cloud Build or Cloud Run logs containing secrets.

Allowed committed metadata:

- active account or service-account email,
- whether credential-related env vars are present,
- sanitized gcloud config with token, secret, password, credential, and key fields redacted,
- probe command IDs and pass/fail status,
- safe error summaries with token-like values redacted,
- Cloud Build IDs, image digests, Cloud Run job names, private artifact prefixes, and blocker categories.

The preflight may verify token validity only by running gcloud token commands with output suppressed. Token values are never logged or stored.
