# Activation GCP Staging IAM Policy

Phase 22 plans least-privilege IAM only. Humans apply reviewed bindings later.

Forbidden:

- `roles/owner`
- `roles/editor`
- `allUsers`
- `allAuthenticatedUsers`
- broad project-wide storage admin
- public buckets or public media access

Service accounts are separated by runtime group. API gets runtime secrets only. CPU/render/QA workers get scoped bucket access. GPU provider/model secrets remain blocked until later approval. Tool-readiness has no source media access by default.
