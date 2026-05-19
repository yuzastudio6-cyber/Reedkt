# Supabase Migration Audit

This audit covers migration files present locally on branch `codex/rp-layout-03-depth-validation`.

## Summary

- Present migrations: `202605130001` through `202605130008`.
- Missing expected audio migration: `202605130009_soundsync_music_intelligence.sql`.
- `supabase/migration-order.md` matches the eight migration files currently present.
- `supabase/README.md` documents the eight present migrations.
- No remote deployment or local migration execution was run.

## Migration Table

| Filename | Milestone | Tables/views created | Enum types created | Dependencies | Docs mention it | Obvious issues | Deployment risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `202605130001_core_reeditpro_tables.sql` | RP-DB-03 Core | plans, profiles, workspaces, subscriptions, projects, chat, media, source sequence, reference assets | plan/workspace/subscription/project/chat/media/reference enums | Supabase Auth, pgcrypto | Yes | Needs local CLI validation | Medium |
| `202605130002_intent_edit_planning_tables.sql` | RP-DB-04 Planning | intent analyses, source maps, recommended structures, edit plans, story beats, segments, signature routes, instructions, planning notes, chat-card links | Mostly reuses core enums | RP-DB-03 | Yes | Needs local FK/RLS validation | Medium |
| `202605130003_professional_edit_quality_engine.sql` | RP-DB-05 Edit Quality | quality profiles, pacing, cuts, transitions, audio environment, ambience, music plans, SFX plans, captions, checks | quality/audio/caption planning enums where defined | RP-DB-03/04 | Yes | SoundSync is basic music planning only, not full intelligence schema | Medium |
| `202605130004_credit_ledger_approval_gate.sql` | RP-DB-06 Credits | wallets, grants, ledger, estimates, line items, approvals, reservations, refunds, balance view | credit wallet/source/ledger/reservation/estimate/approval/refund/usage enums | RP-DB-03/04 | Yes | Requires future backend to enforce spend/refund | Medium |
| `202605130005_job_orchestration_agent_runs.sql` | RP-DB-07 Jobs | job batches, jobs, dependencies, events, agent runs/outputs, worker configs/heartbeats, event log, progress view | job, agent, worker runtime, event, failure enums | RP-DB-03/04/06 | Yes | No real workers; service role policies need validation | Medium |
| `202605130006_stroke_motion_data_model.sql` | RP-DB-08 Stroke Motion | plans, meaning expansions, beats, characters, symbols, joins, transitions, timing anchors, storyboard frames, specs, examples | Stroke Motion mode/status/style/character/symbol/timing/generation/output/SFX enums | RP-DB-03/04/06/07 | Yes | Example seed should stay non-production | Medium |
| `202605130007_generation_providers_generated_assets.sql` | RP-DB-09 Generation | providers, capabilities, models, requests, inputs, assets, versions, timing maps, events, costs | provider/runtime/capability/request/asset/quality/failure/input enums | RP-DB-03/04/06/07/08 | Yes | Provider metadata only; no secrets allowed | Medium |
| `202605130008_render_preview_export_revision_qa.sql` | RP-DB-10 Render/QA | render jobs/inputs/events, renders, exports, variants, preview reviews, comments, revisions, QA reports/items, latest preview view | render/export/review/revision/QA enums | RP-DB-03 through RP-DB-09 | Yes | Real render/export workers absent | Medium |

## Missing Migration

| Filename | Expected milestone | Status | Impact |
| --- | --- | --- | --- |
| `202605130009_soundsync_music_intelligence.sql` | RP-AUDIO-03 | Missing on this branch | SoundSync music intelligence tables are not locally available for deployment. Do not update migration order as if this exists until the file is restored or created. |

## Migration Order Check

`supabase/migration-order.md` documents `001` through `008` and a no-new-migration RP-DB-11 schema review. That matches the current local migration folder.

If the SoundSync migration is restored later, update:

- `supabase/migration-order.md`
- `supabase/README.md`
- this audit file

## Deployment Readiness

Current risk is medium because migrations are local-only and not validated in this environment. Supabase CLI is not installed locally, and there is no `supabase/config.toml`.

Recommended next step: install/configure local Supabase for `RP-SUPABASE-01 - Local Supabase Setup + Migration Validation`.
