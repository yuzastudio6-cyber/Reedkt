# Staging Supabase Command Evidence Template

This template is for future human-approved staging command evidence. Prompt 25 does not fill it with real Supabase output and does not run any command.

## Packet Header

- Evidence packet ID:
- Human approval decision record:
- Approval owner:
- Reviewer:
- Approved branch: `<APPROVED_BRANCH>`
- Approved commit: `<APPROVED_COMMIT>`
- Approved SQL file: `<APPROVED_SQL_FILE>`
- Staging project ref: `<REDACTED_STAGING_PROJECT_REF>`
- Database target: `<REDACTED_LOCAL_OR_STAGING_DB_URL>`
- Production project touched: no
- Supabase environment touched by Prompt 25: none
- SQL executed by Prompt 25: none
- Migration deployed by Prompt 25: no

## Command Evidence Fields

For each future approved command, record:

- command category;
- exact approval reference;
- redacted command summary;
- timestamp;
- operator;
- output summary without secrets;
- pass/fail result;
- blocker, if any;
- cleanup result;
- rollback result, if needed;
- confirmation that no service-role key, database password, JWT secret, provider key, Stripe key, signed URL, private media URL, or raw connection string was captured.

## Redaction Requirements

Evidence must redact:

- project refs except the approved redacted label;
- full connection strings;
- anon keys;
- service-role keys;
- JWT secrets;
- database passwords;
- private data values;
- signed URLs;
- private media URLs;
- provider keys;
- Stripe keys.

## Future Command Evidence Skeleton

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Record approved future command evidence for <REDACTED_STAGING_PROJECT_REF> <APPROVED_BRANCH> <APPROVED_COMMIT> <APPROVED_SQL_FILE> <REDACTED_LOCAL_OR_STAGING_DB_URL>"
```

## Current Prompt 25 Evidence

- Evidence status: `evidence_required`.
- Approval status: `blocked_missing_approval`.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
