# Supabase Read-Only Audit Evidence Request

Prompt 24A requests redacted read-only evidence only. Do not include secrets, keys, passwords, connection strings, signed URLs, private media URLs, raw row data, real user data, or screenshots that reveal sensitive values.

## Requested Evidence

Please provide redacted evidence for:

- Supabase project identity and environment label.
- Staging-versus-production separation.
- Migration state or migration history.
- RLS policy/table state.
- Storage buckets and storage policies.
- Auth providers, redirects, and relevant auth settings.
- Edge function inventory or confirmation that none exist.
- Logs/activity summary.
- Milestone sync/status evidence, if any exists.

## Required Format

Evidence should be committed only under an allowed evidence path:

- `docs/evidence/`
- `docs/supabase-evidence/`
- `docs/redacted-evidence/`
- `docs/supabase-readonly-audit-evidence/`
- `docs/supabase-read-only-audit-evidence/`

Each supplied evidence file should state:

- evidence category;
- environment label;
- collection date;
- collector;
- redaction status;
- values intentionally removed;
- whether the evidence is staging, production, local, or unknown.

## What Not To Provide

Do not provide service-role keys, anon keys, JWT secrets, database passwords, full database connection strings, provider keys, Stripe keys, signed URLs, tokenized URLs, private media URLs, raw user records, raw row data, or private PII.

## Current Status

No redacted evidence files are currently present in the tracked allowed evidence paths. The audit state remains `evidence_required`.
