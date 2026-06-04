# Supabase Read-Only Audit Runbook

This runbook is for a future human or approved reviewer collecting redacted Supabase project inventory evidence. It is read-only.

## A. Preflight

1. Confirm the audit is read-only.
2. Confirm the environment label: staging or production.
3. Confirm no SQL will run.
4. Confirm no migrations will be applied.
5. Confirm no Supabase project will be linked.
6. Confirm no settings, users, buckets, policies, functions, secrets, or data will be changed.
7. Confirm no secrets or full connection strings will be captured.

## B. Dashboard Evidence Collection

Collect redacted summaries for:

- project identity;
- database and migrations;
- RLS table/policy state;
- storage buckets and policies;
- auth providers and redirect domains;
- edge functions, if any;
- logs and activity.

Use names, counts, timestamps, and redacted labels. Do not capture row data or key values.

## C. Evidence Redaction

Before committing or sharing evidence:

- remove service-role keys;
- remove anon keys unless explicitly approved and redacted;
- remove database passwords;
- remove JWT secrets;
- remove provider and Stripe keys;
- remove signed URLs and tokenized URLs;
- remove private media URLs;
- redact project refs unless a human reviewer explicitly allows a partial ref.

## D. Review

Compare observed Supabase state to repo expectations:

- migration order and applied migration list;
- required tables/functions/policies;
- RLS enabled/disabled table list;
- storage bucket privacy;
- auth provider/redirect configuration;
- edge function deployment state;
- activity-log expectations.

List drift, missing evidence, unexpected dashboard activity, and blockers.

## E. Decision

Use one result state:

- `evidence_required`
- `partially_reviewed`
- `ready_for_staging_inventory_review`
- `blocked`

Prompt 24 default is `evidence_required`. A read-only inventory result does not approve staging SQL, migration application, production use, or beta unlock.

