# Prompt 20I Local Supabase Migration Chain Repair Follow-Up 2

## Summary

Prompt 20I repairs the next local-only Supabase migration-chain blocker found after Prompt 20H.

- Branch: `codex/rp-foundation-20i-local-supabase-migration-chain-repair-follow-up-2`
- Base: `origin/codex/rp-foundation-20h-local-supabase-migration-chain-repair-follow-up`
- PR title: `[foundation] Prompt 20I local Supabase migration chain repair follow-up 2`
- Exact production capability enabled: `none; local-only Supabase migration chain repair`

## Allowed Scope

- Patch only `supabase/migrations/202605180002_reeditpro_media_source_sequence.sql`.
- Add additive compatibility columns for existing `public.media_assets` schema-era tables.
- Guard `idx_media_assets_project_status` creation.
- Run local-only Supabase safety probes and `supabase start` after no-remote gates pass.
- Record exact local migration-chain evidence.

## Forbidden Scope

No staging Supabase, remote Supabase, production Supabase, `supabase link`, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, production/beta unlock, or broad service-role handler is enabled.

## Deliverables

- Add media migration compatibility columns and guarded project/status index creation.
- Add Prompt 20I validation/results doc.
- Update local Supabase evidence, manifest, beta scorecard, blocker inventory, production status, source-of-truth map, milestone plan, workflow trigger, and implementation tracker.
- Push branch and open a PR.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20h-local-supabase-migration-chain-repair-follow-up...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`
- `supabase stop --no-backup`
- `supabase start`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Result

Prompt 20I repairs the `public.media_assets.status` migration-chain blocker. Local `supabase start` passes `202605180002_reeditpro_media_source_sequence.sql` and stops at the next migration, `202605180003_reeditpro_intent_plan_versions.sql`, because `public.edit_plan_segments.edit_plan_version_id` is missing before `idx_edit_plan_segments_plan_order` is created.

No SQL/RLS smoke test ran, no localhost-only DB URL was captured, and no staging/remote/production Supabase target was touched.
