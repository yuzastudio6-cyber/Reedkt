# RP-SKILLS-26 Creative Skill Catalog Migration Readiness Review

## A. Purpose

This document reviews readiness for the future first Creative Skill catalog migration package.

This readiness review is not SQL and not a migration.

This is documentation only. It does not create migrations, create SQL, connect to Supabase, modify schema, seed data, create RLS policies, create TypeScript contracts, modify mock fixtures, or implement runtime behavior.

It decides whether future catalog migration work is ready.

Question answered:

"Are we ready to safely write the first catalog migration later?"

Key principle:

"Do not write SQL until the catalog migration scope is narrow, reviewed, and source-of-truth aligned."

Future backend/database work must target the Supabase project named `reeditpro` only. Do not use Yuza Studio Supabase resources.

## B. Readiness Decision Summary

| Field | Value |
| --- | --- |
| decision | `ready_with_warnings` |
| summary | The catalog package is narrow enough for a future migration-only prompt, and required RP-SKILLS docs/types/fixtures/blueprints exist. No `creative_skill_*` migration tables were found. The major overlap is existing `signature_system` and `signature_routes`, which must be treated as compatibility owners rather than replaced. |
| blockers | None that require another docs-only repair prompt before a catalog-only migration prompt. |
| warnings | Owner approval is still required before SQL. RLS policy shape, seed contents, enum/check strategy, and signature-system compatibility need final owner review in the future migration prompt. |
| owner decisions needed | Confirm catalog read policy model, admin/service write model, deterministic seed scope, whether duplicate reviews are created in the first migration, and compatibility notes for `SignatureSystemCatalogRecord` / `signature_routes`. |
| recommended next prompt | `RP-SKILLS-27 - Creative Skill Catalog Supabase Migration Implementation` |

This decision does not approve production deployment, Supabase connection, or any non-catalog migration.

## C. Scope Of First Migration Package

The future first migration package should include exactly these catalog foundation tables:

- `creative_skill_families`
- `creative_skills`
- `creative_skill_aliases`
- `creative_skill_relationships`
- `creative_skill_contract_mappings`
- `creative_skill_duplicate_reviews`

The package should be catalog-only because the catalog is the dependency for later preferences, opportunities, concepts, candidates, routes, plans, StoryTiming, credit/approval, QA, diagnostics, and runtime handoffs. A narrow package makes review, rollback, seed validation, and signature-system compatibility easier.

The first migration package must not include:

- edit preference tables.
- visual opportunity tables.
- creative concept tables.
- skill candidate or resolver tables.
- route or plan assembly tables.
- specialized plan tables.
- StoryTiming tables.
- credit/approval planning tables.
- QA or diagnostics tables beyond duplicate-review readiness.
- jobs or workers.
- provider/tool execution tables.
- user project planning data.

## D. Source-Of-Truth Alignment

| Source | What it owns | Relevance to catalog migration | Conflict/overlap | Decision |
| --- | --- | --- | --- | --- |
| RP-SKILLS-13 taxonomy contract | Canonical skill vocabulary, families, keys, aliases, relationships, mappings, duplicate reviews. | Primary docs source for catalog meaning. | None; docs-only source. | Use as semantic source truth. |
| RP-SKILLS-20 diagnostics contract | Future duplicate-key, alias, and catalog drift diagnostics. | Informs duplicate review and validation expectations. | Diagnostics tables are not required yet. | Reference only; do not implement diagnostics runtime. |
| RP-SKILLS-21 TypeScript contracts | `CreativeSkillFamilyRecord`, `CreativeSkillCatalogRecord`, alias, relationship, duplicate review, and contract mapping shapes. | Primary field-shape source. | CamelCase type fields must map to snake_case DB fields. | Use as migration field mapping source. |
| RP-SKILLS-22 mock fixtures | Static examples for catalog records, aliases, relationships, mappings. | Seed-readiness and validation examples. | Mock fixtures are not seed scripts. | Use as seed guidance, not automatic inserted data. |
| RP-SKILLS-23 reconciliation report | Type/export collision findings and known build state. | Confirms type-only layer was reconciled. | Known unrelated build failure remains outside catalog migration. | Preserve build note; do not edit runtime. |
| RP-SKILLS-24 schema planning contract | Future table group planning. | Defines catalog as phase 1. | No conflict. | Use table group direction. |
| RP-SKILLS-25 migration blueprint | Catalog phase, RLS/security, FK, JSON, seed, rollback, validation readiness. | Direct predecessor for this readiness review. | No conflict. | Narrow to catalog package only. |
| Existing signature-systems docs/types | `SignatureSystemCatalogRecord`, signature systems, worker targets. | Compatibility owner for Stroke Motion, Graphic Design, Real Motion, SoundSync identity. | Future Creative Skill catalog is broader and must not replace signature systems. | Keep separate; add compatibility notes. |
| Existing database architecture docs | Database, approval, jobs, provider, QA, media, StoryTiming, RLS owners. | Prevents duplicate lanes. | Catalog package must not create runtime or project data tables. | Reference only. |
| Existing migrations | Current SQL source truth. | Shows no Creative Skill catalog tables and does show signature route owners. | `signature_system` enum and `signature_routes` already exist. | Catalog migration may proceed later with warnings. |

## E. Existing Migration Overlap Review

Existing migration files were found under `supabase/migrations/`.

Relevant migration areas:

- Core workspace/project/chat/media/source-sequence tables.
- Intent and edit planning tables.
- Professional edit-quality tables.
- Credit ledger and approval gate tables.
- Job orchestration and agent run tables.
- Stroke Motion data model tables.
- Generation provider and generated asset tables.
- Render, preview, export, revision, and QA tables.
- RLS and storage policy migrations.
- SFX Director tables.
- StoryTiming master tables.
- Worker lease/runtime transport tables.
- E2E runtime readiness tables.

Existing catalog-like tables:

- No `creative_skill_families`, `creative_skills`, `creative_skill_aliases`, `creative_skill_relationships`, `creative_skill_contract_mappings`, or `creative_skill_duplicate_reviews` migration tables were found.

Existing signature-system overlap:

- `public.signature_system` enum exists.
- `public.signature_routes` exists.
- `edit_plan_segments.signature_system` exists.
- Several generation, credit, QA, Stroke Motion, SFX, and render/revision tables reference `signature_routes`.
- RLS is enabled for `signature_routes` with workspace-member/editor style policies.

Catalog migration name conflict:

- Proposed `creative_skill_*` table names do not directly conflict with existing migration names found.
- Future migration must still inspect the full migration set immediately before writing SQL.

Unresolved questions:

- Whether catalog tables should be public-read or authenticated-read in the final SQL.
- Whether catalog seed data should be included in the first migration or a later reviewed seed step.
- Whether duplicate-review storage is needed immediately or can remain empty/admin-only until catalog edits become dynamic.

## F. Existing Type Overlap Review

| Type | Source file | Key fields | Proposed table | Field mapping readiness | Gaps | Naming decisions |
| --- | --- | --- | --- | --- | --- | --- |
| `CreativeSkillFamilyRecord` | `src/types/creative-skills-core.ts` | `skillFamily`, `displayName`, `description`, `canonicalSkillKeys`, `parentFamily`, `relatedFamilies`, `lifecycleStatus`, `defaultPlanningContract`, credit/approval tendencies. | `creative_skill_families` | Ready with normalized relationship decisions. | Array fields need relational or derived handling. | Use `family_key`, `display_name`, `purpose`, `belongs_to_family_key`, `lifecycle_status`, `version`, `metadata_json`. |
| `CreativeSkillCatalogRecord` | `src/types/creative-skills-core.ts` | `skillKey`, `displayName`, `skillFamily`, `skillType`, `shortPurpose`, contracts, lifecycle, recommendation, complexity, credit/approval tendencies, runtime/source safety, summaries, related/alternative keys. | `creative_skills` | Ready with structured columns plus relationship table. | Some affinity fields exist in docs more than types. | Use `skill_key`, `skill_family`, `skill_type`, `primary_planning_contract`, `lifecycle_status`, and structured default tendency columns. |
| `CreativeSkillAliasRecord` | `src/types/creative-skills-core.ts` | `alias`, `canonicalSkillKey`, `aliasType`, `conflictStatus`, review fields. | `creative_skill_aliases` | Ready. | Future FK id is DB-only. | Keep both `canonical_skill_id` and `canonical_skill_key` for audit/readability. |
| `CreativeSkillRelationshipRecord` | `src/types/creative-skills-core.ts` | `fromSkillKey`, `toSkillKey`, `relationshipType`, `reason`, `strength`, `status`. | `creative_skill_relationships` | Ready. | Family-level relationships not represented directly. | Skill-level rows first; defer family-level table. |
| `CreativeSkillDuplicateReviewRecord` | `src/types/creative-skills-core.ts` | proposed key/family, similar keys, duplicate risk, decision, rationale, reviewer fields. | `creative_skill_duplicate_reviews` | Ready as admin audit table. | Could remain docs/static initially. | Include table in first package, empty and unseeded. |
| `CreativeSkillContractMappingRecord` | `src/types/creative-skills-core.ts` | `skillKey`, `skillFamily`, `planningContractType`, owner/checklist docs, status, runtime readiness, required-before-route-assembly. | `creative_skill_contract_mappings` | Ready with extra readiness booleans from RP-SKILLS-26 docs. | Future migration must decide booleans beyond route assembly. | Use `planning_contract_type`, `required`, `primary_contract`, readiness booleans, `expected_plan_record_type`. |

## G. Signature System Catalog Compatibility Review

Existing signature systems are not replaced by this first catalog migration.

`SignatureSystemCatalogRecord` already exists in `src/types/signature-systems.ts` and covers `stroke_motion`, `graphic_design`, `real_motion`, `sound_sync`, and `none`, with worker targets and credit impact. The SQL lane also has `public.signature_system` and `public.signature_routes`.

Creative Skill catalog is broader than signature systems. It includes captions, transitions, B-roll, overlays, motion design, 3D, browser/app visuals, audio cleanup, SoundSync, SFX, QA, approval/credit, Reference DNA, edit preference, no-action skills, and planning-only future skills.

Compatibility decisions:

- Do not delete or rename existing signature system docs, types, migrations, or mock behavior.
- Do not migrate `signature_routes` into Creative Skill routes in the catalog migration.
- Do not duplicate worker target ownership in `creative_skills`.
- Later route/schema work may map signature systems into Creative Skill rows or keep them as compatibility records.
- Future migration implementation must include compatibility notes for signature systems and must not treat signature systems as provider/tool registries.

## H. Table Readiness: `creative_skill_families`

| Item | Decision |
| --- | --- |
| purpose | Store canonical Creative Skill family vocabulary. |
| readiness status | `ready_with_warnings` |
| RLS expectation | Enable RLS; authenticated read or public-read decision requires owner approval; admin/service write only. |
| seed/static data expectation | Deterministic seed likely useful; align with `CreativeSkillFamily` union. |
| rollback/supersession notes | Additive table; rollback may drop table in local/dev before dependencies. Future deprecation should use lifecycle status, not deletion. |

Proposed field list:

- `id`
- `family_key`
- `display_name`
- `purpose`
- `belongs_to_family_key`
- `primary_planning_contract`
- `source_of_truth_docs`
- `duplicate_risk_notes`
- `lifecycle_status`
- `version`
- `created_at`
- `updated_at`
- `metadata_json`

Required fields:

- `id`
- `family_key`
- `display_name`
- `purpose`
- `primary_planning_contract`
- `lifecycle_status`
- `version`
- `created_at`
- `updated_at`

Optional fields:

- `belongs_to_family_key`
- `source_of_truth_docs`
- `duplicate_risk_notes`
- `metadata_json`

Relationship decision:

- Do not store `child_family_keys` or `canonical_skill_keys` as required JSON/array fields in this first migration.
- Derive skill membership from `creative_skills.skill_family`.
- Defer separate family relationship modeling unless a later owner review proves it is needed.

Candidate constraints:

- Unique `family_key`.
- Non-empty `display_name`.
- Lifecycle status constrained later after TypeScript/DB status owner review.

Candidate indexes:

- `family_key`.
- `lifecycle_status`.
- `updated_at`.

Validation checks:

- Every seeded `family_key` maps to `CreativeSkillFamily`.
- Active family rows have owner/source docs.
- No provider/tool names are used as family keys.

## I. Table Readiness: `creative_skills`

| Item | Decision |
| --- | --- |
| purpose | Store canonical Creative Skill keys and catalog metadata. |
| readiness status | `ready_with_warnings` |
| RLS expectation | Enable RLS; authenticated read or public-read decision requires owner approval; admin/service write only. |
| seed/static data expectation | Deterministic seed likely useful; align with `CreativeSkillKey` and RP-SKILLS-22 fixtures. |
| rollback/supersession notes | Additive table; future deprecation/replacement should use lifecycle status and no-action/alternative fields, not deletion. |

Proposed field list:

- `id`
- `skill_key`
- `display_name`
- `skill_family`
- `skill_type`
- `short_purpose`
- `plain_language_definition`
- `professional_standard`
- `primary_planning_contract`
- `default_recommendation_level`
- `default_complexity`
- `default_credit_tendency`
- `default_approval_tendency`
- `edit_preference_affinities`
- `workflow_affinities`
- `platform_affinities`
- `when_to_use_summary`
- `when_to_avoid_summary`
- `no_action_counterpart_skill_key`
- `tool_candidate_notes`
- `worker_target_notes`
- `provider_boundary_notes`
- `QA_family`
- `lifecycle_status`
- `version`
- `owner_doc`
- `created_at`
- `updated_at`
- `metadata_json`

Required fields:

- `id`
- `skill_key`
- `display_name`
- `skill_family`
- `skill_type`
- `short_purpose`
- `primary_planning_contract`
- `default_recommendation_level`
- `default_complexity`
- `default_credit_tendency`
- `default_approval_tendency`
- `when_to_use_summary`
- `when_to_avoid_summary`
- `lifecycle_status`
- `version`
- `owner_doc`
- `created_at`
- `updated_at`

Optional fields:

- `plain_language_definition`
- `professional_standard`
- `edit_preference_affinities`
- `workflow_affinities`
- `platform_affinities`
- `no_action_counterpart_skill_key`
- `tool_candidate_notes`
- `worker_target_notes`
- `provider_boundary_notes`
- `QA_family`
- `metadata_json`

Structured versus `metadata_json` decision:

- Keep catalog identity, family, type, contract, lifecycle, recommendation, complexity, credit/approval tendency, use/avoid summaries, no-action counterpart, owner doc, and boundary notes as structured columns.
- Do not hide route reason, provider boundary, worker notes, approval tendency, credit tendency, or source-of-truth ownership in `metadata_json`.
- Use `metadata_json` only for non-critical future notes.

Relationship decision:

- Do not store `related_skill_keys`, `alternative_skill_keys`, or `lower_cost_alternative_skill_keys` as primary JSON/array fields in `creative_skills`.
- Store skill relationships in `creative_skill_relationships`.

Candidate constraints:

- Unique `skill_key`.
- `skill_family` references `creative_skill_families.family_key` or table id after final SQL design.
- Active skills require `owner_doc`.
- Lifecycle/status checks later.

Candidate indexes:

- `skill_key`.
- `skill_family`.
- `lifecycle_status`.
- `primary_planning_contract`.
- `updated_at`.

Validation checks:

- Every seeded `skill_key` maps to `CreativeSkillKey`.
- Every seeded `skill_family` maps to `CreativeSkillFamily`.
- No provider/tool names are used as skill keys.
- No active skill lacks an owner doc or planning contract.

## J. Table Readiness: `creative_skill_aliases`

| Item | Decision |
| --- | --- |
| purpose | Map user phrases, display names, legacy names, and prompt phrases to canonical skill keys. |
| readiness status | `ready_with_warnings` |
| RLS expectation | Enable RLS; catalog read model; admin/service write only. |
| seed/static data expectation | Seed only reviewed aliases from RP-SKILLS-22 or owner-approved catalog data. |
| rollback/supersession notes | Use status and avoid-new-usage markers for deprecated aliases; do not hard delete once user-facing records may reference them. |

Proposed field list:

- `id`
- `alias`
- `canonical_skill_key`
- `canonical_skill_id`
- `alias_type`
- `reason`
- `status`
- `avoid_new_usage`
- `notes`
- `created_at`
- `updated_at`
- `metadata_json`

Required fields:

- `id`
- `alias`
- `canonical_skill_key`
- `canonical_skill_id`
- `alias_type`
- `status`
- `avoid_new_usage`
- `created_at`
- `updated_at`

Optional fields:

- `reason`
- `notes`
- `metadata_json`

Canonical key/id decision:

- Store both `canonical_skill_id` and denormalized `canonical_skill_key`.
- The id provides FK integrity.
- The key keeps seed diffs readable, preserves audit clarity, and supports validation against `CreativeSkillKey`.

Candidate constraints:

- Unique normalized `alias`.
- FK from `canonical_skill_id` to `creative_skills.id`.
- Optional consistency check between `canonical_skill_id` and `canonical_skill_key` later.

Candidate indexes:

- `alias`.
- `canonical_skill_key`.
- `status`.
- `updated_at`.

Validation checks:

- Every alias points to an active or intentionally deprecated canonical skill.
- No alias creates a second canonical skill lane.
- Conflict aliases are reviewed before active use.

## K. Table Readiness: `creative_skill_relationships`

| Item | Decision |
| --- | --- |
| purpose | Store support, conflict, alternative, lower-cost, required, and coordination relationships between canonical skills. |
| readiness status | `ready_with_warnings` |
| RLS expectation | Enable RLS; catalog read model; admin/service write only. |
| seed/static data expectation | Seed owner-reviewed relationships only. |
| rollback/supersession notes | Use lifecycle status for deprecated relationships; keep historical relationship rows auditable once referenced. |

Proposed field list:

- `id`
- `from_skill_key`
- `from_skill_id`
- `to_skill_key`
- `to_skill_id`
- `relationship_type`
- `reason`
- `can_coexist`
- `requires_storytiming_coordination`
- `credit_relationship`
- `approval_relationship`
- `notes`
- `lifecycle_status`
- `created_at`
- `updated_at`
- `metadata_json`

Required fields:

- `id`
- `from_skill_key`
- `from_skill_id`
- `to_skill_key`
- `to_skill_id`
- `relationship_type`
- `reason`
- `can_coexist`
- `requires_storytiming_coordination`
- `lifecycle_status`
- `created_at`
- `updated_at`

Optional fields:

- `credit_relationship`
- `approval_relationship`
- `notes`
- `metadata_json`

Family-level relationship decision:

- First migration should handle skill-level relationships only.
- Family-level relationships remain documented in RP-SKILLS-13 and can be derived or added later if owner-approved.

Candidate constraints:

- Unique `from_skill_id` + `to_skill_id` + `relationship_type`.
- Prevent self-relationship unless a later owner decision explicitly allows it.
- Relationship type checks later after enum strategy review.

Candidate indexes:

- `from_skill_key`.
- `to_skill_key`.
- `relationship_type`.
- `lifecycle_status`.

Validation checks:

- Both skill keys exist in catalog.
- Conflicts and lower-cost alternatives do not create impossible circular instructions.
- StoryTiming coordination flag is present for known collision-prone relationships.

## L. Table Readiness: `creative_skill_contract_mappings`

| Item | Decision |
| --- | --- |
| purpose | Map skills to planning contract types and readiness requirements. |
| readiness status | `ready_with_warnings` |
| RLS expectation | Enable RLS; catalog read model; admin/service write only. |
| seed/static data expectation | Seed mappings for active seeded skills. |
| rollback/supersession notes | Use status and version for mapping changes; do not silently mutate required contract history once routes depend on it. |

Proposed field list:

- `id`
- `skill_key`
- `skill_id`
- `planning_contract_type`
- `required`
- `primary_contract`
- `secondary_contract`
- `required_before_credit_estimate`
- `required_before_approval`
- `required_before_future_execution`
- `attachment_reason`
- `expected_plan_record_type`
- `status`
- `version`
- `created_at`
- `updated_at`
- `metadata_json`

Required fields:

- `id`
- `skill_key`
- `skill_id`
- `planning_contract_type`
- `required`
- `primary_contract`
- `required_before_credit_estimate`
- `required_before_approval`
- `required_before_future_execution`
- `status`
- `version`
- `created_at`
- `updated_at`

Optional fields:

- `secondary_contract`
- `attachment_reason`
- `expected_plan_record_type`
- `metadata_json`

Candidate constraints:

- Unique `skill_id` + `planning_contract_type`.
- Exactly one primary contract per skill should be enforced later if practical.
- Contract status checks later after enum strategy review.

Candidate indexes:

- `skill_key`.
- `planning_contract_type`.
- `required`.
- `primary_contract`.
- `status`.

Validation checks:

- Every active skill has at least one mapping.
- Every primary planning contract has an owner doc.
- No mapping points to runtime worker/provider execution.

## M. Table Readiness: `creative_skill_duplicate_reviews`

| Item | Decision |
| --- | --- |
| purpose | Store admin/reviewer audit records for proposed duplicate or conflicting catalog additions. |
| readiness status | `ready_with_warnings` |
| RLS expectation | Enable RLS; admin/reviewer read/write only unless owner later allows broader audit read. |
| seed/static data expectation | No seed data in first migration. |
| rollback/supersession notes | Audit records should not be hard-deleted once catalog edits are dynamic; early local/dev rollback can drop the empty table if safe. |

Proposed field list:

- `id`
- `proposed_skill_key`
- `proposed_family`
- `similar_existing_skill_keys`
- `similar_aliases`
- `duplicate_risk`
- `decision`
- `decision_reason`
- `planning_contract_mapping`
- `reviewer_notes`
- `status`
- `created_at`
- `updated_at`
- `metadata_json`

Required fields:

- `id`
- `proposed_skill_key`
- `proposed_family`
- `duplicate_risk`
- `decision`
- `decision_reason`
- `status`
- `created_at`
- `updated_at`

Optional fields:

- `similar_existing_skill_keys`
- `similar_aliases`
- `planning_contract_mapping`
- `reviewer_notes`
- `metadata_json`

First migration decision:

- Include `creative_skill_duplicate_reviews` in the first migration as an empty admin audit table.
- Do not seed duplicate reviews.
- If owner review wants an even smaller first package, this is the one table that can be deferred without blocking catalog lookup.

Candidate constraints:

- Decision/status checks later after enum strategy review.
- Optional unique open review per `proposed_skill_key` if dynamic catalog editing is introduced later.

Candidate indexes:

- `proposed_skill_key`.
- `proposed_family`.
- `duplicate_risk`.
- `decision`.
- `status`.
- `updated_at`.

Validation checks:

- No seed data inserted.
- Records never become canonical skills without a separate catalog update.
- Similar keys remain auditable.

## N. RLS Readiness Plan

| Table | Contains user/workspace data? | Contains project data? | Contains sensitive/source/proof data? | Read policy recommendation | Write policy recommendation | Admin/service role expectation | Seed/static data expectation | RLS status recommendation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `creative_skill_families` | No. | No. | No. | Authenticated read or public-read after owner decision. | Admin/service only. | Service/admin seed and maintenance. | Deterministic seed likely. | Enable RLS and document policy. | Catalog-only. |
| `creative_skills` | No. | No. | No. | Authenticated read or public-read after owner decision. | Admin/service only. | Service/admin seed and maintenance. | Deterministic seed likely. | Enable RLS and document policy. | No provider/tool secrets. |
| `creative_skill_aliases` | No. | No. | No. | Same catalog read model. | Admin/service only. | Service/admin seed and maintenance. | Reviewed aliases only. | Enable RLS and document policy. | Avoid unreviewed alias drift. |
| `creative_skill_relationships` | No. | No. | No. | Same catalog read model. | Admin/service only. | Service/admin seed and maintenance. | Reviewed relationships only. | Enable RLS and document policy. | Conflicts/alternatives feed planning later. |
| `creative_skill_contract_mappings` | No. | No. | No. | Same catalog read model. | Admin/service only. | Service/admin seed and maintenance. | Required for active seeded skills. | Enable RLS and document policy. | Does not include executable worker specs. |
| `creative_skill_duplicate_reviews` | Possible reviewer/user ids later. | No. | No. | Admin/reviewer read unless owner approves broader audit read. | Admin/reviewer only. | Service/admin maintenance. | No seed data. | Enable RLS and document policy. | Audit table, not catalog seed. |

Recommendation:

- Enable RLS on all six future tables even if most catalog data is static and not user-owned.
- Use authenticated catalog read or public read only after owner decision.
- Use admin/service writes for catalog tables.
- Keep duplicate reviews more restricted than read-only catalog tables.
- Do not write actual RLS policies in this readiness review.

## O. Seed Strategy Readiness

Seed decision:

- The first catalog should likely include deterministic seed data for families, skills, aliases, relationships, and contract mappings.
- Duplicate reviews should not be seed data.

Seed source:

- RP-SKILLS-13 taxonomy contract.
- RP-SKILLS-21 `CreativeSkillFamily` and `CreativeSkillKey` unions.
- RP-SKILLS-22 mock catalog fixtures as examples.
- RP-SKILLS-25 blueprint field decisions.

Seed rules:

- Every seeded `skill_key` must map to `CreativeSkillKey`.
- Every seeded `family_key` must map to `CreativeSkillFamily`.
- Seed aliases only when reviewed and non-conflicting.
- Seed relationships only when they help planning, alternatives, lower-cost choices, or StoryTiming safety.
- Seed contract mappings for every active seeded skill.
- Version seeded rows.
- Do not mutate project/user records.
- Do not insert provider keys, tool secrets, signed URLs, credentials, or runtime payloads.
- Validate seed keys against TypeScript unions later.

## P. Constraint And Index Readiness

Candidate constraints:

- Unique `family_key`.
- Unique `skill_key`.
- Unique normalized `alias`.
- Unique `skill_id` + `planning_contract_type` where appropriate.
- Unique `from_skill_id` + `to_skill_id` + `relationship_type`.
- Lifecycle/status checks later.
- Planning contract type checks later.
- No tool/provider names as skill keys later.
- No null owner docs for active skills.

Candidate indexes:

- `family_key`.
- `skill_key`.
- `skill_family`.
- `lifecycle_status`.
- `planning_contract_type`.
- `alias`.
- relationship from/to fields.
- `updated_at`.
- `version`.

No SQL is written in this review.

## Q. Versioning And Supersession Readiness

Future catalog tables should include:

- `version` on family, skill, and contract mapping rows.
- `lifecycle_status` for active/deprecated/replaced/inactive states.
- alias status and avoid-new-usage behavior.
- relationship lifecycle status.
- duplicate review status.

Deprecated or replaced skills:

- Keep the old skill key for historical project records.
- Use lifecycle status and replacement/alternative relationships instead of destructive changes.
- Future project records should preserve old skill keys and plan snapshots even if the catalog changes.

Supersession strategy:

- This first catalog package can rely on version/lifecycle status rather than full supersession chains.
- Add explicit supersession fields later only if dynamic catalog editing requires them.

## R. Rollback And Migration Safety Notes

Future migration implementation should:

- Be additive only.
- Avoid destructive changes.
- Avoid production data mutation.
- Avoid removing, renaming, or replacing existing signature system tables/types.
- Roll back by dropping only newly created catalog tables if safe in local/dev and before dependent migrations exist.
- Document seed rollback strategy later.
- Split the migration if the reviewed SQL becomes too large.
- Require owner review before SQL is written.
- Avoid production deployment without explicit approval.

## S. Validation Plan For Future Migration

Future migration implementation must validate:

- Migration file exists and follows repo naming convention.
- No unrelated tables are included.
- All six approved catalog tables are present if owner keeps full package scope.
- Required columns are present.
- Unique constraints are present.
- FK references are valid.
- RLS/security expectation is documented.
- No secrets columns exist.
- No project/user data tables are included in the catalog package.
- No execution, job, worker, provider, render, approval runtime, credit ledger, wallet, billing, Stripe, or reservation columns are introduced.
- Seed data keys match TypeScript unions later.
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check` passes.
- `npm run lint` passes.
- Migration dry-run/local validation runs if repo support is explicitly approved later.
- No Supabase production connection occurs unless separately approved.

## T. Readiness Blockers And Warnings

| Item | Blocker/warning/ready | Evidence | Decision | Owner follow-up |
| --- | --- | --- | --- | --- |
| TypeScript contracts | ready | RP-SKILLS-21 core catalog interfaces exist. | Use as field mapping source. | Confirm final enum/check strategy later. |
| Mock fixtures | ready | RP-SKILLS-22 catalog fixtures exist for families, catalog records, aliases, relationships, mappings. | Use as seed guidance only. | Do not auto-insert fixtures without seed review. |
| Docs completeness | ready | RP-SKILLS-13, 20, 23, 24, 25 exist. | Use as source truth. | Keep missing requested docs noted. |
| Existing migration overlap | ready_with_warnings | No Creative Skill catalog tables found; `signature_routes` and `signature_system` exist. | Proceed only with compatibility notes. | Migration owner must inspect migrations again before SQL. |
| RLS decision | warning | Catalog data is mostly static, but exposed schema safety still matters. | Recommend RLS enabled on all six. | Owner must choose public vs authenticated read. |
| Seed strategy | warning | Seed source exists, but exact seed rows are not reviewed here. | Deterministic seed likely appropriate later. | Owner must approve seed scope. |
| Duplicate skill prevention | ready_with_warnings | Diagnostics and duplicate review concepts exist. | Include empty duplicate-review table. | Owner may defer this table if first package must be smaller. |
| Signature system compatibility | warning | `SignatureSystemCatalogRecord`, `signature_system`, and `signature_routes` exist. | Do not replace or duplicate signature owners. | Owner should review compatibility text before SQL. |
| Supabase project boundary | ready | Existing RP-SKILLS docs specify `reeditpro`. | Keep boundary. | Do not use Yuza Studio resources. |
| No SQL/no runtime boundary | ready | This review is docs-only. | No migration or runtime work. | Future prompt must remain migration-only if approved. |
| Known unrelated build failure | warning | RP-SKILLS-23 build failed only on `sound-agent-planner-service.ts`. | Do not run build for this docs-only pass. | Runtime owner handles separately. |

## U. Recommended Future Migration Prompt Scope

If this `ready_with_warnings` decision is accepted, the next migration implementation prompt may be allowed to:

- Create one Supabase migration file for catalog foundation tables only.
- Include only `creative_skill_families`, `creative_skills`, `creative_skill_aliases`, `creative_skill_relationships`, `creative_skill_contract_mappings`, and `creative_skill_duplicate_reviews`.
- Include constraints, indexes, comments, RLS enablement/policies, and deterministic seed data only if explicitly included and reviewed in that prompt.
- Run local/static validation only if repo support is available and approved.
- Update docs/handoff for the migration result.

Forbidden in the future migration prompt unless separately approved:

- Non-catalog tables.
- Edit preference tables.
- Opportunity, concept, candidate, route, specialized plan, StoryTiming, credit, approval, QA, or diagnostics tables.
- Provider/tool tables.
- Jobs/workers.
- Credit ledger, reservations, wallet, billing, or Stripe tables.
- Production Supabase deploy.
- Runtime code.
- UI.
- Provider calls.
- Workers.
- Package changes.
- Secrets.

## V. Example Future Migration Acceptance Criteria

Future migration implementation acceptance criteria should include:

- Exactly the approved catalog foundation tables are created.
- Required columns are present.
- Constraints and indexes match the reviewed scope.
- No extra non-catalog tables are added.
- No secrets, credentials, provider keys, service-role keys, signed URLs, or raw provider payloads are stored.
- RLS plan is documented and implemented only as approved.
- Migration local validation runs if supported and approved.
- No package files change.
- No runtime code is added.
- No provider, worker, UI, render/export, credit runtime, approval runtime, or job behavior changes.
- README/handoff docs are updated.
- Future handoff is updated.

## W. Anti-Patterns

- Readiness review creates SQL.
- Readiness review creates a migration file.
- Readiness review connects to Supabase.
- Catalog migration includes route, planning, project, or user records.
- Catalog migration duplicates signature system tables.
- Skill table stores provider/tool secrets.
- Skill key is named after a provider or tool.
- All fields are hidden in `metadata_json`.
- RLS/security discussion is missing.
- Seed strategy is missing.
- Rollback notes are missing.
- Migration validation plan is missing.
- Unresolved blockers are ignored.

## X. Final Readiness Decision

Decision: `ready_with_warnings`

Why:

- Required RP-SKILLS source docs, type contracts, static fixtures, reconciliation, schema planning, and migration blueprint exist.
- No existing `creative_skill_*` migration tables were found.
- The first package can be narrowed to six catalog foundation tables.
- The future table field decisions are clear enough for a migration-only prompt.
- The main risks are review and compatibility risks, not blockers.

Conditions for next prompt:

- Future SQL must be catalog-only.
- Owner must approve public/authenticated catalog read model.
- Owner must approve admin/service write model.
- Owner must approve deterministic seed scope.
- Future prompt must explicitly preserve `SignatureSystemCatalogRecord`, `signature_system`, and `signature_routes` ownership.
- Future prompt must not connect to production Supabase or deploy.

Recommended next prompt:

`RP-SKILLS-27 - Creative Skill Catalog Supabase Migration Implementation`

If an owner rejects the warnings, use a docs-only repair/decision prompt instead of migration implementation.

## Y. Next Prompt Handoff

Recommended next prompt:

`RP-SKILLS-27 - Creative Skill Catalog Supabase Migration Implementation`

Scope:

Owner-approved migration-only implementation for the catalog foundation package if RP-SKILLS-26 readiness is accepted as `ready_with_warnings`. It should create a single Supabase migration for catalog foundation tables only, with no runtime code, no UI, no workers, no providers, no package changes, no Supabase connection, no production deployment, and no non-catalog tables.

If readiness is later changed to `not_ready_blocked` or `needs_owner_decision`, recommend a docs-only repair/decision prompt instead.
