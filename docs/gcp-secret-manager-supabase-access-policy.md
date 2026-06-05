# GCP Secret Manager Supabase Access Policy

Prompt 25A defines access policy for future Supabase Secret Manager references. It does not grant IAM access, fetch Secret Manager values, or verify Secret Manager contents.

## Least-Privilege Rules

- Staging references and production references must use separate Secret Manager entries.
- Production references must not be available to staging validation service accounts.
- Service-role and JWT references must never be frontend-visible.
- Frontend code must not receive raw Supabase values from docs, PR text, fixtures, or scripts.
- Future workers may access only the specific secret references required for an approved job class.
- Manual operators must use approved runbooks and must not paste values into repo artifacts.

## Future Access Review Requirements

Before any future staging or production secret access, the approval packet must name:

- environment;
- reference name;
- purpose;
- operator or service account;
- IAM role;
- audit log owner;
- rotation owner;
- emergency revocation owner;
- evidence path.

Prompt 25A records none of these as approved.

## Metadata Discovery Boundary

Future metadata-only discovery can verify that expected references exist without revealing payloads. That discovery must use an approved operator or service account, must not access secret versions, and must record only redacted evidence.

Allowed evidence for metadata discovery:

- expected reference name present or missing;
- redacted project scope;
- redacted labels;
- IAM summary without sensitive principal details;
- rotation status summary;
- audit log summary.

Forbidden evidence:

- secret payloads;
- database URLs;
- service-role keys;
- anon key values;
- JWT secret values;
- signed URLs;
- complete connection strings;
- private operator account details.

## Audit And Logging

Future access must produce redacted evidence that proves access was controlled without exposing the value. Logs must not include secret payloads, raw database URLs, raw keys, signed URLs, passwords, or tokens.

CI logs must not print Secret Manager payloads. PR bodies must reference only placeholder names and redacted evidence summaries.

## Rotation

Rotation must be documented for every future reference. Production rotation must be reviewed separately from staging rotation. Rotation evidence must prove completion without exposing old or new values.

## Emergency Revocation

If a value is exposed, the response must be rotation first and documentation second. Any affected staging or production command packet must be marked blocked until the value is revoked, replaced, and reviewed.
