# Production Signed URL Safety Policy

Signed URLs are not canonical storage refs. They must not be persisted in worker payloads, artifact records, logs, audit records, or readiness reports.

Temporary signed URLs belong to a future delivery/share layer with expiration, audit, and privacy controls.
