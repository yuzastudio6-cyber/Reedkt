# Connected Supabase Read-Only Audit Record

Prompt 26A records connected Supabase read-only metadata and advisor findings supplied from a prior ChatGPT read-only audit. It does not re-fetch Supabase data, call Google Cloud, fetch Secret Manager metadata, fetch Secret Manager values, run SQL, run migrations, or approve staging execution.

## Connected Project Summary

- Connected audit status: `partially_reviewed_connected_metadata`.
- Active project name: Reeditpro.
- Redacted project ref: `wmyy****ishd`.
- Region: `us-west-1`.
- Project status: `ACTIVE_HEALTHY`.
- Database engine: Postgres 17.
- Database version: `17.6.1.121`.
- Organization note: one older inactive/default project also exists.
- Edge Functions deployed: none.

## Schema And Types Evidence

Generated TypeScript database types from the connected project confirm a large existing ReeditPro schema. Examples observed include `activation_artifacts`, `activation_qa_gates`, `activation_runs`, `agent_outputs`, `agent_runs`, `ambient_sound_plans`, and `api_idempotency_keys`.

This evidence is useful for triage, but it is not a complete accepted redacted evidence package. Row data, keys, payloads, service-role material, and full project refs remain excluded.

## Advisor Evidence

Security advisor findings were reported for:

- RLS-enabled tables with no policies.
- Helper/runtime functions with mutable `search_path` warnings.
- SECURITY DEFINER functions callable by anon or authenticated roles.

Performance advisor findings were reported for unindexed foreign keys across runtime and foundation tables. Prompt 26A records these findings for future hardening only.

## Logs Summary

Postgres logs showed recent connection/authentication activity. Prompt 26A does not infer staging validation, migration execution, SQL execution, or runtime readiness from those logs.

## Limitations

- Redacted dashboard/file evidence remains missing.
- Secret Manager reference metadata evidence remains missing.
- Human approval remains `pending_human_approval`.
- Staging SQL remains blocked.
- Production and beta remain blocked.

## Scope Confirmation

- Supabase mutation: no.
- Supabase SQL execution: none.
- Local SQL execution: none.
- Staging/remote/production Supabase execution: no.
- Google Cloud API touched: no.
- Secret Manager API touched: no.
- Secret Manager metadata fetched: no.
- Secret Manager values fetched: no.
- Secrets recorded: no.
- Production/beta unlock: no.

