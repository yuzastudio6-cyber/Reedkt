# GCP Secret Manager Supabase Command Placeholder Policy

Future staging and production command packets must use Secret Manager reference placeholders, not raw Supabase values.

## Allowed Placeholder Forms

Allowed placeholder forms are reference-only:

- `<GCP_SECRET_REF_SUPABASE_STAGING_DB_URL>`
- `${GCP_SECRET_REF_SUPABASE_STAGING_DB_URL}`
- `<GCP_SECRET_REF_SUPABASE_STAGING_PROJECT_REF>`
- `<GCP_SECRET_REF_SUPABASE_PRODUCTION_PROJECT_REF>`
- `gcp-secret://projects/<GCP_PROJECT_PLACEHOLDER>/secrets/<GCP_SECRET_NAME_PLACEHOLDER>/versions/latest`

The URI-style form is allowed only with placeholders. Real project IDs, real secret names, real versions, and payloads are not allowed in Prompt 25A.

## Required Warning

Any future command block that names a Secret Manager reference must include:

`DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.`

Prompt 25A does not add executable secret-fetch commands.

## Forbidden Command Content

Future command packets must not include raw:

- Supabase database URLs;
- database passwords;
- service-role keys;
- anon keys;
- JWT secrets;
- signed URLs;
- provider keys;
- Stripe keys;
- project refs;
- connection strings.

Secret Manager value-access commands are forbidden in Prompt 25A. Future prompts may introduce reviewed command templates only after human approval and redacted evidence are accepted.

## Evidence Redaction

Evidence may show that a Secret Manager reference exists only by reference name, redacted resource metadata, and access-control summary. Evidence must not show payloads, complete resource paths, full connection strings, tokens, keys, or passwords.

## Prompt 25 Command Packet Compatibility

Prompt 25 placeholders remain blocked templates. Prompt 25A adds a stronger rule: future staging DB and project placeholders should be backed by `GCP_SECRET_REF_` names once human approval and evidence gates are complete.
