# Staging Supabase Command Safety Checklist

Current packet state: `blocked_missing_evidence` and `blocked_missing_approval`.

Prompt 25A adds the GCP Secret Manager Supabase reference rule. Future command packets must use reference placeholders such as `<GCP_SECRET_REF_SUPABASE_STAGING_PROJECT_REF>` and `<GCP_SECRET_REF_SUPABASE_STAGING_DB_URL>` instead of raw Supabase values.

Use this checklist before any future staging Supabase/RLS command packet is considered executable. Prompt 25 does not execute the checklist against a real Supabase environment.

## Approval Gates

| Gate | Required before staging command execution | Prompt 25 state |
| --- | --- | --- |
| Human approval completion record | Required | Missing |
| Redacted evidence acceptance | Required | Missing |
| Staging project identity confirmed | Required | Missing |
| Production project separation confirmed | Required | Missing |
| Approved branch named | Required | Placeholder only |
| Approved commit named | Required | Placeholder only |
| Approved SQL files named | Required | Placeholder only |
| Rollback owner named | Required | Missing |
| Cleanup owner named | Required | Missing |

## Safety Checks

- No production project may be targeted.
- No production data may be used.
- No service-role key may be pasted, printed, committed, or requested in repo docs.
- No database password may be pasted, printed, committed, or requested in repo docs.
- No provider key, Stripe key, JWT secret, signed URL, private media URL, or raw connection string may appear in evidence.
- No dashboard mutation may happen in Prompt 25.
- No Supabase lifecycle command may run in Prompt 25.
- No SQL may run in Prompt 25.
- No staging execution approval is granted by Prompt 25.
- No production or beta unlock is granted by Prompt 25.

## Required Placeholders

Future templates must use placeholders only:

- `<REDACTED_STAGING_PROJECT_REF>`
- `<APPROVED_BRANCH>`
- `<APPROVED_COMMIT>`
- `<APPROVED_SQL_FILE>`
- `<REDACTED_LOCAL_OR_STAGING_DB_URL>`

## Current Result

- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Next allowed preparation: Prompt 23A human approval completion and Prompt 24B redacted evidence review if evidence is supplied.
