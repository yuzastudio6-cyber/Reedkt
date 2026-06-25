# RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1

Implement the next internal beta gate after `RP-INTERNAL-BETA-GOOGLE-CLOUD-RUNTIME-CONFIG-CONTRACT-1`.

Goal: validate the named non-production Supabase target, RLS policy boundary, private storage boundary, and service-role-only mutation model before any real internal beta runtime executes.

Required source inputs:

- `server/config/internal-beta-google-cloud-runtime-config-contract.ts`
- `docs/internal-beta/rp-internal-beta-google-cloud-runtime-config-contract-1/google-cloud-runtime-config-contract-record.json`
- `edit-planning-database-architecture.md`
- `approved-plan-snapshot-policy.md`
- `supabase-schema-planning-bridge.md`
- `database-migration-readiness-checklist.md`
- `supabase-table-specification.md`
- `sql-migration-draft-review.md`
- `supabase-rls-policy-draft.md`
- `supabase-storage-bucket-draft.md`

Boundary:

- Do not apply migrations unless an explicit migration execution prompt approves it.
- Do not mutate remote Supabase unless the prompt names the target and confirmation gate.
- Do not read service-role secret payloads into logs or docs.
- Do not expose service-role credentials to frontend code.
- Do not create signed URLs or public artifacts.
- Do not enqueue jobs, execute workers, process media, call providers/models, render/export, or unlock beta/production.

Expected conservative result if target evidence is still incomplete:

`blocked_pending_named_supabase_target_rls_storage_validation`
