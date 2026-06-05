# Phase 51B Supabase Milestone Registry Policy

Supabase is the structured ledger for activation and readiness records. GCS
remains the private artifact store.

Registry tables:

- `activation_runs`
- `activation_artifacts`
- `activation_qa_gates`
- `readiness_snapshots`
- `tool_capabilities`
- `feature_gates`

All registry tables are service-role-only:

- RLS is enabled.
- `public`, `anon`, and `authenticated` direct table access is revoked.
- Direct table access is granted only to `service_role`.

Writer rules:

- Upserts are idempotent on phase/run and natural keys.
- Artifact source-of-truth values must be private `gs://` paths.
- Signed URLs cannot be source of truth.
- Public artifact URLs are rejected.
- Secret-looking values are rejected before writes.
- Production, external beta, paid production, broad media, public artifact,
  provider execution, raw prompt execution, and frontend service-role exposure
  gates remain disabled.

Migration rules:

- `create table if not exists` only.
- No drops, data resets, destructive alters, public policies, or frontend grants.
- Migration apply uses local `psql` only after explicit confirmation and direct
  DB URL availability.
- Service-role REST may verify or write registry rows, but must never run DDL.
