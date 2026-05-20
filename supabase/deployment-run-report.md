# RP-FIX-04 Deployment Run Report

## Status

- Status: `blocked`
- Run timestamp: `2026-05-19 21:38:51 -04:00`
- Branch: `codex/rp-timing-10-render-timing-manifest-worker-readiness`
- Deployment executed: no
- Database types generated: no
- Project confirmed as `reeditpro`: no

## Why Deployment Stopped

Deployment was not allowed because required gates failed:

- Supabase CLI is unavailable on PATH.
- `DEPLOY_TO_REEDITPRO_SUPABASE` is missing.
- `SUPABASE_ACCESS_TOKEN` is missing.
- `REEDITPRO_SUPABASE_PROJECT_REF` is missing.
- `SUPABASE_DB_PASSWORD` is missing.
- `supabase/config.toml` does not exist.
- `supabase/.temp/project-ref` exists, but it is not trusted as proof that the linked project is `reeditpro`.
- `src/backend/supabase/generated-database.types.ts` does not exist.

No link, remote migration list, dry-run, schema backup, deployment, table verification, or type generation was attempted.

## Repo State

Recent commits:

```text
ee0a269 Add SFX and StoryTiming planning stack
43249a9 Export provider gateway skeleton from providers index
7be6e9e Export provider gateway skeleton
9b7cea9 Add provider gateway dispatch service
f9383e5 Add mock provider gateway clients
9ccd008 Add provider secret boundary
2f0006f Add provider gateway skeleton types
29e8995 Add RP-GCP-03 provider gateway skeleton doc
9ece13d Add typed live Google Cloud resource map
4a3a050 Add live Google Cloud resource map
```

The worktree is dirty with stacked RP-TIMING, RP-FIX, Supabase readiness, and related documentation changes. This report does not revert or stage that work.

## Migration Files Found

18 migration files were found:

```text
202605130001_core_reeditpro_tables.sql
202605130002_intent_edit_planning_tables.sql
202605130003_professional_edit_quality_engine.sql
202605130004_credit_ledger_approval_gate.sql
202605130005_job_orchestration_agent_runs.sql
202605130006_stroke_motion_data_model.sql
202605130007_generation_providers_generated_assets.sql
202605130008_render_preview_export_revision_qa.sql
202605180001_reeditpro_core_workspace_projects.sql
202605180002_reeditpro_media_source_sequence.sql
202605180003_reeditpro_intent_plan_versions.sql
202605180004_reeditpro_credits_approval_snapshots.sql
202605180005_reeditpro_generation_assets_jobs.sql
202605180006_reeditpro_qa_exports_audit.sql
202605180007_reeditpro_rls_policies.sql
202605180008_reeditpro_storage_buckets_policies.sql
202605190001_sfx_director_tables.sql
202605190002_storytiming_master_tables.sql
```

`supabase/migration-order.md` and `supabase/migration-audit.md` document this 18-file chain. The overlapping `20260513` and `20260518` migration-chain risk remains unresolved and must be validated or reconciled before remote deployment.

## Secret Safety Check

No secret values were printed.

| Path | Exists | Tracked | Safety |
| --- | --- | --- | --- |
| `.env` | no | no | safe |
| `.env.local` | no | no | safe |
| `.env.production` | no | no | safe |
| `.env.development` | no | no | safe |
| `.env.example` | yes | yes | safe placeholder file only |
| `supabase/.temp` | yes | untracked | not safe to commit |
| `supabase/.temp/project-ref` | yes | untracked | not proof of project identity |

## Deployment Gate Variables

| Variable | Status |
| --- | --- |
| `DEPLOY_TO_REEDITPRO_SUPABASE` | missing |
| `SUPABASE_ACCESS_TOKEN` | missing |
| `REEDITPRO_SUPABASE_PROJECT_REF` | missing |
| `SUPABASE_DB_PASSWORD` | missing |

## Supabase CLI

Result: unavailable.

```text
supabase : The term 'supabase' is not recognized as the name of a cmdlet, function, script file, or operable program.
```

Because the CLI is unavailable, project access and remote migration history could not be checked.

## Project Link Status

| Check | Result |
| --- | --- |
| `supabase/config.toml` | missing |
| `supabase/.temp/project-ref` | exists |
| Trusted linked project | not confirmed |
| Project name confirmed as `reeditpro` | no |

The repo must not be considered safely linked until Supabase project listing or dashboard confirmation proves the project name is exactly `reeditpro`.

## Remote Operations

| Operation | Result |
| --- | --- |
| `supabase projects list` | not run; CLI unavailable |
| `supabase link` | not run |
| local Supabase validation | not run; CLI unavailable |
| remote migration list | not run |
| remote dry-run | not run |
| pre-deploy schema backup | not attempted |
| `supabase db push` | not run |
| remote table query | not run |
| generated database types | not generated |

## Build And Lint

Build/lint results are recorded after verification in this same RP-FIX-04 task:

- Build: passed with the existing non-blocking Vite large chunk warning.
- Lint: passed.

## Final Decision

Deployment not executed.

RP-FIX-04 is partially fixed: readiness/reporting is updated, but real deployment, remote table verification, and generated database types remain blocked by missing CLI, missing deployment gates, unconfirmed project link, and unresolved migration-chain validation.
