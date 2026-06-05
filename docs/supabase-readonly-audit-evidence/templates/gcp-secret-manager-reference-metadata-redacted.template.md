# GCP Secret Manager Reference Metadata Redacted Evidence Template

DO NOT PASTE SECRETS.

## Safe Fields To Fill

- Evidence category: Secret Manager reference metadata only.
- Environment label:
- Collection date:
- Collector:
- Reference names observed:
- Purpose per reference:
- Reference exists yes/no:
- Payload viewed: no.
- Version policy summary, no payload:
- Access owner/role summary, no token:
- Rotation status summary:
- Last rotated date if safe:
- Values intentionally hidden:
- Redaction status:

## Forbidden Values

Do not include secret payloads, secret version values, service-role keys, anon key values, JWT secrets, database passwords, full database URLs, provider keys, Stripe keys, signed URLs, IAM tokens, OAuth tokens, or private media URLs.

## Redaction Instructions

Use reference names such as `GCP_SECRET_REF_SUPABASE_STAGING_DB_URL`. Never paste the Secret Manager value or screenshot a secret version payload.
