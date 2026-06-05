# Supabase Redacted Evidence Template

Prompt 25A note: Supabase evidence must reference GCP Secret Manager placeholders only, such as `<GCP_SECRET_REF_SUPABASE_STAGING_PROJECT_REF>`, and must not include Secret Manager payloads, raw Supabase values, or complete unredacted resource paths.

Use this template when a human reviewer supplies future read-only Supabase dashboard evidence. Do not paste secrets, keys, passwords, full connection strings, signed URLs, private media URLs, or row data.

## Evidence Metadata

- Evidence date:
- Reviewer:
- Environment: local / staging / production
- Project label:
- Project ref redacted:
- Evidence source: dashboard screenshot / dashboard text summary / CLI read-only summary / other
- Audit state: `evidence_required`

## Project Identity Evidence

- Project name:
- Region:
- Environment label:
- Staging-vs-production separation confirmed: yes / no / evidence_required
- Notes:

## Migration Evidence

- Applied migration filenames or dashboard labels:
- Migration count:
- Last migration timestamp, if visible:
- Drift suspected: yes / no / evidence_required
- Notes:

## Database And RLS Evidence

- Tables visible, names only:
- RLS-enabled tables:
- RLS-disabled tables:
- Policies visible, names only:
- Functions visible, names only:
- Extensions visible:
- Notes:

## Storage Evidence

- Bucket names:
- Public/private state by bucket:
- Storage policy names:
- Object path convention summary:
- Notes:

## Auth Evidence

- Enabled provider names:
- Redirect URL domains, redacted if needed:
- Email setting summary:
- JWT setting summary without secret values:
- Notes:

## Edge Function Evidence

- Function names:
- Deployment state:
- Secret policy summary without secret values:
- Notes:

## Logs And Activity Evidence

- Recent activity timestamps:
- Activity types:
- Migration activity:
- Auth activity, no PII:
- Storage activity, no URLs:
- Notes:

## Explicit Exclusions

Do not include:

- service-role keys;
- anon keys unless explicitly approved and still redacted;
- database passwords;
- JWT secrets;
- provider keys;
- Stripe keys;
- signed URLs;
- raw connection strings;
- private media URLs;
- private user row data.
