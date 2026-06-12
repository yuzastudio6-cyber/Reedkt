# Provider Storage Policy

Supabase may store, in a future approved live phase:

- provider call summary
- model id
- purpose
- cost estimate
- sanitized normalized response summary
- QA status
- milestone refs

GCS may store private provider validation artifacts if a later approved phase
needs them.

Do not store:

- raw secrets
- raw provider payloads when policy disallows them
- raw Brave responses
- signed URLs as source of truth
- private media blobs
- sensitive user data
- public artifacts

PROVIDER-1 artifacts are private JSON policy artifacts only.
