# Supabase Read-Only Audit Evidence Request

Prompt 24C makes the evidence request concrete. A human/operator should create supplied evidence files under `docs/supabase-readonly-audit-evidence/` using the templates in `docs/supabase-readonly-audit-evidence/templates/`.

Do not include secrets, keys, passwords, connection strings, signed URLs, private media URLs, raw row data, real user data, or screenshots that reveal sensitive values.

## Exact Files To Create

| File to create | Safe fields to include | Template |
| --- | --- | --- |
| `project-identity-redacted.md` | Environment label, redacted project label/ref, staging/production separation, redacted access summary, collector, date. | `templates/project-identity-redacted.template.md` |
| `gcp-secret-manager-reference-metadata-redacted.md` | Secret reference names, environment, purpose, reference exists yes/no, rotation/access summary, payload viewed: no. | `templates/gcp-secret-manager-reference-metadata-redacted.template.md` |
| `database-migrations-redacted.md` | Migration filenames/status summary and latest observed migration. | `templates/database-migrations-redacted.template.md` |
| `database-schema-redacted.md` | Schema/table inventory summary with row data excluded. | `templates/database-schema-redacted.template.md` |
| `rls-policies-redacted.md` | RLS enabled summary and policy names/state only. | `templates/rls-policies-redacted.template.md` |
| `storage-buckets-redacted.md` | Bucket public/private state plus storage policy names/state; no signed URLs or object secrets. | `templates/storage-buckets-redacted.template.md` |
| `auth-settings-redacted.md` | Provider enabled summary, redirect/domain summary, MFA/email settings summary; API key panels excluded. | `templates/auth-settings-redacted.template.md` |
| `edge-functions-redacted.md` | Function inventory or no-functions confirmation with env values hidden. | `templates/edge-functions-redacted.template.md` |
| `activity-summary-redacted.md` | Timestamp range, action categories, error count summary, payloads excluded. | `templates/activity-summary-redacted.template.md` |
| `milestone-sync-state-redacted.md` | Status-record presence, update type/status, no backfill executed, no staging sync applied unless future accepted evidence proves otherwise. | `templates/milestone-sync-state-redacted.template.md` |

## Upload Or Commit Path

Use `docs/supabase-readonly-audit-evidence/` for supplied Markdown evidence files. Do not put supplied evidence in `templates/`; files under `templates/` are instruction files and are not counted as evidence.

## Google Cloud Secret Manager Metadata-Only Rule

For Secret Manager evidence, provide reference metadata only:

- reference name;
- environment label;
- purpose;
- reference exists yes/no;
- rotation summary;
- access-owner or role summary;
- payload viewed: no.

Do not fetch, paste, screenshot, or summarize Secret Manager payloads or values.

## What Not To Provide

Do not provide service-role keys, anon keys, JWT secrets, database passwords, full database connection strings, provider keys, Stripe keys, signed URLs, tokenized URLs, private media URLs, raw user records, raw row data, raw log payloads, or private PII.

## Current Status

No redacted evidence files are currently present in the tracked allowed evidence paths. Template files are instruction files only. The audit state remains `evidence_required`.
