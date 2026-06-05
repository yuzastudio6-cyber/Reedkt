# Supabase Evidence File Template Index

Create supplied redacted evidence files in `docs/supabase-readonly-audit-evidence/`. Templates live in `docs/supabase-readonly-audit-evidence/templates/` and are instruction files only.

Do not paste secrets. Do not include Secret Manager payloads, database passwords, JWT secrets, provider keys, Stripe keys, signed URLs, full database URLs, private media URLs, or raw user row data.

| Evidence file to create | Template | Purpose | Required safe fields | Forbidden fields | Redaction notes |
| --- | --- | --- | --- | --- | --- |
| `project-identity-redacted.md` | `templates/project-identity-redacted.template.md` | Identify the Supabase project and access posture without exposing sensitive refs. | Environment label, redacted project label/ref, dashboard section reviewed, access summary, collector, date. | Raw project ref if policy says redact, account emails, service-role values, private URLs. | Redact project ref/account identifiers unless approved for display. |
| `gcp-secret-manager-reference-metadata-redacted.md` | `templates/gcp-secret-manager-reference-metadata-redacted.template.md` | Confirm expected Secret Manager references exist without payload access. | Reference name, environment, purpose, existence yes/no, rotation summary, access-owner summary. | Secret payload, version payload, raw DB URL, keys, tokens. | Use reference names only, such as `GCP_SECRET_REF_SUPABASE_STAGING_DB_URL`. |
| `database-migrations-redacted.md` | `templates/database-migrations-redacted.template.md` | Show migration state without executing SQL. | Migration filenames/status summary, environment label, screenshot/source section, collector, date. | SQL output with row data, connection strings, database passwords. | Screenshots must show migration names/status only. |
| `database-schema-redacted.md` | `templates/database-schema-redacted.template.md` | Show table/schema inventory without row data. | Table list summary, schema names, row-data excluded yes/no, collector, date. | Real rows, user data, PII, secrets, private media URLs. | Show table names and counts only when safe. |
| `rls-policies-redacted.md` | `templates/rls-policies-redacted.template.md` | Show RLS/policy inventory. | Table/policy names, enabled/disabled summary, collector, date. | Policy output containing private identifiers or secret expressions. | Prefer policy names and enabled state over full definitions. |
| `storage-buckets-redacted.md` | `templates/storage-buckets-redacted.template.md` | Show bucket and storage policy posture. | Bucket names if safe, public/private state, policy names, signed URLs absent yes/no. | Signed URLs, object paths with private media, storage transfer logs. | Redact object names and private user paths. |
| `auth-settings-redacted.md` | `templates/auth-settings-redacted.template.md` | Show auth settings without keys. | Provider enabled summary, redirect domain summary, MFA/email settings summary. | API keys, JWT secrets, OAuth client secrets, full redirect tokens. | Crop API key and secret panels entirely. |
| `edge-functions-redacted.md` | `templates/edge-functions-redacted.template.md` | Show edge function inventory or no-functions evidence. | Function names if safe, deployment state summary, env values hidden yes/no. | Env values, service keys, logs with payloads. | If none exist, state no functions observed and source section. |
| `activity-summary-redacted.md` | `templates/activity-summary-redacted.template.md` | Show activity/log summary without payloads. | Timestamp ranges, action categories, error counts, payloads excluded yes/no. | Raw request bodies, user data, tokens, private URLs. | Summarize, do not paste log lines with payloads. |
| `milestone-sync-state-redacted.md` | `templates/milestone-sync-state-redacted.template.md` | Show whether a Supabase milestone/status record exists. | Status-record presence yes/no, environment label, evidence source, no backfill executed yes/no. | SQL output, production update claims, raw ledger rows with PII. | This is status evidence only; do not claim staging update applied. |

## Current Status

- Evidence status: `evidence_required`.
- Actual evidence files found: no counted evidence files.
- Template files created: yes.
- Evidence files accepted: no.
- Staging approval granted: no.
- Production/beta readiness: blocked.
