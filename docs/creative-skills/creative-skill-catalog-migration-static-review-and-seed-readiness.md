# RP-SKILLS-28 Creative Skill Catalog Migration Static Review And Seed Readiness

## A. Purpose

This document statically reviews the RP-SKILLS-27 Creative Skill catalog migration and decides whether canonical catalog seed data is ready for a separate implementation milestone.

Reviewed migration:

- `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql`

This review is repository-static only. The migration was not applied, SQL was not executed, Supabase was not contacted, and no seed data was created.

Key principle:

"Review the migration from the repository; do not trust the implementation summary alone."

## B. Files Inspected

Migration and RP-SKILLS migration docs:

- `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql`
- `docs/creative-skills/creative-skill-catalog-migration-implementation-report.md`
- `docs/creative-skills/creative-skill-catalog-migration-readiness-review.md`
- `docs/creative-skills/creative-skill-catalog-migration-readiness-review-checklist.md`
- `docs/creative-skills/creative-skill-supabase-migration-blueprint-and-rls-readiness-contract.md`
- `docs/creative-skills/creative-skill-schema-planning-contract.md`

Catalog, taxonomy, type, and fixture sources:

- `docs/creative-skills/skill-taxonomy-and-family-catalog-contract.md`
- `docs/creative-skills/skill-diagnostics-and-static-validation-contract.md`
- `src/types/creative-skills-core.ts`
- `src/types/shared.ts`
- `src/types/signature-systems.ts`
- `src/lib/mock-creative-skill-records.ts`
- `docs/creative-skills/type-contract-reconciliation-report.md`
- `type-contracts.md`

Existing architecture and migration overlap:

- `database-architecture.md`
- `ai-editor-data-model.md`
- `signature-systems.md`
- `backend-database-roadmap.md`
- `supabase/migrations/`

## C. Migration Static Review Decision

Decision: `migration_static_review_repaired_and_passed`

The migration matched the approved six-table catalog scope, RLS posture, no-seed boundary, no-runtime boundary, and signature-system compatibility boundary. Static review found three concrete migration defects, all repaired in the existing RP-SKILLS-27 migration file without changing its filename, table count, RLS model, grants, or seed state.

The migration is ready for a later local apply/dry-run milestone only after owner review accepts the static repair and a future prompt explicitly permits local database execution.

## D. Migration Changes Made

Patched only `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql`.

Changes:

- Added `creative_skill_families.related_planning_contracts` as JSONB array metadata with a shape check and boundary comment.
- Changed `creative_skill_aliases.canonical_skill_key` from required to nullable, with a conditional lowercase snake_case check.
- Added a boundary comment for `creative_skill_contract_mappings.planning_contract_type`.
- Added boundary comments for `creative_skill_duplicate_reviews.decision` and `creative_skill_duplicate_reviews.status`.

No migration timestamp, filename, table count, seed data, RLS policy, grant, TypeScript contract, mock fixture, package file, runtime file, or Supabase state changed.

## E. Table-By-Table Findings

| Table | Static result | Notes |
| --- | --- | --- |
| `creative_skill_families` | Repaired and passed. | Has UUID PK, key/display/purpose, parent self-reference, primary contract, related planning-contract metadata, source docs, duplicate-risk notes, lifecycle, positive version, metadata JSON, timestamps, indexes, trigger, comments, RLS, and authenticated read policy. |
| `creative_skills` | Passed. | Has UUID PK, canonical key, family FK, skill type, purpose fields, planning contract fields, recommendation/complexity/credit/approval tendencies, runtime/source metadata, affinity JSON arrays, use/avoid summaries, no-action self-reference, notes-only tool/worker/provider columns, lifecycle, owner doc, version, timestamps, indexes, trigger, comments, RLS, and authenticated read policy. |
| `creative_skill_aliases` | Repaired and passed. | Has normalized alias, required canonical skill FK, optional readable canonical key, alias/conflict/status metadata, avoid-new-usage, notes, metadata JSON, timestamps, indexes, trigger, comments, RLS, and authenticated read policy. |
| `creative_skill_relationships` | Passed. | Has from/to skill FKs and keys, relationship type, reason, strength, coexistence and StoryTiming flags, credit/approval notes, lifecycle, uniqueness, no-self checks, indexes, trigger, comments, RLS, and authenticated read policy. No family-level relationship columns were added. |
| `creative_skill_contract_mappings` | Repaired and passed. | Has skill FK/key, planning contract type, required flag, mapping role, readiness booleans, attachment reason, expected plan record type, status, version, metadata JSON, unique skill/contract constraint, indexes, trigger, comments, RLS, and authenticated read policy. |
| `creative_skill_duplicate_reviews` | Repaired and passed. | Has proposed key/family metadata, similar-key arrays, risk/decision/status metadata, notes, metadata JSON, timestamps, indexes, trigger, comments, and RLS. It has no anon/authenticated policy or grant. |

## F. Constraint And TypeScript Alignment Matrix

| SQL field/check | TypeScript source | SQL values | TypeScript values | Aligned? | Decision |
| --- | --- | --- | --- | --- | --- |
| `skill_type` | `CreativeSkillType` | 7 | 7 | Yes | No migration change needed. |
| `lifecycle_status` | `CreativeSkillLifecycleStatus` | 7 | 7 | Yes | No migration change needed. |
| `default_recommendation_level` | `CreativeSkillRecommendationLevel` | 8 | 8 | Yes | No migration change needed. |
| `default_complexity` | `CreativeSkillComplexity` | 5 | 5 | Yes | No migration change needed. |
| `default_credit_tendency` | `CreditImpact` plus `variable` and `unknown` | 7 | 7 | Yes | No migration change needed. |
| `default_approval_tendency` | `CreativeSkillApprovalTendency` | 7 | 7 | Yes | No migration change needed. |
| `relationship_type` | `CreativeSkillRelationshipType` | 9 | 9 | Yes | No migration change needed. |
| `primary_planning_contract` | `CreativeSkillPlanningContractType` | 19 | 19 | Yes | No migration change needed. |
| `planning_contract_type` | `CreativeSkillPlanningContractType` | 19 | 19 | Yes | Boundary comment added. |
| `runtime_readiness` | `CreativeSkillRuntimeReadiness` | 7 | 7 | Yes | No migration change needed. |
| `source_safety_status` | `CreativeSkillSourceSafetyStatus` | 8 | 8 | Yes | No migration change needed. |
| Alias type/status fields | Inline unions in `CreativeSkillAliasRecord` plus lifecycle status | Matches current aliases/status style. | Matches current type intent. | Yes | `canonical_skill_key` made optional. |
| Duplicate review fields | Inline unions in `CreativeSkillDuplicateReviewRecord` plus `ProcessingStatus` | Matches current risk/decision/status style. | Matches current type intent. | Yes | Boundary comments added. |

## G. Index, Trigger, And Comment Findings

Indexes are focused on keys, FKs, lifecycle/status filters, relationship type, planning contract type, and duplicate-review triage. No excessive runtime indexes were added.

All six tables use `public.set_updated_at()` triggers. Static inspection found `public.set_updated_at()` exists in earlier migrations, and the RP-SKILLS-27 migration reuses it rather than redefining it.

Comments exist on all six tables and key boundary columns. RP-SKILLS-28 repaired missing comments for related planning contracts, planning contract type, duplicate-review decision, and duplicate-review status.

## H. Privilege And RLS Findings

RLS is enabled on all six tables.

Authenticated `select` policies and grants exist only for:

- `creative_skill_families`
- `creative_skills`
- `creative_skill_aliases`
- `creative_skill_relationships`
- `creative_skill_contract_mappings`

`creative_skill_duplicate_reviews` has RLS enabled but no anon or authenticated read/write policy and no authenticated grant.

The migration revokes table privileges from `public`, `anon`, and `authenticated` before granting authenticated select on the five catalog metadata tables. No service-role policy or admin role system was introduced.

## I. Forbidden SQL And Runtime Checks

Static checks found no:

- seed SQL.
- `insert into`.
- `copy`.
- workspace, project, edit-plan, or user ownership fields.
- signature-system alteration or direct FK.
- provider key, API key, signed URL, credential, or secret column.
- job creation, worker creation, generation request, credit reservation, approval execution, render/export execution, browser capture, network access, dynamic provider execution, or runtime trigger.
- second migration file.

The migration remains local and unapplied.

## J. Signature-System Compatibility Findings

Existing signature-system owners remain separate:

- `SignatureSystemCatalogRecord` in `src/types/signature-systems.ts`.
- `public.signature_system`.
- `public.signature_routes`.
- Existing Stroke Motion, Real Motion, SoundSync, generation, credit, QA, SFX, render/revision, and worker references to `signature_routes`.

The RP-SKILLS-27 migration does not modify signature-system tables, enums, routes, TypeScript contracts, or runtime behavior. It also does not add direct FKs to signature-system tables.

## K. Canonical Family Seed Readiness

Canonical source: `CreativeSkillFamily` in `src/types/creative-skills-core.ts`.

Exact canonical family count: 21.

Mock fixture coverage: 4 family records.

Missing fixture coverage: 17 families, including `core_editing`, `story_timing`, `transition`, `b_roll`, `overlay_compositing`, `motion_design`, `stroke_motion`, `real_motion`, `browser_app_visuals`, `audio_cleanup`, `sfx`, `color_finish`, `render_export`, `qa`, `approval_credit`, `reference_dna`, and `edit_preference`.

Family seed readiness: not ready. Every family needs a reviewed seed manifest row with display name, purpose, primary planning contract, related planning contracts, lifecycle status, version, source-of-truth documents, parent-family decision, duplicate-risk notes, and metadata policy.

## L. Canonical Skill Seed Readiness

Canonical source: `CreativeSkillKey` in `src/types/creative-skills-core.ts`.

Exact canonical skill count: 140.

Mock fixture coverage: 10 catalog records.

Missing fixture coverage: 130 skill keys.

Taxonomy parity notes:

- RP-SKILLS-13 launch taxonomy is broad enough to guide a full manifest, but it needs cleanup before seed implementation.
- At RP-SKILLS-28 review time, docs contained legacy `CTA_card_design`, while TypeScript used `cta_card_design`.
- At RP-SKILLS-28 review time, docs used legacy `universal_skill_planning_contract`, while TypeScript and SQL used `universal_skill_plan`.
- The docs use approval labels such as `no_approval_needed`, `approval_if_user_visible`, `approval_if_credit_bearing`, `approval_if_premium`, `approval_always`, and `source_confirmation_needed`; these need an approved mapping to SQL/TypeScript approval tendency values.

Skill seed readiness: not ready. A full canonical seed manifest must assign every skill display name, family, type, short purpose, plain-language definition or approved source, professional standard or approved source, primary and related contracts, recommendation level, complexity, credit tendency, approval tendency, use/avoid summaries, lifecycle status, version, owner doc, and optional no-action counterpart.

## M. Alias Seed Readiness

Canonical source candidates:

- RP-SKILLS-13 alias guidance.
- `CreativeSkillAliasRecord`.
- `mockCreativeSkillAliases`.

Mock alias coverage: 3 aliases.

Current mock alias examples:

- `VisualExplain` -> `graphic_design_visual_explain`
- `3D popout` -> `three_d_overlay_integration`
- `clean captions` -> `caption_design`

Seed readiness issues:

- Alias set is not complete.
- Current mock aliases include non-normalized examples such as `VisualExplain` and `3D popout`; the migration requires lowercase normalized alias text.
- Every alias needs a canonical target, alias type, conflict status, avoid-new-usage value, status, notes/source, and normalization review.
- Aliases that collide with canonical skill keys need an owner decision.

Alias seed readiness: not ready.

## N. Relationship Seed Readiness

Canonical source candidates:

- RP-SKILLS-13 relationship guidance.
- `CreativeSkillRelationshipRecord`.
- `mockCreativeSkillRelationships`.

Mock relationship coverage: 3 relationships.

Current mock relationship examples:

- `graphic_design_visual_explain` -> `three_d_overlay_integration` as `lower_cost_alternative_to`
- `caption_design` -> `storytiming_coordination` as `coordinates_with`
- `soundsync_music_planning` -> `storytiming_coordination` as `coordinates_with`

Seed readiness issues:

- Initial relationship rows are not fully approved.
- Relationship direction, strength, coexistence, StoryTiming coordination, credit/approval notes, and lifecycle status need manifest coverage.
- Relationship types mentioned in docs such as `premium_alternative_to`, `supersedes`, `child_of`, and `parent_of` are not part of the RP-SKILLS-21 SQL/TypeScript relationship union and need mapping or deferral.
- Family-level relationships should remain deferred unless later owner-approved.

Relationship seed readiness: not ready.

## O. Contract-Mapping Seed Readiness

Canonical source candidates:

- RP-SKILLS-13 planning-contract mapping.
- `CreativeSkillContractMappingRecord`.
- `mockCreativeSkillContractMappings`.
- Specialized RP-SKILLS contracts.

Mock contract-mapping coverage: 3 mappings.

Current mock contract-mapping examples:

- `caption_design` -> `caption_planning_contract`
- `graphic_design_visual_explain` -> `graphic_design_planning_contract`
- `three_d_overlay_integration` -> `three_d_visual_planning_contract`

Seed readiness issues:

- Every canonical skill needs at least its primary mapping reviewed.
- Specialized contract mappings must be reconciled for multi-contract skills such as 3D transition objects, browser/app visuals, QA skills, Reference DNA, render/export planning, and approval/credit planning.
- Mapping role, required flag, readiness booleans, expected plan record type, owner doc, checklist doc, status, version, and runtime-readiness notes need manifest coverage.
- Legacy `universal_skill_planning_contract` in RP-SKILLS-13 docs must be mapped to `universal_skill_plan` or corrected before seed SQL exists.

Contract-mapping seed readiness: not ready.

## P. Duplicate-Review Seed Decision

Decision: no canonical duplicate-review seed rows.

`creative_skill_duplicate_reviews` should remain empty in canonical seed work. It is an internal/admin audit table for later proposed skill additions, not a deterministic catalog seed table.

## Q. Seed Coverage Matrix

| Seed group | Canonical source | Expected count | Metadata complete? | Unresolved gaps | Ready for seed implementation? | Decision |
| --- | --- | ---: | --- | --- | --- | --- |
| Family seeds | `CreativeSkillFamily` | 21 | No | 17 families missing fixture coverage; full reviewed manifest needed. | No | Complete docs/static family manifest first. |
| Skill seeds | `CreativeSkillKey` | 140 | No | 130 skill keys missing fixture coverage; taxonomy/type parity cleanup needed. | No | Complete docs/static skill manifest first. |
| Alias seeds | RP-SKILLS-13 plus alias records | Not approved | No | Exact alias set, normalization, conflicts, status, avoid-new-usage, and source notes missing. | No | Complete alias manifest first. |
| Relationship seeds | RP-SKILLS-13 plus relationship records | Not approved | No | Exact rows, directions, strengths, allowed type mapping, and StoryTiming flags missing. | No | Complete relationship manifest first. |
| Contract-mapping seeds | RP-SKILLS-13 plus contract mapping records | At least 140 primary mappings | No | Universal/specialized mapping coverage and readiness booleans incomplete. | No | Complete contract-mapping manifest first. |
| Duplicate-review seeds | RP-SKILLS-26/27 decision | 0 | Yes | None for canonical seed. | Yes, as empty set only. | Do not seed duplicate reviews. |

## R. Seed Readiness Decision

Decision: `not_ready_seed_metadata_incomplete`

A seed implementation prompt is not yet safe. The repo has enough doctrine, TypeScript contracts, and fixture examples to build a canonical manifest, but it does not yet have complete approved seed metadata for all canonical families, skills, aliases, relationships, and contract mappings.

Recommended next prompt:

`RP-SKILLS-29 - Creative Skill Catalog Canonical Seed Manifest Completion`

## S. Blockers And Warnings

Seed blockers:

- Complete 21-family seed manifest is missing.
- Complete 140-skill seed manifest is missing.
- Alias seed set is incomplete and current examples need normalization.
- Relationship seed set is incomplete and includes relationship labels that need mapping or deferral.
- Contract-mapping seed coverage is incomplete.
- Legacy taxonomy/type parity cleanup was needed for `CTA_card_design` versus `cta_card_design`.
- Legacy contract naming cleanup was needed for `universal_skill_planning_contract` versus `universal_skill_plan`.
- Approval tendency labels in docs need approved mapping to TypeScript/SQL values.

Migration warnings:

- The migration has not been applied or SQL-validated in a database.
- Static review cannot prove runtime DB privileges; a later local apply/dry-run prompt must check actual database behavior.

## T. Known Unrelated Build Status

Known state from RP-SKILLS-23 remains unchanged: `npm run build` previously failed only on unrelated `src/backend/services/sound-agent-planner-service.ts` TypeScript issues.

RP-SKILLS-28 does not run build and does not modify that runtime service.

## U. Migration Application Status

The migration remains unapplied.

No Supabase CLI command was run. No SQL was executed. No Supabase project was contacted. No database reset, deployment, provider call, worker execution, render/export, app runtime, seed implementation, TypeScript change, package change, or mock fixture change occurred.

## V. Recommended Next Prompt

Recommended next prompt:

`RP-SKILLS-29 - Creative Skill Catalog Canonical Seed Manifest Completion`

Allowed RP-SKILLS-29 scope:

- Docs/static metadata completion only.
- Resolve missing family, skill, alias, relationship, and contract-mapping seed metadata.
- Normalize taxonomy/type parity issues.
- Define seed manifest rows without creating SQL.

Forbidden RP-SKILLS-29 scope unless explicitly approved later:

- SQL, migrations, seed implementation, Supabase connection, migration execution, package changes, TypeScript changes, mock fixture changes, runtime code, UI, providers, workers, jobs, render/export, app runtime, or deployment.
