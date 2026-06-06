# Prompt: Supabase Track B Staging Backfill After Transport Deploy

Use this prompt only after `supabase-staging-deploy-transport-rerun` reports that the activation milestone registry schema/RLS migration was deployed and verified in staging.

Goal:

- Rerun the PR #198 guarded Track B milestone staging backfill.
- Consume the safe Phase 44P export only.
- Write staging metadata rows only after explicit backfill confirmations.

Required preconditions:

- Approved staging target remains `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- Registry schema and RLS verification reports pass.
- PR #198 preflight and diff pass.
- No production credentials or direct SQL path is selected.

Still forbidden:

- production Supabase
- migration deployment
- schema mutation
- direct/manual SQL
- route/tool/worker execution
- provider calls
- media processing
- public artifacts
- beta or production unlock
- Track A
