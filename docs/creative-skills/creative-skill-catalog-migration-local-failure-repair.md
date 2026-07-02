# RP-SKILLS-40 Creative Skill Catalog Migration Local Failure Repair

## A. Purpose

RP-SKILLS-40 repairs the local migration-chain blocker found during RP-SKILLS-39, then reruns local-only migration reset far enough to prove whether the repaired migration can pass.

This is a local migration repair pass only. It does not connect to remote Supabase, use Yuza Studio Supabase, run `supabase link`, run `supabase db push`, deploy, edit Creative Skill catalog migrations, edit the canonical manifest, edit TypeScript contracts, edit mock fixtures, edit package files, or add runtime behavior.

## B. Original RP-SKILLS-39 Failure

RP-SKILLS-39 stopped before the Creative Skill catalog migrations because `supabase db reset --local --no-seed` failed at:

- `supabase/migrations/202605130007_generation_providers_generated_assets.sql`

Sanitized error:

- `column reference "description" is ambiguous (SQLSTATE 42702)`

The Creative Skill catalog foundation and seed migrations were not reached in RP-SKILLS-39.

## C. Files Inspected

- `supabase/migrations/202605130007_generation_providers_generated_assets.sql`
- `supabase/migrations/202605130006_stroke_motion_data_model.sql`
- `supabase/migrations/202605130008_render_preview_export_revision_qa.sql`
- `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql`
- `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql`
- `supabase/migrations/202606250002_creative_skill_catalog_canonical_seed.sql`
- `docs/creative-skills/creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-retry.md`
- `docs/creative-skills/creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-retry-checklist.md`
- `docs/creative-skills/implementation-handoff.md`
- `supabase/config.toml`

## D. Root Cause

The failing executable SQL was the seed insert for `public.generation_provider_models`.

The insert selects from `public.generation_providers gp` and a lateral `values` source aliased as `seed`. Both sources expose `description`, so the bare `description` in the select list is ambiguous.

Intended source:

- `seed.description`

During local reset after that first repair, PostgreSQL surfaced the same ambiguity pattern for two adjacent fields in the same select list:

- `supports_transparent_background`
- `supports_word_level_timing`

Those fields also exist on `generation_providers gp` and in the lateral `seed` source. The intended source for the model seed insert is the lateral seed row, not provider capability columns from `gp`.

## E. SQL Patch Made

Patched file:

- `supabase/migrations/202605130007_generation_providers_generated_assets.sql`

Patch summary:

- Changed bare `description` to `seed.description`.
- Changed bare `supports_transparent_background` to `seed.supports_transparent_background`.
- Changed bare `supports_word_level_timing` to `seed.supports_word_level_timing`.

The patch is limited to one select list in the existing `generation_provider_models` seed insert. It preserves the seed values, target columns, row order, table definitions, constraints, policies, grants, comments, and existing `on conflict (generation_provider_id, model_key) do nothing` behavior.

## F. Static SQL Review

Static review confirmed:

- No new migration file was created.
- The Creative Skill catalog migrations were not edited.
- The canonical manifest was not edited.
- TypeScript contracts, mock fixtures, package files, config, runtime files, UI, providers, and workers were not edited.
- The SQL diff is limited to qualification of seed-owned fields in the failed migration.

## G. Local Safety Preflight

Preflight before local Supabase commands confirmed:

- `supabase/config.toml` contains `project_id = "reeditpro-local"`.
- Local DB port remains `55432`.
- Local port band `55430` through `55439` was free before start.
- No remote project ref, production URL, Yuza reference, or unsafe Supabase environment variable name was detected.
- Existing local Supabase side artifacts were present under `supabase/.branches/` and `supabase/.temp/`.

## H. Local Supabase Start/Status Result

`supabase start` completed successfully for local project `reeditpro-local`.

`supabase status --output json` did not produce status JSON in this pass because the CLI reported a local telemetry file rename error. The raw output stayed under `/tmp` and was not copied into repository docs. This did not block local reset because `supabase start` completed and `supabase db reset --local --no-seed` ran against the local configuration.

## I. Local Migration Reset/Apply Result

First post-patch reset attempt:

- The original `description` ambiguity no longer appeared.
- The same migration surfaced the adjacent ambiguity `supports_transparent_background`.

After the final narrow patch, the second reset attempt showed:

- `202605130007_generation_providers_generated_assets.sql` applied successfully.
- `202605130008_render_preview_export_revision_qa.sql` applied successfully.
- The chain reached `202605180001_reeditpro_core_workspace_projects.sql`.
- Reset then failed at `202605180001_reeditpro_core_workspace_projects.sql`.

Sanitized new blocker:

- `column "current_edit_session_id" referenced in foreign key constraint does not exist (SQLSTATE 42703)`

## J. Minimal Creative Skill Catalog Smoke Result

Not run.

Reason: the migration chain stopped at `202605180001_reeditpro_core_workspace_projects.sql`, before `202606250001_creative_skill_catalog_foundation.sql` and `202606250002_creative_skill_catalog_canonical_seed.sql`.

Expected catalog counts remain pending for a later full local verification:

- `creative_skill_families`: 21
- `creative_skills`: 140
- `creative_skill_aliases`: 9
- `creative_skill_relationships`: 20
- `creative_skill_contract_mappings`: 450
- `creative_skill_duplicate_reviews`: 0

## K. New Blocker Details

New blocker migration:

- `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql`

The blocker occurs when the migration tries to add `projects_current_edit_session_id_fkey`.

The migration uses `create table if not exists public.projects (...)` with a `current_edit_session_id` column, but the earlier migration chain already created `public.projects` in `202605130001_core_reeditpro_tables.sql` without that column. Because `create table if not exists` does not add missing columns to an existing table, the later foreign key statement references a column that is not present.

RP-SKILLS-40 did not patch this new migration because the approved scope was the generation providers/generated assets migration failure.

## L. Local Stack Stop/Cleanup Result

This pass started the local `reeditpro-local` stack and then stopped only that project:

- `supabase stop --project-id reeditpro-local`

No `--all` flag was used. No `--no-backup` flag was used. The existing local `reeditpro` stack was not stopped by this pass.

## M. Local Supabase Side Artifacts

Existing local Supabase side artifacts remain present:

- `supabase/.branches/`
- `supabase/.temp/`

They were left in place and not staged.

## N. Protected-File Hash Result

Protected-file baselines were captured before edits under `/tmp/rp-skills-40/protected-before.sha256`.

Protected files that must remain unchanged:

- `supabase/config.toml`
- `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql`
- `supabase/migrations/202606250002_creative_skill_catalog_canonical_seed.sql`
- `docs/creative-skills/manifests/creative-skill-catalog-canonical-seed-manifest.json`
- RP-SKILLS TypeScript contract files
- `src/types/index.ts`
- `src/lib/mock-creative-skill-records.ts`
- package files

Final validation result:

- Changed hash: `supabase/migrations/202605130007_generation_providers_generated_assets.sql`.
- Protected changed: none.

## O. Sanitization Statement

Raw Supabase command output stayed under `/tmp`. This report includes only sanitized command names, migration names, exit outcomes, local port numbers, count expectations, and summarized errors.

It does not include local key material, privileged database material, full database URLs, access tokens, or full environment dumps.

## P. Repair Decision

`migration_failure_repaired_but_new_blocker_found`

The RP-SKILLS-39 failure in `202605130007_generation_providers_generated_assets.sql` is repaired enough for the migration chain to pass that file. A new unrelated chain blocker now appears in `202605180001_reeditpro_core_workspace_projects.sql`.

## Q. Recommended Next Prompt

`RP-SKILLS-41 - Local Migration Chain Blocker Repair for 202605180001_reeditpro_core_workspace_projects.sql`

Recommended scope:

- Patch only the missing `current_edit_session_id` column compatibility issue or a proven adjacent compatibility defect in `202605180001_reeditpro_core_workspace_projects.sql`.
- Preserve the repaired generation providers migration.
- Preserve Creative Skill catalog migrations, manifest, TypeScript contracts, mock fixtures, package files, config, and runtime behavior.
- Rerun local-only reset verification after static safety checks.
