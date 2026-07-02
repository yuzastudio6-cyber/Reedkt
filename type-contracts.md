# Type Contracts

## Purpose

RP-DB-02 adds TypeScript contracts for the future ReeditPro backend/database model. These contracts are not migrations and do not connect to Supabase, AI providers, Stripe, uploads, rendering, or Google Cloud. They are implementation-ready shapes that future Codex tasks can use to create Supabase tables, API payloads, worker messages, and typed service boundaries.

Future database work must use the Supabase project named `reeditpro`. Do not use the Yuza Studio Supabase project.

## Contract Layout

The contracts live under `src/types/`:

- `shared.ts`: IDs, timestamps, JSON, time ranges, statuses, approval states, credit impact, priorities, and common record helpers.
- `accounts.ts`: users, workspaces, members, subscriptions, and Personal/Business plans.
- `credits.ts`: credit wallets, ledger entries, estimates, reservations, refunds, and credit source types.
- `projects-chat.ts`: chat-native projects, chat sessions, messages, attachments, inline cards, and chat actions.
- `media.ts`: media assets, source clip sequences, transcripts, scene boundaries, visual/audio observations, references, and Reference DNA.
- `planning.ts`: intent analysis, edit plans, edit plan segments, edit instructions, signature routes, and story beat maps.
- `edit-quality.ts`: Professional Edit Quality Engine records for pacing, cuts, transitions, audio, ambience, music, SFX, captions, and QA checks.
- `signature-systems.ts`: Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, and future signature support records.
- `stroke-motion.ts`: Stroke Motion plans, beats, characters, symbols, transitions, timing anchors, generation specs, and meaning expansion examples.
- `storytiming.ts`: StoryTiming master timing maps, segments, anchors, events, dependencies, conflicts, QA checks, and render timing manifests.
- `jobs.ts`: jobs, dependencies, events, agent runs, agent outputs, and audit events.
- `generation.ts`: future provider abstraction for Wan, Veo, Kling, Remotion, SVG, Lottie, Google Cloud workers, custom providers, and generated assets.
- `sfx-director.ts`: SoundSync SFX Director contracts for event planning, provider routing, prompts, trim/hit alignment, mix/ducking, QA, usage, and generated SFX library growth.
- `review-render-export.ts`: preview renders, final renders, exports, preview reviews, comments, revisions, approvals, and QA reports.
- `google-cloud.ts`: reference-only contracts for Cloud Run, Cloud Run Jobs, GPU workers, Cloud Storage, Pub/Sub, Secret Manager, Artifact Registry, and worker runtime configuration.
- `creative-skills-core.ts`: Creative Skill taxonomy, family/key unions, catalog records, aliases, relationships, duplicate review, and contract mapping records.
- `creative-skill-plans.ts`: universal and specialized Creative Skill planning contracts, including StoryTiming coordination planning shapes.
- `creative-skill-workflow.ts`: edit preference snapshots, visual opportunities, creative concepts, skill candidates, skill routes, and credit/approval planning records.
- `creative-skill-qa.ts`: Creative Skill QA requirements, results, reports, repair recommendations, and gate status contracts.
- `creative-skill-diagnostics.ts`: Creative Skill diagnostics/static validation categories, levels, rule keys, rules, results, and run records.
- `index.ts`: the future backend-oriented public type entrypoint.

The existing frontend compatibility file, `src/types/reeditpro.ts`, remains available for current mock UI imports.

The static Creative Skill fixture file lives outside the type entrypoint at `src/lib/mock-creative-skill-records.ts`. It imports only types from `src/types` and exports static mock constants that exercise the RP-SKILLS-21 contracts.

## RP-SKILLS-21 TypeScript Creative Skill Contracts

RP-SKILLS-21 adds the first TypeScript-only Creative Skill contract layer approved by the docs-only RP-SKILLS-00 through RP-SKILLS-20 sequence.

Files added:

- `src/types/creative-skills-core.ts`
- `src/types/creative-skill-plans.ts`
- `src/types/creative-skill-workflow.ts`
- `src/types/creative-skill-qa.ts`
- `src/types/creative-skill-diagnostics.ts`

These files provide typed shapes for taxonomy, planning contracts, specialized skill plans, edit preference snapshots, visual opportunities, creative concepts, skill candidate scoring, route assembly, credit/approval planning, QA, and diagnostics/static validation metadata.

This layer is type-only. It does not implement planner logic, scoring, routing, QA execution, diagnostics execution, provider calls, workers, schemas, migrations, Supabase access, UI, package changes, render/export, media processing, browser capture, audio generation, caption rendering, 3D runtime, or app behavior.

Future recommended prompt: `RP-SKILLS-22 - Creative Skill Mock Records and Fixture Contracts`.

## RP-SKILLS-22 Creative Skill Mock Records And Fixture Contracts

RP-SKILLS-22 adds `src/lib/mock-creative-skill-records.ts` as a static fixture layer for the RP-SKILLS-21 Creative Skill TypeScript contracts.

The fixture file covers taxonomy/catalog records, aliases, relationships, contract mappings, edit preference profiles and snapshots, visual opportunities, restraint opportunities, opportunity questions and runs, creative concepts, concept selections and rejections, lower-cost alternatives, skill candidates, resolver runs, route previews, route assembly records, specialized skill plans, StoryTiming coordination plans, credit/approval planning records, QA records, diagnostic rules/results/runs, and grouped fixture scenarios.

The exported scenario set includes:

- `clean_talking_head_restraint`
- `premium_real_estate_3d_optional`
- `product_demo_screen_interaction`
- `education_visual_explain`
- `marketing_ad_hero`
- `testimonial_trust_first`

This layer is static data only. It does not add runtime planner logic, scoring or resolver functions, validation scripts, schemas, migrations, providers, workers, UI, package changes, Supabase access, render/export behavior, media processing, browser capture, audio generation, caption rendering, 3D runtime, or app behavior.

Validation for RP-SKILLS-22 should include lint, build or narrow TypeScript checks, static pattern checks confirming type-only imports and no runtime APIs, and acceptance searches for required fixture categories and scenarios.

Future recommended prompt: `RP-SKILLS-23 - Creative Skill Type Contract Reconciliation and Narrow Validation`.

## RP-SKILLS-23 Creative Skill Type Contract Reconciliation And Narrow Validation

RP-SKILLS-23 reconciles the RP-SKILLS-21 Creative Skill TypeScript contracts and the RP-SKILLS-22 static mock fixtures against existing repo type owners.

Files inspected include the five Creative Skill type files, `src/types/index.ts`, `src/lib/mock-creative-skill-records.ts`, Creative Skill docs, and core owner surfaces such as shared, planning, edit-quality, signature-system, StoryTiming, audio/music, credit, job, generation, render/export, media, and edit-planning-db types.

The reconciliation found no new RP-SKILLS export collisions. Existing known collisions remain intentionally handled in `src/types/index.ts` by exporting Creative Skill-specific aliases for `CaptionTimingPlanRecord` and `StoryTimingConflictType`.

No TypeScript contract changes were required. The pass created `docs/creative-skills/type-contract-reconciliation-report.md`, updated the Creative Skill docs/handoff, and made a prose-only cleanup in `src/lib/mock-creative-skill-records.ts` to keep raw `any`/`object` acceptance searches unambiguous.

This pass does not implement runtime planner logic, scoring or resolver functions, validation scripts, diagnostics scripts, schemas, migrations, providers, workers, UI, package changes, Supabase access, render/export behavior, media processing, browser capture, audio generation, caption rendering, 3D runtime, or app behavior.

Validation notes:

- Narrow RP-SKILLS TypeScript check passed.
- `npm run lint` passed.
- `npm run build` still fails only on unrelated `src/backend/services/sound-agent-planner-service.ts` TypeScript issues.

Future recommended prompt: `RP-SKILLS-24 - Creative Skill Schema Planning Contract`.

## RP-SKILLS-24 Creative Skill Schema Planning Contract

RP-SKILLS-24 adds docs-only schema planning for the Creative Skill System. It maps the RP-SKILLS TypeScript contracts and static mock fixtures to future table groups, RLS/security expectations, migration sequencing, source/proof safety fields, approval/credit foreign-key strategy, StoryTiming references, QA records, diagnostics records, lifecycle/versioning, JSON strategy, and query/index needs.

This layer does not change TypeScript contracts, create SQL, create Supabase migrations, connect to Supabase, modify schema, add RLS policies, add runtime code, mutate package files, call providers, run workers, add UI, or change app behavior.

Future recommended prompt: `RP-SKILLS-25 - Creative Skill Supabase Migration Blueprint and RLS Readiness Contract`.

## RP-SKILLS-25 Creative Skill Supabase Migration Blueprint And RLS Readiness Contract

RP-SKILLS-25 adds docs-only migration blueprint and RLS readiness planning for the Creative Skill System. It maps the RP-SKILLS TypeScript contracts, static fixtures, reconciliation report, and schema planning contract to future migration packages, table-by-table field summaries, FK/RLS/security expectations, rollback/supersession strategy, seed strategy, validation planning, and query/index readiness.

This layer does not change TypeScript contracts, create SQL, create Supabase migrations, connect to Supabase, modify schema, add RLS policies, add seed scripts, add runtime code, mutate package files, call providers, run workers, add UI, or change app behavior.

Future recommended prompt: `RP-SKILLS-26 - Creative Skill Catalog Migration Readiness Review`.

## RP-SKILLS-26 Creative Skill Catalog Migration Readiness Review

RP-SKILLS-26 adds a docs-only readiness review for the first future Creative Skill catalog migration package. It compares the proposed catalog tables to the RP-SKILLS TypeScript contracts, static fixtures, reconciliation report, schema planning, migration blueprint, existing migrations, and existing signature-system catalog ownership.

The review records the final decision `ready_with_warnings` for a future catalog-only migration prompt. It does not change TypeScript contracts, create SQL, create Supabase migrations, connect to Supabase, modify schema, add RLS policies, add seed scripts, change mock fixtures, add runtime code, mutate package files, call providers, run workers, add UI, or change app behavior.

Future recommended prompt: `RP-SKILLS-27 - Creative Skill Catalog Supabase Migration Implementation`.

## RP-SKILLS-27 Creative Skill Catalog Supabase Migration Implementation

RP-SKILLS-27 adds the first local-only Creative Skill catalog migration file, `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql`, for the six catalog foundation tables: `creative_skill_families`, `creative_skills`, `creative_skill_aliases`, `creative_skill_relationships`, `creative_skill_contract_mappings`, and `creative_skill_duplicate_reviews`.

The migration corresponds to the RP-SKILLS-21 Creative Skill core type contracts and RP-SKILLS-26 catalog readiness decisions. It does not change TypeScript contracts, exports, mock fixtures, runtime behavior, providers, workers, UI, package files, or app behavior. The migration was not applied, executed, reset, deployed, or connected to Supabase, and no seed data was added.

Future recommended prompt: `RP-SKILLS-28 - Creative Skill Catalog Migration Static Review and Canonical Seed Readiness`.

## RP-SKILLS-28 Creative Skill Catalog Migration Static Review And Seed Readiness

RP-SKILLS-28 statically reviews `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql` against the Creative Skill TypeScript contracts and records canonical seed readiness. The migration static-review decision is `migration_static_review_repaired_and_passed`; the canonical seed-readiness decision is `not_ready_seed_metadata_incomplete`.

No TypeScript contracts, exports, mock fixtures, runtime behavior, package files, providers, workers, UI, or app behavior changed. No seed data was implemented, and the migration remains unapplied.

Future recommended prompt: `RP-SKILLS-29 - Creative Skill Catalog Canonical Seed Manifest Completion`.

## RP-SKILLS-29 Creative Skill Catalog Canonical Seed Manifest Completion

RP-SKILLS-29 completes a static canonical seed manifest for the Creative Skill catalog. The manifest treats RP-SKILLS-21 TypeScript unions as canonical, covers 21 families and 140 skills, and records aliases, relationships, contract mappings, approval-label mappings, and an empty duplicate-review seed decision.

No TypeScript contracts, exports, mock fixtures, package files, SQL, migrations, seed scripts, database application, runtime behavior, providers, workers, UI, or app behavior changed.

Future recommended prompt: `RP-SKILLS-30 - Creative Skill Catalog Canonical Seed Manifest Static Review and Seed Migration Readiness`.

## RP-SKILLS-30 Creative Skill Catalog Canonical Seed Manifest Static Review And Seed Migration Readiness

RP-SKILLS-30 statically reviews the canonical Creative Skill seed manifest against the RP-SKILLS-21 TypeScript unions and RP-SKILLS-27 migration constraints. It records the manifest static-review decision `seed_manifest_static_review_repaired_and_passed` and the seed-migration-readiness decision `ready_with_warnings_for_seed_migration`.

No TypeScript contracts, exports, mock fixtures, package files, SQL, migrations, seed scripts, database application, runtime behavior, providers, workers, UI, or app behavior changed. The manifest was patched only for deterministic ordering.

Future recommended prompt: `RP-SKILLS-31 - Creative Skill Catalog Canonical Seed Migration Implementation`.

## RP-SKILLS-31 Creative Skill Catalog Canonical Seed Migration Implementation

RP-SKILLS-31 generates the local-only canonical Creative Skill catalog seed migration from the reviewed manifest. The seed migration represents 21 families, 140 skills, 9 aliases, 20 relationships, 450 contract mappings, and 0 duplicate-review rows.

No TypeScript contracts, exports, mock fixtures, package files, manifest data, runtime behavior, providers, workers, UI, or app behavior changed. The seed migration remains unapplied and no Supabase connection or SQL execution occurred.

Future recommended prompt: `RP-SKILLS-32 - Creative Skill Catalog Canonical Seed Migration Static Review and Local Apply Readiness`.

## RP-SKILLS-32 Creative Skill Catalog Canonical Seed Migration Static Review And Local Apply Readiness

RP-SKILLS-32 statically reviews the foundation and canonical seed migrations against the RP-SKILLS-21 TypeScript contracts, reviewed manifest, SQL constraints, fail-closed assertions, and RLS posture. The static review decision is `seed_migration_static_review_passed`.

No TypeScript contracts, exports, mock fixtures, package files, manifest data, runtime behavior, providers, workers, UI, or app behavior changed. Both migrations remain unapplied, and no Supabase CLI, Supabase connection, or SQL execution occurred. Local apply readiness is `blocked_local_apply_repository_not_ready` because `supabase/config.toml` is absent.

Future recommended prompt: `RP-SKILLS-33 - Creative Skill Local Supabase Readiness Repair`.

## RP-SKILLS-33 Creative Skill Local Supabase Readiness Repair

RP-SKILLS-33 records the local Supabase readiness repair decision packet. The config repair decision is `owner_decision_required`, and local apply readiness remains blocked as `blocked_owner_decision_required` until owner decisions define whether and how a local Supabase config should be created.

No TypeScript contracts, exports, migrations, manifest data, mock fixtures, package files, Supabase config, SQL, runtime behavior, providers, workers, UI, or app behavior changed. No Supabase CLI, Supabase connection, SQL execution, migration application, or database/container startup occurred.

Future recommended prompt: `RP-SKILLS-34 - Creative Skill Local Supabase Owner Decision Packet`.

## RP-SKILLS-34 Creative Skill Local Supabase Owner Decision Packet

RP-SKILLS-34 records the owner decision packet for local Supabase config readiness. The decision outcome is `awaiting_owner_approval`, with recommended approval text `Approve RP-SKILLS-34 recommended decisions and proceed with RP-SKILLS-35.`

No TypeScript contracts, exports, migrations, manifest data, mock fixtures, package files, Supabase config, SQL, runtime behavior, providers, workers, UI, or app behavior changed. No Supabase CLI, Supabase connection, SQL execution, migration application, or database/container startup occurred.

Future recommended next step: owner approval for RP-SKILLS-35.

## RP-SKILLS-35 Creative Skill Local Supabase Config Creation

RP-SKILLS-35 creates `supabase/config.toml` as a local-only Supabase configuration for future disposable local migration verification. The local project ID is `reeditpro-local`, and the config decision is `local_config_created`.

No TypeScript contracts, exports, migrations, manifest data, mock fixtures, package files, SQL, Supabase connection, migration application, runtime behavior, providers, workers, UI, or app behavior changed. No Supabase CLI, SQL execution, database/container startup, deployment, build, provider call, worker execution, or render/export occurred.

Future recommended prompt: `RP-SKILLS-36 - Creative Skill Catalog Migrations Disposable Local Apply and Data Verification`.

## RP-SKILLS-36 Creative Skill Catalog Migrations Disposable Local Apply And Data Verification

RP-SKILLS-36 attempted local-only verification of the Creative Skill catalog migrations against the manifest and type expectations. Static preflight passed, but local apply did not proceed because an existing local Supabase stack named `reeditpro` already occupied the configured `reeditpro-local` ports.

No TypeScript contracts, exports, migrations, manifest data, mock fixtures, package files, runtime behavior, providers, workers, UI, or app behavior changed. No remote Supabase connection, `supabase link`, `supabase db push`, remote SQL, production deploy, or migration application occurred.

Future recommended prompt: `RP-SKILLS-37 - Creative Skill Local Supabase Environment Repair`.

## RP-SKILLS-37 Creative Skill Local Supabase Environment Repair Decision Packet

RP-SKILLS-37 creates a docs-only owner decision packet for the local Supabase port conflict that blocked RP-SKILLS-36. The outcome is `awaiting_owner_repair_choice`, with Option C recommended for a future local-only port repair.

No TypeScript contracts, exports, migrations, config files, manifest data, mock fixtures, package files, Supabase CLI, SQL, migration application, runtime behavior, providers, workers, UI, or app behavior changed.

## RP-SKILLS-38 Creative Skill Local Supabase Port Repair

RP-SKILLS-38 patches the local-only `reeditpro-local` Supabase config to use the non-conflicting `55430` through `55439` port band for future disposable local verification.

No TypeScript contracts, exports, migrations, manifest data, mock fixtures, package files, Supabase CLI, SQL, migration application, runtime behavior, providers, workers, UI, or app behavior changed.

## RP-SKILLS-39 Creative Skill Catalog Migrations Disposable Local Apply And Data Verification Retry

RP-SKILLS-39 attempted disposable local verification of the Creative Skill catalog migrations. Static remote-safety checks passed and the local stack started, but the repository migration chain failed before Creative Skill migrations at `202605130007_generation_providers_generated_assets.sql`.

No TypeScript contracts, exports, Creative Skill migrations, manifest data, mock fixtures, package files, runtime behavior, providers, workers, UI, or app behavior changed.

## RP-SKILLS-40 Creative Skill Catalog Migration Local Failure Repair

RP-SKILLS-40 repaired the local migration-chain blocker in `202605130007_generation_providers_generated_assets.sql` by qualifying seed-owned fields in the existing generation provider model seed insert. Local reset now passes that migration and stops at a later migration-chain blocker in `202605180001_reeditpro_core_workspace_projects.sql`.

No TypeScript contracts, exports, Creative Skill migrations, manifest data, mock fixtures, package files, runtime behavior, providers, workers, UI, or app behavior changed.

## RP-BETA-INTEGRATION-01 Beta Integration Merge Readiness

RP-BETA-INTEGRATION-01 confirms RP-SKILLS and Qwen beta are separate clones of the same remote. It repairs the `current_edit_session_id` migration-chain blocker in `202605180001_reeditpro_core_workspace_projects.sql`, but merge readiness remains blocked by a later same-migration `workspaces.owner_id` compatibility issue and existing Sound Agent build errors.

No TypeScript contracts, exports, Creative Skill catalog migrations, manifest data, mock fixtures, package files, runtime behavior, providers, workers, UI, or app behavior changed.

## RP-BETA-INTEGRATION-02 Local Migration Chain Repair

RP-BETA-INTEGRATION-02 repairs the `owner_id` compatibility gap in `202605180001_reeditpro_core_workspace_projects.sql` by adding nullable compatibility columns for existing workspace/project rows. Local reset now passes the previous owner-index blocker and stops at a later same-migration `chat_messages.edit_session_id` compatibility issue.

No TypeScript contracts, exports, Creative Skill catalog migrations, manifest data, mock fixtures, package files, runtime behavior, providers, workers, UI, or app behavior changed.

## RP-BETA-INTEGRATION-03 Local Migration Chain Repair

RP-BETA-INTEGRATION-03 repairs the `chat_messages.edit_session_id` compatibility gap in `202605180001_reeditpro_core_workspace_projects.sql` with a nullable compatibility column and idempotent FK. Local reset now passes that blocker and stops at `202605180002_reeditpro_media_source_sequence.sql` on `media_assets.status`, so Creative Skill catalog migrations still have not been reached locally.

No TypeScript contracts, exports, Creative Skill catalog migrations, manifest data, mock fixtures, package files, runtime behavior, providers, workers, UI, or app behavior changed.

## RP-BETA-INTEGRATION-04 Local Migration Chain Repair

RP-BETA-INTEGRATION-04 repairs the `media_assets.status` compatibility gap in `202605180002_reeditpro_media_source_sequence.sql` with a generic status column that preserves existing `processing_status`. Local reset now passes that blocker and stops at `202605180003_reeditpro_intent_plan_versions.sql` on `edit_plan_segments.edit_plan_version_id`, so Creative Skill catalog migrations still have not been reached locally.

## RP-BETA-INTEGRATION-05 Local Migration Chain Repair

RP-BETA-INTEGRATION-05 repairs the `edit_plan_segments.edit_plan_version_id` compatibility gap in `202605180003_reeditpro_intent_plan_versions.sql` with a nullable version pointer and idempotent FK to `edit_plan_versions(id)`. TypeScript contracts were not changed. Local reset now passes that blocker and stops at `202605180004_reeditpro_credits_approval_snapshots.sql` on missing `approved_plan_snapshot_id` compatibility, so Creative Skill catalog migrations still have not been reached locally.

## RP-BETA-INTEGRATION-06 Local Migration Chain Repair

RP-BETA-INTEGRATION-06 repairs the approved-plan-snapshot compatibility gap in `202605180004_reeditpro_credits_approval_snapshots.sql` with nullable `approved_plan_snapshot_id` columns on `credit_reservations` and `credit_ledger_entries`. TypeScript contracts were not changed and no credit runtime behavior was added. Local reset now passes that blocker and stops later in the same migration on missing `credit_estimates.edit_plan_version_id` compatibility, so Creative Skill catalog migrations still have not been reached locally.

No TypeScript contracts, exports, Creative Skill catalog migrations, manifest data, mock fixtures, package files, runtime behavior, providers, workers, UI, or app behavior changed.

## RP-BETA-INTEGRATION-07 Local Migration Chain Repair

RP-BETA-INTEGRATION-07 repairs the `credit_estimates.edit_plan_version_id` compatibility gap in `202605180004_reeditpro_credits_approval_snapshots.sql` with a nullable version pointer and idempotent FK to `edit_plan_versions(id)`. TypeScript contracts were not changed and no credit runtime behavior was added. Local reset now passes that blocker and stops at `202605180005_reeditpro_generation_assets_jobs.sql` on missing `generation_requests.approved_plan_snapshot_id` compatibility, so Creative Skill catalog migrations still have not been reached locally.

No TypeScript contracts, exports, Creative Skill catalog migrations, manifest data, mock fixtures, package files, runtime behavior, providers, workers, UI, or app behavior changed.

## RP-BETA-INTEGRATION-08 Local Migration Chain Repair

RP-BETA-INTEGRATION-08 repairs the `generation_requests.approved_plan_snapshot_id` compatibility gap in `202605180005_reeditpro_generation_assets_jobs.sql` with a nullable approved-snapshot pointer and idempotent FK to `approved_plan_snapshots(id)`. TypeScript contracts were not changed and no generation, provider, job, credit, approval, or runtime behavior was added. Local reset now passes that blocker and stops later in the same migration on missing `generated_asset_versions.version` compatibility, so Creative Skill catalog migrations still have not been reached locally.

No TypeScript contracts, exports, Creative Skill catalog migrations, manifest data, mock fixtures, package files, runtime behavior, providers, workers, UI, or app behavior changed.

## RP-BETA-INTEGRATION-09 Local Migration Chain Repair

RP-BETA-INTEGRATION-09 repairs the generated asset version index blocker in `202605180005_reeditpro_generation_assets_jobs.sql` by retargeting `idx_generated_asset_versions_asset_version` to the existing `version_number` field. TypeScript contracts were not changed and no generated asset, generation, provider, job, credit, approval, or runtime behavior was added. Local reset now passes that blocker and stops at `202605180006_reeditpro_qa_exports_audit.sql` on the `qa_check_results.check` column syntax issue, so Creative Skill catalog migrations still have not been reached locally.

## RP-BETA-INTEGRATION-10 Local Migration Chain Repair

RP-BETA-INTEGRATION-10 repairs the QA check result column syntax blocker in `202605180006_reeditpro_qa_exports_audit.sql` by quoting the existing `qa_check_results."check"` column. TypeScript contracts were not changed; the repair preserves `QACheckResultRecord.check` from `src/types/edit-planning-db.ts`. Local reset now passes that blocker and stops later in the same migration on missing `qa_reports.approved_plan_snapshot_id`, so Creative Skill catalog migrations still have not been reached locally.

## RP-BETA-INTEGRATION-11 Local Migration Chain Repair

RP-BETA-INTEGRATION-11 repairs the QA report approved-snapshot compatibility gap in `202605180006_reeditpro_qa_exports_audit.sql` with nullable `qa_reports.approved_plan_snapshot_id` and an idempotent FK to `approved_plan_snapshots(id)`. TypeScript contracts were not changed and no QA/export, credit, approval, provider, worker, or runtime behavior was added. Local reset now passes that blocker and stops at `202605180007_reeditpro_rls_policies.sql` on the `is_workspace_member` function input-parameter compatibility issue, so Creative Skill catalog migrations still have not been reached locally.

## RP-BETA-INTEGRATION-12 Local Migration Chain Repair

RP-BETA-INTEGRATION-12 repairs the `is_workspace_member` function parameter-name blocker in `202605180007_reeditpro_rls_policies.sql` by preserving the existing `target_workspace_id` parameter name. TypeScript contracts were not changed and no RLS policy broadening, runtime, provider, worker, UI, or app behavior was added. Local reset now passes that blocker and stops at the same migration on the `is_workspace_owner_or_admin` function input-parameter compatibility issue, so Creative Skill catalog migrations still have not been reached locally.

## RP-BETA-INTEGRATION-13 Local Migration Chain Repair

RP-BETA-INTEGRATION-13 repairs the `is_workspace_owner_or_admin` function parameter-name blocker in `202605180007_reeditpro_rls_policies.sql` by preserving the existing `target_workspace_id` parameter name and updating body references. TypeScript contracts were not changed and no RLS policy broadening, runtime, provider, worker, UI, or app behavior was added. Local reset now passes that blocker and stops at `202605180008_reeditpro_storage_buckets_policies.sql` on `storage.buckets` ownership for a table comment, so Creative Skill catalog migrations still have not been reached locally.

## RP-BETA-INTEGRATION-14 Local Migration Chain Repair

RP-BETA-INTEGRATION-14 repairs ownership-sensitive storage database comments in `202605180008_reeditpro_storage_buckets_policies.sql` by converting `COMMENT ON storage.*` statements to ordinary SQL comments. TypeScript contracts were not changed and no storage RLS broadening, public bucket change, runtime, provider, worker, UI, or app behavior was added. Local reset verification is blocked because Docker was not reachable, so Creative Skill catalog migrations still have not been reached locally.

## RP-BETA-INTEGRATION-15 Local Docker Environment Repair

RP-BETA-INTEGRATION-15 starts Docker Desktop locally, verifies Docker daemon availability, and retries local Supabase reset without changing TypeScript contracts, migrations, manifest data, mocks, package files, runtime, provider, worker, UI, or app behavior. Local reset now passes `202605180008_reeditpro_storage_buckets_policies.sql` and stops later at `202605200001_storage_upload_pipeline_readiness.sql` on a same-class `storage.objects` policy comment ownership blocker, so Creative Skill catalog migrations still have not been reached locally.

No TypeScript contracts, exports, Creative Skill catalog migrations, manifest data, mock fixtures, package files, runtime behavior, providers, workers, UI, or app behavior changed.

## Chat-Native Editing

ReeditPro editing is chat-native: the chat is the editor. Users send clips, references, instructions, approvals, revision requests, and export requests through chat. UI appears as inline cards only when ReeditPro needs user input, confirmation, approval, progress, or preview.

The contracts support:

- `chat_sessions`, `chat_messages`, and `chat_attachments`.
- Inline cards for source sequence, workflow choices, AI questions, Reference DNA, edit plans, credit estimates, approval requests, editing progress, preview-ready states, revision requests, and export-ready states.
- Source clip order as a separate `source_clip_sequences` concept. Uploaded order means source sequence, not automatically final edit order.
- Edit plans and credit estimates linked back to chat messages so approval can happen inside the conversation.
- Revision requests linked to chat messages and affected segments.

## Approval Before Generation

ReeditPro must never start expensive AI editing, animation generation, rendering, or credit spending until:

1. AI understands the user goal.
2. AI creates an edit plan.
3. AI creates a credit estimate.
4. The user approves the plan and credits.

The contracts reflect this with:

- `EditPlanRecord.approvalRequiredBeforeGeneration`.
- `CreditEstimateRecord.approvalRequiredBeforeGeneration`.
- `ApprovalRecord` for plan, credit, generation, revision, and export approvals.
- `CreditReservationRecord` for reserve/spend/refund lifecycle.
- Job statuses such as `waiting_user_approval` before generation or render work.

## Edit Levels And Professional Quality

The backend edit complexity levels are:

- `basic_edit`
- `pro_edit`
- `signature_edit`
- `premium_signature_edit`

Every ReeditPro edit, including Basic, must meet a professional editing standard. Basic means lower-compute clean editing, not low-quality editing. Edit level controls complexity and cost, not quality.

The Professional Edit Quality Engine types model:

- Quality profiles and standards.
- Pacing analysis.
- Cut decisions.
- Transition plans.
- Audio environment analysis.
- Ambient sound plans.
- Music plans.
- Sound effect plans.
- Caption plans.
- Edit quality checks.

Basic edits can still include clean cuts, dead-space removal, obvious mistake removal, meaningful pause preservation, basic captions, voice cleanup, room tone preservation, audio leveling, and professional preview QA. Higher levels add more planning depth, signature generation, SoundSync complexity, and credit cost.

## Signature Systems

The visual signature systems are:

- Stroke Motion
- Graphic Design / VisualExplain
- Real Motion

SoundSync is the audio/timing support engine, not the third visual signature system.

The contracts preserve the rule that the video type dropdown gives workflow context only. It does not automatically choose signature systems. All video types can use Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, or none. The AI planner routes systems per segment based on user intent, footage, transcript, reference DNA, platform, edit level, credit budget, and whether the visual improves the video.

## Stroke Motion

Stroke Motion is modeled as a fast transparent 2D animated story layer that turns spoken meaning, source text, or scripture/book/document reading into visual story beats timed to the speaker words.

The Stroke Motion contracts support:

- `spoken_story_mode`
- `source_reading_mode`
- `meaning_expansion`
- story summaries
- source references and excerpts
- connected transition chains
- timing anchors
- characters
- symbols
- beats
- generation specs
- worker notes
- must-follow rules
- avoid rules
- approval and credit estimate links

In `source_reading_mode`, AI must understand the meaning behind the source text before planning animation. The mock records include the Joseph and Mary example from Matthew 1:18-25 as an example only; Stroke Motion applies to all stories, not only Bible content.

## Credits And Approvals

The credit contracts model subscription access separately from AI usage.

- Subscription = software access.
- Edit Credits = AI generation, rendering, and editing usage.
- Personal is `$10/week` software access with 100 weekly bonus Reedit Credits.
- Business is `$20/week` software access with stronger brand/team/client workflows.
- ReeditPro does not imply unlimited AI editing.

Credit flow:

1. Estimate credits.
2. User approves.
3. Reserve credits.
4. Generation starts.
5. On success, reserved credits become spent.
6. If ReeditPro fails, reserved or spent credits are refunded.

This is represented by `credit_wallets`, `credit_ledger_entries`, `credit_estimates`, `credit_reservations`, and refund records.

## Jobs, Agents, And Workers

The orchestration contracts use a central job model with controlled agents and workers. Jobs support dependency graphs, idempotency keys, retries, priorities, input/output payload summaries, audit events, and status transitions.

Supported agents/workers include:

- Chat Intent Agent
- Media Analysis Agent
- Source Sequence Agent
- Edit Quality Agent
- Pacing Agent
- Transition Agent
- Audio Environment Agent
- Music Supervisor Agent
- SFX Agent
- Signature Investigation Agent
- Stroke Motion Story Agent
- Credit Estimation Agent
- Generation Orchestrator
- Stroke Motion Generation Worker
- Graphic Design Worker
- Real Motion Worker
- SoundSync Worker
- Render Worker
- Quality Check Agent

Future Google Cloud workers should receive IDs and safe payload summaries, load trusted records server-side, use Secret Manager for provider keys, and write results back through safe server paths.

## SoundSync SFX Director Type Contracts

`src/types/sfx-director.ts` is the dedicated contract layer for SoundSync SFX Director. It does not replace the existing Professional Edit Quality `SoundEffectPlanRecord`; it gives future SFX-specific workers, services, and migrations a deeper model for individual SFX events, routing, prompts, trimming, timing, mix, QA, usage, provenance, and reusable-library review.

The SFX Director contracts preserve these product rules:

- ReeditPro must not add random SFX.
- Default SFX supports ReeditPro-created edit layers, not every visible source-footage action.
- No SFX is always a valid professional decision.
- SFX must stay voice-first, subtle by default, and QA-checked before preview or export.

Edit-layer SFX is modeled through `SFXEventPlanRecord.targetLayer`, `decisionState`, `sourceFootagePolicy`, `anchorType`, `timingPriority`, `volumeProfile`, and `mixPriority`. `SoundEffectPlanRecord` can optionally reference deeper SFX Director records with `sfxEventPlanIds`, `sfxMixPlanIds`, and `sfxQAReportIds` while existing records remain valid.

Provider routing is modeled through `SFXProviderRouteRecord`. The supported future routes are ReeditPro internal library, MMAudio V2, Mirelo SFX V1.5, no SFX, manual upload, and unknown. Internal library is the future first choice, MMAudio V2 is the cheap/draft/Basic/Pro fallback and video-synced helper, and Mirelo SFX V1.5 is the future production-quality provider for important final-polish moments.

Provider-specific prompting is modeled through `SFXPromptPlanRecord` and `SFXPromptStyle`. MMAudio prompts use `video_conditioned_short_prompt`; Mirelo prompts can use `simple_keyword`, `short_phrase`, `tag_list`, or `structured_sentence` test styles; internal library search uses `library_search_tags`.

RP-SFX-05 adds mock backend prompt adapters that populate these prompt plan records from SFX event plans and provider routes. The adapters store provider-specific prompt text, negative prompts, search tags, duration-to-generate, timing instructions, mix instructions, and validation warnings without calling providers.

RP-SFX-06 adds mock timing contract support with `SFXDurationPlan`, `SFXMockWaveformAnalysisRecord`, `SFXTransientDetectionResult`, `SFXTimelinePlacement`, and `SFXTimingValidationResult`. These types model generate-extra-duration planning, mock waveform shape, transient strength, trim confidence, frame snapping, and timing validation issues without processing real audio.

Generated duration and trim planning are modeled through `SFXGeneratedDurationPolicy`, `SFX_GENERATED_DURATION_POLICY_RANGES`, `SFXGeneratedAssetRecord`, and `SFXTrimPlanRecord`. The contracts support generating longer audio than needed, finding a usable region, trimming, and preserving hit-offset metadata for frame-accurate placement.

Hit alignment and mix planning are modeled through `SFXTimingAlignmentRecord` and `SFXMixPlanRecord`. Timing records store anchor type, anchor time, start/hit/end placement, pre-roll, tail, generated duration, needed duration, and speech-safe placement flags. RP-SFX-06 services derive these from trim windows and hit offsets, then validate late/early hits, long tails, bad trim windows, speech overlap risk, and beat mismatch before the future mix planner. Mix records store volume profile, gain target, voice/music ducking, sidechain intent, fades, EQ notes, stereo width, reverb match, and room match.

RP-SFX-07 adds mock mix contract support with `SFXDuckingIntensity`, `SFXEQProfile`, `SFXStereoWidthProfile`, `SFXReverbProfile`, `SFXMixValidationIssue`, and `SFXMixValidationResult`. The mock mix services create `SFXMixPlanRecord` entries with voice-first target gain hints, ducking, sidechain intent, fade reuse from trim plans, EQ guidance, stereo width, room/reverb match, and validation before handing off to SFX QA.

RP-SFX-08 adds mock QA decision support through `SFXRegenerationReason`, `SFXAdjustmentType`, `SFXAdjustmentDecisionRecord`, and `SFXReplacementDecisionRecord`, while preserving existing `SFXQAReportRecord`, `SFXQAIssue`, and `SFXRegenerationDecisionRecord` usage. QA can approve use, require mix or trim adjustment, regenerate, replace with a future approved library cue, remove SFX, or ask the user. Generated library growth is modeled through `SFXLibraryCandidateRecord`, `SFXUsageRecord`, provenance fields, reuse status, license scope, and privacy flags. Future Supabase migrations should map these contracts to tables only after RP-SFX-03 review.

RP-SFX-09 adds generated SFX library-growth contracts: `SFXLibraryDecision`, `SFXReuseRisk`, `SFXLibrarySearchMatchStrength`, `SFXLibraryPromotionReason`, `SFXLibraryBlockReason`, `SFXProvenanceReviewRecord`, `SFXLibrarySearchRecord`, and `SFXUsageLearningRecord`. These contracts keep generated SFX project-only by default, model provenance/terms review, record library search attempts, evaluate candidates, and capture usage learning without approving real reuse automatically.

## Generation Providers And Google Cloud

The generation provider contracts do not hard-code one provider. They support future provider routing across Wan, Veo, Kling, Remotion, SVG renderer, Lottie renderer, Google Cloud workers, custom providers, and unknown providers.

Stroke Motion should prefer controlled renderers such as SVG, Lottie, Remotion, or custom deterministic animation when transparent overlays and word-level timing are required. AI video models may support concept generation or animation help, but the architecture should not depend only on full AI video generation for Stroke Motion.

The Google Cloud contracts store references only:

- project ID placeholder
- region
- service or job name
- bucket and object path
- Pub/Sub topic
- Secret Manager name/version
- worker runtime type
- GPU requirement
- estimated compute class

They must never contain real credentials, API keys, service account keys, or provider secrets.

## StoryTiming Type Contracts

RP-TIMING-02 adds `src/types/storytiming.ts` as the master timing coordination contract layer. StoryTiming does not replace existing timing fields in edit plans, story beats, pacing analysis, cuts, transitions, captions, Stroke Motion, music, SFX, generation, render, review, or QA records. It references those systems through `StoryTimingSourceRef`, `sourceSystem`, and `sourceRecordId` so distributed timing can be coordinated without deleting local domain timing.

The core records are `MasterTimingMapRecord`, `StoryTimingSegmentRecord`, `TimingAnchorRecord`, `TimingEventRecord`, `TimingDependencyRecord`, `TimingConflictRecord`, `TimingConflictResolutionRecord`, `StoryTimingQACheckRecord`, and `RenderTimingManifestRecord`. Together they model the approved output timing map, reusable anchors, timeline events, cross-system dependencies, detected conflicts, proposed fixes, timing QA, and the future worker-ready render manifest.

StoryTiming connects existing timing surfaces this way:

- Edit plan segments and story beats become `StoryTimingSegmentRecord` rows and source refs.
- Pacing, cut, transition, and caption timing become anchors, events, dependencies, and QA checks.
- Music cue, beat, ducking, and mix timing become music events and speech-protection dependencies.
- SFX event, trim, alignment, mix, and QA timing become SFX start/hit/end events plus hit-alignment checks.
- Stroke Motion, Graphic Design, and Real Motion timing become signature animation anchors/events tied to meaning and safe zones.
- Generated asset timing maps, render inputs, review comments, and QA markers feed render and QA tracks.

`src/lib/mock-storytiming-records.ts` includes Lake Como/lifestyle and serious faith teaching examples with captions, cuts, music cues, ducking, SFX hits, Stroke Motion, Graphic Design, Real Motion, conflicts, QA checks, and render manifests. `src/backend/contracts/storytiming-contracts.ts` provides request/response shapes for future mock services or API skeletons, but RP-TIMING-02 does not add routes, services, migrations, or database tables. RP-TIMING-03 should map these contracts to Supabase tables after review.

RP-TIMING-05 adds mock caption/cut timing contracts for `CaptionTimingPlanRecord` and `CutTimingPlanRecord`. These records do not replace caption plans, cut decisions, pacing analysis, or transcript fields; they coordinate those existing records into StoryTiming transcript anchors, caption events, cut events, pause decisions, J-cut/L-cut hints, focused conflicts, and caption/cut QA.

RP-TIMING-06 adds mock SoundSync timing contracts for `MusicBeatGridRecord`, `MusicDuckingTimingPlanRecord`, and `SoundSyncTimingIntegrationRecord`. These records do not replace music cue sheets, music mix plans, SFX event plans, SFX trim plans, SFX timing alignments, or SFX mix plans. They coordinate those existing records into StoryTiming music cue events, mock beat/downbeat anchors, voice-safe ducking windows, SFX start/hit/end events, SoundSync dependencies, focused conflicts, and music/SFX QA. Beat grids are mock estimates only until a future worker adds real audio analysis.

## Mock Records

`src/lib/mock-ai-editor-records.ts` contains typed examples that prove the model can represent:

- a chat-native project
- four source clips in uploaded order
- a chat session and user instruction message
- inline source sequence card
- intent analysis
- Basic and Signature edit quality profiles
- Stroke Motion source reading mode with `meaning_expansion`
- Stroke Motion beats, characters, symbols, transitions, timing anchors, and generation spec
- music, ambient sound, and transition plans
- credit estimate and credit reservation
- job dependency chain
- generation request placeholder
- preview render placeholder
- QA report placeholder
- revision request placeholder

These records are static examples only. They do not connect to Supabase or trigger any backend work.

## RP-BETA-INTEGRATION-16 Note

RP-BETA-INTEGRATION-16 repaired storage upload policy migration comments in `supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql` and verified the local migration chain reached the Creative Skill catalog smoke checks. No TypeScript contracts, exports, mock fixtures, package files, runtime code, providers, workers, UI, or app behavior changed.

## RP-BETA-INTEGRATION-17 Note

RP-BETA-INTEGRATION-17 verified the Creative Skill catalog foundation and canonical seed migrations locally against the static manifest. No TypeScript contracts, exports, mock fixtures, package files, runtime code, providers, workers, UI, or app behavior changed.

## RP-BETA-INTEGRATION-18 Note

RP-BETA-INTEGRATION-18 documented beta merge readiness and commit grouping. It did not change TypeScript contracts, exports, mock fixtures, package files, runtime code, providers, workers, UI, or app behavior.

## RP-BETA-INTEGRATION-19 Note

RP-BETA-INTEGRATION-19 repaired the sound-agent planner build blocker by importing the existing `SoundAgentPlan` type where it was already used. No TypeScript contracts, exports, mock fixtures, package files, migrations, runtime code, providers, workers, UI, or app behavior changed.

## RP-BETA-INTEGRATION-20 Note

RP-BETA-INTEGRATION-20 created local commits for reviewed RP-SKILLS/RP-BETA work. TypeScript contracts and fixtures were committed as local source artifacts; no package files, runtime code beyond the existing sound-agent type import, providers, workers, UI behavior, remote Supabase, push, merge, or deployment changed.

## RP-BETA-INTEGRATION-21 Note

RP-BETA-INTEGRATION-21 reviewed the post-commit state and selected Qwen reconciliation as the next beta-integration step. It did not change TypeScript contracts, exports, mock fixtures, package files, migrations, manifest files, runtime code, providers, workers, UI, remote Supabase, push, merge, or deployment behavior.

## RP-BETA-INTEGRATION-22 Note

RP-BETA-INTEGRATION-22 documented the Qwen beta clone reconciliation plan and blocked direct import because the Qwen source is mixed, dirty, untracked, and package/script-heavy. It did not change TypeScript contracts, exports, mock fixtures, package files, migrations, manifest files, runtime code, providers, workers, UI, remote Supabase, push, merge, or deployment behavior.

## RP-BETA-INTEGRATION-23 Note

RP-BETA-INTEGRATION-23 documented the Qwen clone cleanup and commit-preparation plan. It identified required future Qwen type/export work, but did not change TypeScript contracts, exports, mock fixtures, package files, migrations, manifest files, runtime code, providers, workers, UI, remote Supabase, push, merge, or deployment behavior.

## RP-BETA-INTEGRATION-24 Note

RP-BETA-INTEGRATION-24 attempted owner-approved local Qwen clone cleanup commits but stopped before staging because the Qwen package/script diff is broader than the reviewed Qwen beta-only scope. It did not change TypeScript contracts, exports, mock fixtures, package files, migrations, manifest files, runtime code, providers, workers, UI, remote Supabase, push, merge, or deployment behavior in the RP-SKILLS repo.

## RP-BETA-INTEGRATION-25 Note

RP-BETA-INTEGRATION-25 repaired the Qwen package/script split in the separate Qwen clone and created local Qwen commits for marker-chat runtime contracts, backend bridge code, Project Edit Brief marker-chat adapters, validation checks, package dependencies/scripts, and docs. It did not change RP-SKILLS TypeScript contracts, exports, mock fixtures, package files, migrations, manifest files, runtime code, providers, workers, UI, remote Supabase, push, merge, or deployment behavior.

## RP-BETA-INTEGRATION-26 Note

RP-BETA-INTEGRATION-26 imported the reviewed Qwen commit slice into RP-SKILLS, including Qwen/Project Edit Brief contracts, exports, backend services, browser-safe marker-chat adapters, validation scripts, package scripts/dependencies, and docs. Validation is blocked because the committed slice references additional dependency files that are still untracked in the Qwen clone and absent from RP-SKILLS. No Creative Skill migrations, manifest files, Creative Skill contracts, mock fixtures, Supabase config, remote Supabase, provider calls, worker execution, push, merge, or deployment behavior changed.
