# GCP Secret Manager Reference Metadata Evidence Guide

Prompt 24C provides metadata-only guidance. It does not call Google Cloud, Secret Manager, Supabase, SQL, or any runtime system.

## Rule

Secret Manager values must not be fetched, pasted, summarized, screenshot, logged, or committed. Only reference metadata is allowed.

## Acceptable Metadata

- Secret reference name, for example `GCP_SECRET_REF_SUPABASE_STAGING_DB_URL`.
- Environment label: local, staging, production, or unknown.
- Purpose: project ref, DB URL reference, anon key reference, service-role reference, JWT secret reference, or storage endpoint reference.
- Version policy summary, not payload.
- Access owner or role summary, without tokens or private principals.
- Rotation status summary.
- Last rotated date if safe and non-sensitive.
- Evidence source section, such as Secret Manager secret list or policy summary.

## Forbidden Content

- Secret payload.
- Service-role key.
- Anon key value.
- JWT secret.
- Database password.
- Full DB URL with password.
- Provider keys.
- Stripe keys.
- Signed URLs.
- IAM tokens.
- OAuth tokens.
- Private media URLs.

## Safe Examples

Good:

- `referenceName: GCP_SECRET_REF_SUPABASE_STAGING_DB_URL`
- `referenceExists: yes`
- `payloadViewed: no`
- `rotationSummary: rotation policy present; cadence redacted`

Bad:

- actual database connection string;
- pasted Secret Manager value;
- screenshot of secret version payload;
- command output that includes secret bytes.

## Review Outcome

Secret Manager reference metadata evidence can support a future redacted evidence review. It does not approve Secret Manager payload access, staging SQL, staging execution, production readiness, or beta unlock.
