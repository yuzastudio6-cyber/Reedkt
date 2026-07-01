# RP-SKILLS-25 Creative Skill Supabase Migration Blueprint And RLS Readiness Contract

## A. Purpose

This document defines the docs-only migration blueprint and RLS readiness contract for future ReeditPro Creative Skill tables.

It turns RP-SKILLS-24 schema planning into ordered future migration packages, table-by-table field summaries, RLS/security expectations, foreign-key strategy, rollback/supersession strategy, seed planning, validation planning, and implementation readiness gates.

This is not SQL and not a migration. It does not create migration files, connect to Supabase, run SQL, modify schema, create RLS policies, add seed scripts, change TypeScript contracts, add runtime code, mutate package files, or change app behavior.

Future backend/database work must target the Supabase project named `reeditpro` only. Do not use Yuza Studio Supabase resources.

## B. Migration Blueprint Doctrine

Principle: "Blueprint first, SQL later, execution never from a migration."

The blueprint exists so future migration prompts can make narrow, reviewable table decisions before any SQL is written.

Doctrine:

- A blueprint is a planning artifact, not executable schema.
- Migration packages should be small enough for owner review.
- Routes are planning records, not jobs.
- Credit estimates are not reservations, spends, refunds, or bills.
- Approvals are not generation permission by themselves.
- Provider/tool readiness is metadata, not a provider call.
- StoryTiming coordinates records; it does not render timelines.
- QA records describe planning safety; they do not run runtime QA.
- Diagnostics records, if persisted later, do not replace static checks.
- Secrets, provider keys, service-role keys, signed URLs, and credentials must never live in Creative Skill tables or JSON.

## C. Existing Migration And Schema Overlap Audit

Existing migrations under `supabase/migrations/` already cover several owners that future Creative Skill migrations must reference instead of duplicating:

| Existing owner | Representative migration area | Future Creative Skill boundary |
| --- | --- | --- |
| Core workspace/project/chat/media | Core ReeditPro tables and workspace/project foundations. | Use existing workspace, project, chat, media, and source-sequence identifiers. |
| Intent and edit planning | Intent and edit-plan versions. | Link skill planning to edit plans; do not redefine edit plans. |
| Professional edit quality | Edit-quality engine records. | Reference quality owners; do not fork edit-quality scoring. |
| Credit ledger and approval gate | Credit ledger, approval snapshots, and approval records. | Skill estimates are planning-only and must reconcile with existing credit/approval flow. |
| Job orchestration and agent runs | Jobs, agent runs, leases, runtime transport, E2E readiness. | Skill routes do not create jobs; future jobs reference approved route IDs later. |
| Stroke Motion | Stroke Motion data model. | Treat Stroke Motion as an existing specialized owner. |
| Generation providers and assets | Provider and generated-asset tables. | Store provider readiness only as planning metadata; do not duplicate provider registries. |
| Render, preview, export, revision, QA | Render/export/revision/QA records. | Link to existing preview/export/revision/QA owners. |
| Storage and RLS | Storage buckets, storage policies, RLS policy migrations. | Future Creative Skill tables need RLS planning before real data. |
| SFX Director | SFX tables. | Sound/music planning must reference, not replace, SFX owners. |
| StoryTiming | StoryTiming master tables. | Creative Skill StoryTiming coordination must reconcile with existing StoryTiming tables. |
| Worker leases/runtime transport | Worker runtime tables. | Future worker inputs reference approved records by ID only after approval/credit/job readiness. |

Missing requested files in the current repo snapshot:

- `soundsync-music-intelligence.md` is missing.
- `music-reference-dna.md` is missing.
- `lyria-music-generation-plan.md` is missing.
- `browser-app-capture-planning.md` is missing.
- `browser-capture-settings-catalog.md` is missing.

Existing requested file:

- `audio-library-and-licensing.md` exists.

## D. Source-Of-Truth Mapping

| Source | Owns | Blueprint use |
| --- | --- | --- |
| RP-SKILLS-21 TypeScript contracts | Target type shapes for taxonomy, plans, workflow, QA, and diagnostics. | Field names and lineage clues for future table summaries. |
| RP-SKILLS-22 mock fixtures | Static examples across preferences, opportunities, concepts, routes, plans, credit, QA, and diagnostics. | Walkthrough and seed-readiness examples only; not automatic Supabase seed data. |
| RP-SKILLS-23 reconciliation report | Collision and validation findings. | Confirms type-only contract state and known unrelated build issues. |
| RP-SKILLS-24 schema planning | Future table group doctrine. | Direct predecessor for this migration blueprint. |
| Existing migrations | Current database owners. | Must be inspected before any later SQL prompt. |
| Existing `signature_routes` types and mocks | Signature routing compatibility. | Future `edit_plan_skill_routes` must reconcile rather than fork. |

## E. Migration Phase Overview

| Phase | Migration package area | Purpose | Prerequisite | Not included |
| --- | --- | --- | --- | --- |
| 1 | Creative Skill catalog foundation | Canonical families, skills, aliases, relationships, contract mappings, duplicate reviews. | RP-SKILLS-13 and RP-SKILLS-21 core contracts. | Routes, providers, workers, execution. |
| 2 | Edit preference foundations | Profiles, versions, immutable resolved snapshots, conflict resolutions, revision requests. | Core workspace/project/user records. | Preference runtime or settings UI. |
| 3 | Opportunities and creative concepts | Opportunity runs, opportunities, restraint, questions, concept candidates, selections, rejections, alternatives. | Source context and preference snapshots. | Skill resolver execution or providers. |
| 4 | Candidates, resolver records, routes, and plan assembly | Candidates, score reviews, bundles, route previews, routes, route bundles, attachments, conflicts, summaries. | Catalog, concepts, edit plans. | Jobs, workers, runtime route assembly. |
| 5 | Specialized skill planning records | Universal, transition, overlay, graphic, motion, 3D, B-roll, caption, sound/music records. | Routes and required contract attachments. | Rendering, media processing, generation. |
| 6 | StoryTiming coordination | Windows, density budgets, conflict resolutions, permission gates, timing QA. | Routes and existing StoryTiming owner review. | Timeline execution or render logic. |
| 7 | Skill credit and approval planning | Estimate items, summaries, alternatives, approval groups/copy, revision impacts. | Routes, credit owner review. | Reservations, spends, refunds, billing. |
| 8 | Skill QA and validation planning | Requirements, results, reports, repairs, gate decisions. | Routes, plans, StoryTiming, source safety. | Runtime QA or validation scripts. |
| 9 | Diagnostics metadata, if needed | Rules, results, runs. | RP-SKILLS-20 and future diagnostics need. | CI/static checks unless separately approved. |
| 10 | Revision/audit linkage | Supersession, revision links, audit refs, chat approval refs. | Approved plans and audit owner review. | Destructive history rewrites. |
| 11 | Future job linkage readiness | Nullable job, worker, credit reservation, provider request references. | Approval, credit reservation, job architecture ready. | Job creation from planning records. |
| 12 | Implementation readiness review | Verify table decisions before SQL. | Owner approval. | SQL unless a later prompt explicitly authorizes it. |

## F. Phase 1 Table Blueprint: Creative Skill Catalog Foundation

| Proposed table | Purpose | Proposed key columns | Required fields | Optional fields | Status/version fields | Likely FKs | RLS expectation | Seed/static data expectation | Source TypeScript interface | Source docs | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `creative_skill_families` | Store canonical top-level families. | `id`, `skill_family`. | label, description, default status. | related families, metadata_json. | status, version. | None initially. | Public or workspace-readable catalog; admin-managed writes. | Deterministic catalog seed later. | `CreativeSkillFamilyRecord`. | RP-SKILLS-13, RP-SKILLS-21. | Phase 1 before dependent records. | Provider/tool registry, secrets, project-specific data. |
| `creative_skills` | Store canonical skill keys. | `id`, `skill_key`, `skill_family`. | label, role, lifecycle, route status, contract mapping. | complexity, credit tendency, approval tendency, metadata_json. | lifecycle status, route status, version. | family to `creative_skill_families`. | Catalog readable; reviewed/admin writes. | Seed must align with `CreativeSkillKey`. | `CreativeSkillCatalogRecord`. | RP-SKILLS-13, RP-SKILLS-21. | Must not conflict with `SignatureSystemCatalogRecord`. | Runtime prompt text, provider choice, worker config. |
| `creative_skill_aliases` | Map user language to canonical keys. | `id`, alias, `skill_key`. | source, confidence, status. | language, notes, metadata_json. | status, reviewed_at. | `skill_key` to `creative_skills`. | Readable with catalog; reviewed/admin writes. | Optional deterministic aliases. | `SkillAlias`. | RP-SKILLS-13. | Useful before resolver work. | Allowing aliases to become new unreviewed skills. |
| `creative_skill_relationships` | Store support, conflict, alternative, and related skill links. | `id`, `from_skill_key`, `to_skill_key`. | relationship type, reason, status. | strength, notes. | status, version. | both skill keys to `creative_skills`. | Readable with catalog; reviewed writes. | Static relationship seed later. | `CreativeSkillRelationship`. | RP-SKILLS-13. | Helps resolver and StoryTiming later. | Route-specific conflicts in catalog table. |
| `creative_skill_contract_mappings` | Map skill keys to planning contracts and required records. | `id`, `skill_key`, contract key. | planning contract, required plan record set, runtime readiness metadata. | fallback contract, notes. | status, version. | skill key to `creative_skills`. | Readable; reviewed/admin writes. | Seed with catalog. | `CreativeSkillContractMappingRecord`. | RP-SKILLS-13, RP-SKILLS-21. | Required before real route validation. | Executable worker specs or provider routing. |
| `creative_skill_duplicate_reviews` | Audit duplicate key/family proposals. | `id`, proposed key, proposed family. | similar keys, review decision, reason. | reviewer, source prompt, metadata_json. | review status, created_at. | optional skill key to `creative_skills`. | Reviewer/admin mutation only. | Not seed data. | `SkillDuplicateReview`. | RP-SKILLS-13, RP-SKILLS-20. | Can support diagnostics later. | Silent deletion of rejected duplicate proposals. |

## G. Phase 2 Table Blueprint: Edit Preference Foundations

| Proposed table | Purpose | Proposed key columns | Ownership fields | Version/snapshot fields | Likely FKs | RLS expectation | Immutability expectation | Source TypeScript interface | Source docs | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `edit_preference_profiles` | Store user, workspace, project, brand, and Reference DNA preference sources. | `id`, preference source type. | workspace_id, user_id, project_id. | current version, status. | workspaces, users, projects where available. | User/workspace/project-owned rows. | Mutable source, not approved-plan snapshot. | `EditPreferenceProfile`. | RP-SKILLS-12. | Phase 2 after core ownership review. | Rewriting old plans when defaults change. |
| `edit_preference_profile_versions` | Preserve preference changes over time. | `id`, profile_id, version. | workspace_id, user_id, changed_by. | version, changed_at, change reason. | profile to `edit_preference_profiles`. | Same owner as profile. | Past versions remain auditable. | Derived from RP-SKILLS-12. | RP-SKILLS-12, RP-SKILLS-24. | Useful before snapshots. | Mutating historical versions. |
| `resolved_edit_preference_snapshots` | Attach resolved preference state to an edit plan. | `id`, edit_plan_id. | workspace_id, project_id, created_by. | snapshot version, created_at, superseded_by_id. | edit plans, profiles, profile versions. | Project/edit-plan-owned. | Immutable after plan approval. | `ResolvedEditPreferenceSnapshot`. | RP-SKILLS-12, RP-SKILLS-21. | Direct project instruction priority must be auditable. | Silent preference drift after approval. |
| `edit_preference_conflict_resolutions` | Record priority choices across direct instructions, defaults, briefs, Reference DNA, workflow, and AI judgment. | `id`, snapshot_id, conflict key. | workspace_id, project_id. | resolution status, created_at. | snapshot to `resolved_edit_preference_snapshots`. | Project-owned. | Immutable if tied to approved plan. | `EditPreferenceConflictResolution`. | RP-SKILLS-12. | Helps QA explain preference decisions. | Hiding conflict choices in JSON. |
| `edit_preference_revision_requests` | Track preference-driven revision asks. | `id`, revision_request_id, edit_plan_id. | workspace_id, project_id, user_id. | status, superseded_by_id. | edit plans, route ids later. | Project/user-owned. | Supersede affected records instead of mutating approved plan. | Derived from revision contracts. | RP-SKILLS-12, RP-SKILLS-17. | May belong with revision phase if deferred. | Treating preference revision as automatic execution. |

Important notes:

- Preference snapshots must not change silently after plan approval.
- User/workspace defaults must not rewrite old plans.
- Direct project instruction priority must remain auditable.

## H. Phase 3 Table Blueprint: Visual Opportunities And Creative Concepts

### Visual Opportunity Tables

| Proposed table | Purpose | Proposed key columns | Likely FKs | Source/proof safety fields | Status fields | RLS expectation | Source TypeScript interface | Source docs | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `visual_opportunity_engine_runs` | Group opportunity detection outputs. | `id`, edit_plan_id, run label. | workspace, project, edit plan, preference snapshot. | source context summary, observation confidence. | run status, created_at. | Project-owned. | `VisualOpportunityEngineRun`. | RP-SKILLS-14, RP-SKILLS-21. | Planning metadata only. | Treating run as visual analysis runtime. |
| `visual_opportunities` | Store possible moments before concept ideation. | `id`, run_id, opportunity type, time range. | run, source clip, edit plan. | source status, evidence status, proof caution, redaction needed. | opportunity status, priority band. | Project-owned and source-sensitive. | `VisualOpportunity`. | RP-SKILLS-14. | Make source/proof status queryable. | Treating unknown evidence as verified proof. |
| `visual_opportunity_score_reviews` | Preserve opportunity scoring rationale. | `id`, opportunity_id. | opportunity, reviewer/agent run. | evidence confidence, source caveats. | review status. | Project-owned. | `VisualOpportunityScoreReview`. | RP-SKILLS-14. | Later diagnostics can inspect. | Hiding score reason in metadata only. |
| `restraint_opportunities` | Store no-op or restraint recommendations. | `id`, opportunity_id. | opportunity, edit plan. | source reason if restraint is source-driven. | restraint status. | Project-owned. | `RestraintOpportunity`. | RP-SKILLS-14. | Supports professional restraint audit. | Dropping no-op decisions. |
| `opportunity_user_questions` | Record user questions needed before concept or route decisions. | `id`, opportunity_id. | opportunity, chat message. | source-sensitive question flag. | question status, blocker target. | Project/chat-owned. | `OpportunityUserQuestion`. | RP-SKILLS-14. | Chat-native approval can link here. | Proceeding when blocking answer is missing. |
| `opportunity_duplicate_reviews` | Track duplicate/repeated opportunity decisions. | `id`, primary opportunity id, duplicate opportunity id. | opportunities. | source overlap reason. | review status. | Project-owned. | Derived from RP-SKILLS-14. | RP-SKILLS-14, RP-SKILLS-20. | Useful for visual density control. | Letting repeated opportunities overstuff the plan. |

### Creative Concept Tables

| Proposed table | Purpose | Proposed key columns | Likely FKs | Source/proof safety fields | Status fields | RLS expectation | Source TypeScript interface | Source docs | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `creative_concept_ideation_runs` | Group concept candidates after opportunity detection. | `id`, edit_plan_id, run label. | opportunities, preference snapshot, project. | input source status summary. | run status. | Project-owned. | `CreativeConceptIdeationRun`. | RP-SKILLS-15. | Not a generator runtime. | Provider execution from concept run. |
| `creative_concept_candidates` | Store candidate creative ideas. | `id`, run_id, concept type, concept title. | opportunity, preference snapshot. | claim safety, source status, proof level. | concept status, priority band. | Project-owned. | `CreativeConceptCandidate`. | RP-SKILLS-15. | Concepts precede skills. | Choosing skills before concepts. |
| `creative_concept_selections` | Record selected concept decisions. | `id`, concept_id. | concept, user/agent decision. | source/proof caveat inherited. | selection status. | Project-owned. | `CreativeConceptSelection`. | RP-SKILLS-15. | Selection is not approval. | Treating selection as execution permission. |
| `creative_concept_rejections` | Preserve rejected concept rationale. | `id`, concept_id. | concept, replacement concept optional. | source/proof rejection reason. | rejection status. | Project-owned. | `CreativeConceptRejection`. | RP-SKILLS-15. | Rejected concepts remain auditable. | Deleting rejected concepts silently. |
| `creative_concept_lower_cost_alternatives` | Link premium concepts to lower-cost ideas. | `id`, original_concept_id, alternative_concept_id. | concepts. | source tradeoff if relevant. | alternative status. | Project-owned. | `CreativeConceptLowerCostAlternative`. | RP-SKILLS-15. | Feeds credit planning later. | Hiding lower-cost options from approval. |
| `creative_concept_user_questions` | Store questions before scoring. | `id`, concept_id. | concept, chat message. | source-sensitive flag. | question status. | Project/chat-owned. | `CreativeConceptUserQuestion`. | RP-SKILLS-15. | Can block source-sensitive concepts. | Guessing missing user direction. |
| `creative_concept_score_reviews` | Preserve concept score reviews. | `id`, concept_id. | concept, reviewer/agent run. | source truth score. | review status. | Project-owned. | Derived from RP-SKILLS-15. | RP-SKILLS-15, RP-SKILLS-20. | Useful before resolver work. | Score with no reason or evidence. |

Important notes:

- Opportunities and concepts are planning records.
- They do not create skill routes by themselves.
- They do not execute providers.
- Rejected concepts must remain auditable.

## I. Phase 4 Table Blueprint: Skill Candidates And Resolver Records

| Proposed table | Purpose | Proposed key columns | Likely FKs | Canonical skill key fields | Status fields | Credit/approval hint fields | RLS expectation | Source TypeScript interface | Source docs | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `skill_resolver_runs` | Group scoring outputs for selected concepts. | `id`, edit_plan_id, concept_selection_id. | project, edit plan, concept selection, preference snapshot. | candidate key list. | run status. | credit sensitivity summary. | Project-owned. | `SkillResolverRun`. | RP-SKILLS-16. | Planning metadata only. | Runtime resolver execution. |
| `skill_candidates` | Store scored candidate skills. | `id`, resolver_run_id, concept_id. | resolver run, concept, catalog skill. | `skill_key`, `skill_family`, resolved aliases. | candidate status, recommendation level. | credit tendency, approval tendency, premium flag. | Project-owned. | `SkillCandidate`. | RP-SKILLS-16. | Candidate is not route. | Non-canonical skill keys. |
| `skill_candidate_score_reviews` | Preserve score components and rationale. | `id`, skill_candidate_id. | candidate, reviewer/agent run. | skill key. | review status. | credit/approval score notes. | Project-owned. | `SkillCandidateScoreReview`. | RP-SKILLS-16. | Supports QA/diagnostics. | Score without mapping reason. |
| `skill_candidate_bundles` | Group selected, optional, blocked, and rejected candidates. | `id`, resolver_run_id. | resolver run, edit plan. | selected skill keys, optional keys, blocked keys. | bundle status. | approval-needed count, credit risk. | Project-owned. | `SkillCandidateBundle`. | RP-SKILLS-16. | Feeds route assembly. | Treating bundle as approved plan. |
| `skill_route_decision_previews` | Preview possible route decisions before assembly. | `id`, candidate_id. | candidate, concept. | skill key, contract key. | preview status. | approval preview, credit impact preview. | Project-owned. | `SkillRouteDecisionPreview`. | RP-SKILLS-16. | Not a route table. | Creating jobs from previews. |
| `rejected_skill_candidates` | Audit rejected or blocked candidates. | `id`, skill_candidate_id or skill_key. | candidate optional, concept, edit plan. | skill key, family, alias source. | rejected status, reason. | lower-cost alternative notes. | Project-owned. | `RejectedSkillCandidate`. | RP-SKILLS-02, RP-SKILLS-16. | Keep for revision history. | Silent deletion of blocked candidates. |
| `skill_lower_cost_alternative_decisions` | Record selected vs lower-cost skill decisions. | `id`, original_candidate_id, alternative_candidate_id. | candidates, concept. | original key, alternative key. | decision status. | credit tradeoff, approval tradeoff. | Project-owned. | `SkillLowerCostAlternativeDecision`. | RP-SKILLS-16. | Feeds credit/approval copy. | Hiding premium tradeoffs. |

Important notes:

- Skill candidates are not execution records.
- Blocked and rejected candidates should remain auditable.
- Resolver outputs do not create jobs.

## J. Phase 5 Table Blueprint: Skill Routes And Plan Assembly

| Proposed table | Purpose | Proposed key columns | Likely FKs | Route/time range fields | StoryTiming readiness fields | Approval/credit hint fields | QA/revision fields | RLS expectation | Source TypeScript interface | Source docs | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `edit_plan_skill_routes` | Store planned skill route decisions. | `id`, edit_plan_id, route key. | project, edit plan, candidate, concept. | route type, scope, time range. | readiness, window refs later. | credit impact, approval needed. | QA status, superseded_by_id. | Project/edit-plan-owned. | `EditPlanSkillRoute`. | RP-SKILLS-17. | Reconcile with `signature_routes`. | Treating route as job. |
| `edit_plan_skill_route_bundles` | Group route records for an edit plan. | `id`, edit_plan_id, bundle version. | edit plan, candidate bundle. | bundle scope. | bundle StoryTiming status. | estimate summary refs later. | QA gate status, revision status. | Project-owned. | `EditPlanSkillRouteBundle`. | RP-SKILLS-17. | Active bundle should be queryable. | Hiding optional routes. |
| `skill_planning_contract_attachments` | Attach required contract docs/types to route. | `id`, route_id, contract key. | route, catalog mapping. | route scope inherited. | contract readiness. | approval hint inherited. | missing record count. | Project-owned. | `SkillPlanningContractAttachment`. | RP-SKILLS-17. | Helps completeness checks. | Storing executable prompts. |
| `required_skill_plan_record_sets` | Declare plan records required before approval. | `id`, route_id. | route, contract attachment. | route scope inherited. | StoryTiming required flag. | premium required flag. | missing records, status. | Project-owned. | `RequiredSkillPlanRecordSet`. | RP-SKILLS-17. | Blocks incomplete routes. | Accepting skills without contracts. |
| `lower_cost_alternative_route_links` | Link premium route to lower-cost route. | `id`, route_id, alternative_route_id. | routes, candidates. | affected scope. | StoryTiming impact. | credit delta, approval copy ref. | revision impact. | Project-owned. | `LowerCostAlternativeRouteLink`. | RP-SKILLS-17, RP-SKILLS-18. | Useful for user choice. | Replacing original without audit. |
| `skill_route_conflict_flags` | Store route conflicts. | `id`, route_id, related_route_id. | routes, StoryTiming windows later. | conflict range. | conflict type, readiness impact. | approval blocked flag. | severity, resolution status. | Project-owned. | `SkillRouteConflictFlag`. | RP-SKILLS-17, RP-SKILLS-19. | Queryable before approval. | Letting all skills run at once. |
| `skill_route_QA_requirements` | Attach route-level QA needs. | `id`, route_id. | route, QA category. | affected range. | StoryTiming QA target. | credit/approval QA target. | severity, blocker target. | Project-owned. | `SkillRouteQARequirement`. | RP-SKILLS-17, RP-SKILLS-19. | Later may map to QA table. | Silent unaudited fixes. |
| `skill_route_revision_links` | Preserve route revision lineage. | `id`, original_route_id, revised_route_id. | routes, revision request. | affected scope. | StoryTiming revision impact. | credit revision impact. | supersession reason. | Project-owned. | `SkillRouteRevisionLink`. | RP-SKILLS-17. | Use supersession chains. | Mutating approved route in place. |
| `skill_route_user_visible_summaries` | Store chat-facing route summary copy. | `id`, route_id or bundle_id. | route, bundle, chat message. | summary scope. | conflict summary. | approval/credit summary. | QA summary. | Project/chat-owned. | `SkillRouteUserVisibleSummary`. | RP-SKILLS-17. | Copy is not UI implementation. | Hiding premium behavior. |
| `skill_plan_assembly_runs` | Group plan assembly attempts. | `id`, edit_plan_id, candidate_bundle_id. | edit plan, candidate bundle. | assembly scope. | StoryTiming readiness status. | credit readiness status. | completeness score, QA status. | Project-owned. | `SkillPlanAssemblyRun`. | RP-SKILLS-17. | Static planning metadata. | Runtime route assembly. |

Important notes:

- Routes are planning records, not jobs.
- Routes should trace opportunity -> concept -> candidate -> route where possible.
- Future implementation must reconcile existing `signature_routes` concepts carefully.

## K. Phase 6 Table Blueprint: Specialized Skill Planning Records

| Group | Proposed tables | Purpose | Route linkage | Proposed key columns | Likely FKs | RLS expectation | Source TypeScript interfaces | Source docs | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Universal skill plans | `universal_skill_plans` | Common planning envelope inherited by specialized plans. | route_id required. | id, route_id, planning status, reason, restraint decision. | routes, contract attachments. | Project-owned. | `UniversalSkillPlanRecord`. | RP-SKILLS-02, RP-SKILLS-21. | Required before specialized completion. | Skill-name-only execution. |
| Transition plans | `transition_skill_plans`, `transition_timing_plans`, `transition_composition_plans`, `transition_audio_plans` | Transition family, timing, edge behavior, composition, audio bridge. | route_id and optional StoryTiming window. | id, route_id, plan id, time range, intensity. | universal plan, routes, StoryTiming. | Project-owned. | `TransitionSkillPlan`, `TransitionTimingPlan`, `TransitionCompositionPlan`, `TransitionAudioPlan`. | RP-SKILLS-03. | May split timing/audio later. | Random effects table. |
| Overlay/compositing plans | `overlay_compositing_skill_plans`, `overlay_timing_plans`, `overlay_composition_plans` | Overlay role, screen zone, safe area, blend, layer order, occlusion. | route_id required. | id, route_id, overlay role, zone, collision state. | universal plan, routes, source refs. | Project-owned and source-sensitive. | `OverlayCompositingSkillPlan`, `OverlayTimingPlan`, `OverlayCompositionPlan`. | RP-SKILLS-04. | Source/proof fields must be structured. | Evidence overlays without source status. |
| Graphic design plans | `graphic_design_skill_plans`, `graphic_design_timing_plans`, `graphic_design_structure_plans` | VisualExplain hierarchy, layout, typography, proof safety. | route_id required. | id, route_id, hierarchy, layout family, density. | universal plan, routes, source refs. | Project-owned. | `GraphicDesignSkillPlan`, `GraphicDesignTimingPlan`, `GraphicDesignStructurePlan`. | RP-SKILLS-05. | Reconcile provider prompt owners. | Hiding claim safety in JSON. |
| Motion design plans | `motion_design_skill_plans`, `motion_timing_plans`, `motion_behavior_plans`, `motion_composition_plans` | Motion role, energy, easing, behavior, safe-zone relationship. | route_id required. | id, route_id, subject, energy, timing anchor. | universal plan, routes, StoryTiming. | Project-owned. | `MotionDesignSkillPlan`, `MotionTimingPlan`, `MotionBehaviorPlan`, `MotionCompositionPlan`. | RP-SKILLS-06. | Accessibility/comfort fields visible. | Motion everywhere by default. |
| 3D visual plans | `three_d_visual_skill_plans`, `three_d_visual_timing_plans`, `three_d_spatial_composition_plans`, `three_d_motion_behavior_plans` | 3D role, object/concept, camera, scale, material, tracking/occlusion. | route_id required. | id, route_id, role, object type, impact level. | universal plan, routes, source/model refs. | Project-owned, approval-sensitive. | `ThreeDVisualSkillPlan`, `ThreeDVisualTimingPlan`, `ThreeDSpatialCompositionPlan`, `ThreeDMotionBehaviorPlan`. | RP-SKILLS-07. | Premium approval and lower-cost routes required when needed. | Model loading or WebGL runtime. |
| B-roll plans | `b_roll_skill_plans`, `b_roll_timing_plans`, `b_roll_source_selection_plans`, `b_roll_composition_plans`, `b_roll_audio_relationship_plans` | B-roll role, source status, proof/context level, display mode, audio relationship. | route_id required. | id, route_id, source type, display mode, proof level. | universal plan, routes, source sequence. | Project-owned and source-sensitive. | `BRollSkillPlan`, `BRollTimingPlan`, `BRollSourceSelectionPlan`, `BRollCompositionPlan`, `BRollAudioRelationshipPlan`. | RP-SKILLS-08. | Rights/provenance queryable. | Stock/search/generation integration. |
| Caption plans | `caption_skill_plans`, `caption_timing_plans`, `caption_text_plans`, `caption_placement_plans` | Meaning, accuracy, readability, placement, animation/emphasis. | route_id required. | id, route_id, source accuracy, text policy, placement. | universal plan, routes, transcript refs later. | Project-owned. | `CaptionSkillPlan`, `CaptionTimingPlan`, `CaptionTextPlan`, `CaptionPlacementPlan`. | RP-SKILLS-09. | Reconcile transcript/caption owners. | ASR, translation, or rendering runtime. |
| Sound/music/SFX plans | `sound_music_skill_plans`, `music_cue_plans`, `sound_timing_plans`, `ducking_speech_safety_plans`, `sfx_plans`, `ambience_room_tone_plans` | Sound role, music source/rights, cue points, ducking, SFX, ambience. | route_id required. | id, route_id, sound role, rights status, speech safety. | universal plan, routes, StoryTiming/SFX owners. | Project-owned and rights-sensitive. | `SoundMusicSkillPlan`, `MusicCuePlan`, `SoundTimingPlan`, `DuckingSpeechSafetyPlan`, `SFXPlan`, `AmbienceRoomTonePlan`. | RP-SKILLS-10. | Rights and ducking fields must be visible. | Audio generation, mixing, provider calls. |

Important notes:

- These should not all necessarily be created in one migration.
- Future implementer may normalize or merge some tables if justified.
- Required fields must not be hidden in JSON.
- Generated/provider fields remain planning-only.

## L. Phase 7 Table Blueprint: StoryTiming Coordination

| Proposed table | Purpose | Proposed key columns | Likely FKs | Conflict/permission fields | RLS expectation | Source TypeScript interface | Source docs | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `storytiming_coordination_plans` | Coordinate focus, density, and skill relationships. | `id`, edit_plan_id, route_bundle_id. | edit plan, route bundle, existing StoryTiming owner. | primary focus, density status, conflict status. | Project-owned. | `StoryTimingCoordinationPlan`. | RP-SKILLS-11, existing StoryTiming docs. | Reconcile existing StoryTiming tables first. | Timeline execution. |
| `storytiming_windows` | Store timing windows for coordinated skill plans. | `id`, coordination_plan_id, time range. | coordination plan, route ids. | primary focus, support roles, safe zones. | Project-owned. | `StoryTimingWindow`. | RP-SKILLS-11. | Useful for route -> window links. | Render timeline data. |
| `storytiming_conflict_resolution_plans` | Record conflict types and resolution actions. | `id`, coordination_plan_id, conflict key. | coordination plan, route conflict flags. | conflict type, resolution action, status. | Project-owned. | `StoryTimingConflictResolutionPlan`. | RP-SKILLS-11. | Blockers should be queryable. | Silent conflict suppression. |
| `storytiming_density_budget_plans` | Store visual/audio density budgets. | `id`, coordination_plan_id or window_id. | coordination plan, windows. | visual density, audio density, budget status. | Project-owned. | `StoryTimingDensityBudgetPlan`. | RP-SKILLS-11. | Prevent all-skills-at-once plans. | Density only in prose notes. |
| `storytiming_permission_gates` | Track timing-level permissions for transitions, SFX, music, 3D, and other layered moments. | `id`, window_id, route_id. | windows, routes, approval groups later. | permission type, gate status, blocking reason. | Project-owned. | Derived from RP-SKILLS-11. | RP-SKILLS-11, RP-SKILLS-18. | Connect later to approval planning. | Treating permission as generation. |
| `storytiming_QA_requirements` | Attach StoryTiming-specific QA needs. | `id`, window_id, route_id. | windows, routes, QA categories. | blocker category, severity, status. | Project-owned. | Derived from StoryTiming and QA contracts. | RP-SKILLS-11, RP-SKILLS-19. | Later maps to QA tables. | Non-queryable timing blockers. |

Important notes:

- StoryTiming coordinates records; it does not execute edits.
- StoryTiming blockers should be queryable before approval, preview, or future execution.

## M. Phase 8 Table Blueprint: Skill Credit And Approval Planning

| Proposed table | Purpose | Proposed key columns | Likely FKs | Relationship to existing credit_estimates / approval_records | RLS expectation | Source TypeScript interface | Source docs | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `skill_credit_estimate_items` | Represent route-linked credit estimate items. | `id`, route_id, estimate category. | route, edit plan, existing credit estimate optional. | Planning item only; can map to existing credit estimate later. | Project/financial-sensitive. | `SkillCreditEstimateItem`. | RP-SKILLS-18. | Reconcile with existing credit tables. | Reservation, spend, refund, bill. |
| `skill_credit_estimate_summaries` | Summarize route-bundle credit planning. | `id`, route_bundle_id. | route bundle, edit plan. | Can support existing credit estimate display. | Project/financial-sensitive. | `SkillCreditEstimateSummary`. | RP-SKILLS-18. | Summary is not ledger state. | Treating estimate as wallet balance. |
| `skill_credit_lower_cost_alternatives` | Store lower-cost credit alternatives. | `id`, estimate_item_id, alternative route id. | estimate item, route link. | Feeds approval copy and user choice. | Project/financial-sensitive. | `SkillCreditLowerCostAlternative`. | RP-SKILLS-18. | Must not silently replace premium item. | Hiding cheaper alternatives. |
| `skill_approval_groups` | Group items needing user approval. | `id`, edit_plan_id, approval scope. | routes, estimate summaries, existing approval records later. | Planning approval group; future bridge to approval_records. | Project/approval-sensitive. | `SkillApprovalGroup`. | RP-SKILLS-18. | Approval group is not generation permission. | Approval as provider trigger. |
| `skill_approval_copy` | Store user-visible approval explanation. | `id`, approval_group_id. | approval group, chat message. | Explains premium/source-sensitive items. | Project/chat-owned. | `SkillApprovalCopy`. | RP-SKILLS-18. | Copy must disclose credit/premium behavior. | Opaque premium approval. |
| `skill_revision_credit_impacts` | Preserve revision credit impact notes. | `id`, revision_request_id, route_id. | revision, route, estimate item. | Links changes to estimate effects. | Project/financial-sensitive. | `SkillRevisionCreditImpact`. | RP-SKILLS-18. | Supersede estimates when needed. | Rewriting prior estimate without audit. |

Important notes:

- These tables should reconcile with existing credit/approval architecture.
- They do not reserve, spend, deduct, refund, or bill.
- Future reservation/spend remains in credit ledger flow.

## N. Phase 9 Table Blueprint: Skill QA And Validation

| Proposed table | Purpose | Proposed key columns | Likely FKs | Blocker/warning fields | RLS expectation | Source TypeScript interface | Source docs | Relationship to existing edit_quality / QA records | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `skill_QA_requirements` | Store required QA checks for routes/plans. | `id`, route_id or plan_id. | routes, plans, StoryTiming windows. | QA category, severity, blocking target. | Project-owned. | `SkillQARequirement`. | RP-SKILLS-19. | Reconcile with edit_quality and existing QA. | Add after route/plans. | Missing required QA categories. |
| `skill_QA_results` | Store QA outcomes. | `id`, QA requirement id. | requirement, report, route. | status, severity, issue summary. | Project-owned. | `SkillQAResult`. | RP-SKILLS-19. | Planning QA result only. | Runtime QA execution. | Silent unaudited fix. |
| `skill_QA_reports` | Group QA results for a plan/bundle. | `id`, edit_plan_id, route_bundle_id. | edit plan, route bundle, results. | overall status, blocker count. | Project-owned. | `SkillQAReport`. | RP-SKILLS-19. | Can complement existing QA surfaces. | Add after QA requirements. | Marking plan safe with unresolved blockers. |
| `skill_QA_repair_recommendations` | Recommend planning repairs. | `id`, QA result id. | QA result, route/plan. | repair status, blocked target. | Project-owned. | `SkillQARepairRecommendation`. | RP-SKILLS-19. | Planning repair only. | No automatic runtime repair. | Hidden repairs. |
| `skill_QA_gate_decisions` | Record gate pass/warn/block decisions. | `id`, QA report id. | QA report, approval group optional. | gate status, blocker reason. | Project-owned. | Derived from RP-SKILLS-19. | RP-SKILLS-19, RP-SKILLS-20. | Useful before approval/preview. | Allowing generation before approval. |

## O. Phase 10 Table Blueprint: Diagnostics Metadata, If Needed

Diagnostics may not need database tables at first. Static docs/CI diagnostics may be enough initially. Add these only if the project needs persisted diagnostic runs.

| Proposed table | Purpose | Proposed key columns | Likely FKs | RLS expectation | Source TypeScript interface | Migration notes | Anti-patterns |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `skill_diagnostic_rules` | Persist diagnostic rule metadata if needed. | `id`, rule key, category, level. | optional catalog or docs owner refs. | Admin/read-only for most users. | `SkillDiagnosticRule`. | Defer until diagnostics persistence is needed. | Replacing docs/static checks prematurely. |
| `skill_diagnostic_results` | Persist diagnostic findings if needed. | `id`, rule_id, target path or record id. | rule, diagnostic run. | Admin/project-owned depending on target. | `SkillDiagnosticResult`. | Must avoid storing secrets or raw files. | Treating diagnostic as runtime gate. |
| `skill_diagnostic_runs` | Group diagnostic results. | `id`, run status, target scope. | optional project/agent run. | Admin/project-owned depending on scope. | `SkillDiagnosticRun`. | Defer unless CI/static results need persistence. | Creating DB tables for every static check. |

## P. Phase 11 And 12 Blueprint: Revision, Audit, And Future Job Linkage

Future considerations:

- Route revisions should use revision links and `superseded_by_id` rather than in-place mutation.
- Supersession chains must stay queryable.
- Audit events should link user, agent, system, chat, and approval actions.
- Chat approval messages should be linkable from plans, approval groups, and revisions.
- Future job references should remain nullable until approval, credit, and job orchestration are ready.
- Worker inputs should reference approved planning records by ID.
- Credit reservation references should be added only after existing ledger flow is reconciled.
- Provider generation request references should be IDs from provider/generation owners, not raw provider payloads.

Jobs/workers should reference approved records by ID. Planning records should not create jobs. Job linkage should come only after approval/credit/job architecture is ready.

## Q. RLS And Security Readiness Matrix

| Table group | Contains user/workspace data? | Contains source/proof-sensitive data? | Contains financial/credit data? | Suggested RLS owner keys | Read policy expectation | Write policy expectation | Admin/service role expectation | Special cautions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Catalog | Mostly no. | No. | No. | catalog/admin owner if needed. | Broad read may be acceptable later. | Reviewed/admin writes. | Service/admin for seed. | Do not store providers, tools, or secrets. |
| Preferences | Yes. | Sometimes Reference DNA/source notes. | Credit sensitivity only. | workspace_id, user_id, project_id. | Owner/workspace/project read. | Owner or authorized workspace writes. | Audit-only privileged access. | Snapshots immutable after approval. |
| Opportunities | Yes. | Yes. | No. | workspace_id, project_id, edit_plan_id. | Project collaborators only. | Planner/user authorized writes. | Service role only for trusted backend later. | Unknown evidence stays unknown. |
| Concepts | Yes. | Yes. | Credit tendency only. | workspace_id, project_id, edit_plan_id. | Project collaborators only. | Planner/user authorized writes. | Audit-safe backend only. | Selection is not approval. |
| Candidates | Yes. | Indirectly. | Approval/credit hints. | workspace_id, project_id, edit_plan_id. | Project collaborators only. | Planner authorized writes. | Audit-safe backend only. | Candidate is not execution. |
| Routes | Yes. | Yes when source-linked. | Credit/approval hints. | workspace_id, project_id, edit_plan_id. | Project collaborators only. | Planner/user revision writes. | Backend after approval later. | Routes are not jobs. |
| Specialized plans | Yes. | Often. | Often. | workspace_id, project_id, route_id. | Project collaborators only. | Planner/user revision writes. | Backend after approval later. | Required fields not hidden in JSON. |
| StoryTiming | Yes. | Indirectly. | Sometimes approval gates. | workspace_id, project_id, edit_plan_id. | Project collaborators only. | Planner authorized writes. | Backend after approval later. | Blocks must be queryable. |
| Credit/approval planning | Yes. | Sometimes. | Yes. | workspace_id, project_id, edit_plan_id. | Project collaborators with financial access model. | Authorized planner/user approval flow only. | Existing credit/approval owners. | Estimate is not reservation or spend. |
| QA | Yes. | Yes. | Sometimes. | workspace_id, project_id, edit_plan_id. | Project collaborators only. | Planner/QA owner writes. | Backend QA only later. | QA result is not runtime execution. |
| Diagnostics | Maybe. | Maybe. | No. | project_id or admin scope. | Admin/project depending target. | Static/diagnostics owner later. | CI/service if approved later. | Persist only if needed. |
| Revision/audit | Yes. | Yes. | Yes if credit-linked. | workspace_id, project_id, edit_plan_id. | Project collaborators and audit roles. | Append/supersede only. | Existing audit owners. | Avoid destructive history changes. |
| Future job linkage | Yes. | Yes. | Yes if reservation-linked. | workspace_id, project_id, job_id. | Existing job access model. | Jobs owner after approval only. | Job worker/service roles. | Planning records do not create jobs. |

## R. Foreign Key Strategy

Future FK planning should follow these rules:

- Use `workspace_id`, `project_id`, and `edit_plan_id` on project-scoped records.
- Preserve route lineage: opportunity -> concept -> candidate -> route -> specialized plan.
- Link route -> StoryTiming window where timing coordination applies.
- Link route -> credit estimate item for estimate planning.
- Link estimate item -> approval group for approval copy and user decision.
- Link route -> QA requirement for gate readiness.
- Link route -> revision link for supersession.
- Use optional nullable FKs for records created later in the planning lifecycle.
- Avoid circular hard dependencies where records are created in phases.
- Use `superseded_by_id` for revisions.
- Use `source_chat_message_id` or `created_from_chat_message_id` where chat-native approval matters.

## S. Status And Enum Readiness

Status fields needing later alignment:

- planning status.
- route status.
- candidate status.
- opportunity status.
- concept status.
- approval status.
- QA status.
- diagnostic status.
- source safety status.
- StoryTiming readiness.
- runtime readiness.

Use check constraints or database enums later only after TypeScript unions stabilize. Avoid hardcoding too early while docs/types are still evolving. Future migrations should reconcile TypeScript unions with DB status constraints.

## T. JSON Strategy

Required fields should be structured columns when they affect query, RLS, approval, QA, credit, or future job readiness.

JSON may be useful for flexible notes, future optional diagnostic details, tool boundary notes, provider readiness notes, and non-critical metadata.

Do not hide these in JSON:

- route reason.
- approval status.
- source status.
- QA status.
- credit impact.
- source/proof safety.
- StoryTiming readiness.
- required plan record status.

Do not store these in JSON:

- secrets.
- service-role keys.
- provider keys.
- signed URLs.
- raw provider payloads.
- credentials.

## U. Data Retention, Immutability, And Supersession

Future retention rules:

- Approved plan records should be immutable or superseded.
- Resolved preference snapshots should remain immutable.
- Rejected candidates and rejected concepts should remain for audit and revision.
- Removed premium items should remain auditable.
- Source-sensitive fields may need a retention policy later.
- Soft delete is preferred for audit-critical records.
- Hard delete should be reserved for explicit privacy/data deletion workflows later.
- Supersession chains must be queryable.

## V. Rollback And Migration Safety Strategy

Future migrations should:

- Be small and reversible where possible.
- Start with catalog and preference foundations before dependent planning records.
- Avoid destructive migrations.
- Avoid early table renames.
- Prefer additive migrations.
- Include rollback notes in future migration docs.
- Include validation queries later, but not in this prompt.
- Never run a production migration without owner review.

## W. Seed Strategy

Future seed planning:

- Canonical skill catalog may need seed data later.
- Seed data should be deterministic.
- Seed data should avoid provider/tool execution.
- Seed data should not include secrets.
- Seed data should align with `CreativeSkillKey` unions.
- Seed data should be versioned.
- Seed data should not mutate user project records.
- Seed data may be admin-managed later.
- RP-SKILLS-22 fixtures can guide checks, but should not be inserted automatically.

## X. Migration Validation Plan

Future validation checks should confirm:

- Table exists.
- Required columns exist.
- FK relationships are valid.
- Indexes exist for common queries.
- RLS is enabled where needed.
- No secrets columns exist.
- Status constraints align with TypeScript contracts.
- Catalog seed keys match the TypeScript union.
- Route lineage works.
- Approval/credit link fields are nullable but available.
- QA blockers are queryable.
- Source/proof safety is queryable.
- StoryTiming conflicts are queryable.
- Rollback/supersession fields are present.

Do not write actual SQL in this prompt.

## Y. Query And Index Readiness Plan

Future query patterns and likely index needs:

- Fetch skill routes by `edit_plan_id`.
- Fetch active route bundle by `edit_plan_id`.
- Fetch premium approval-required items.
- Fetch QA blockers by `edit_plan_id`.
- Fetch source-sensitive routes.
- Fetch StoryTiming windows by time range.
- Fetch route lineage from route to concept/opportunity.
- Fetch lower-cost alternatives.
- Fetch current preference snapshot.
- Fetch current active catalog skill.
- Fetch revisions and supersession history.
- Fetch diagnostics status.

Index planning should wait for actual table design, but these access paths should be reviewed before SQL.

## Z. Migration Blueprint QA

The RP-SKILLS-25 blueprint is complete only if:

- No SQL is included.
- No migrations are created.
- No Supabase connection is made.
- Every proposed table group has a purpose.
- Every table group has RLS notes.
- Every table group has source type/docs.
- Existing owners are reconciled.
- Credit/approval/reservation boundaries are respected.
- Job/runtime boundaries are respected.
- Provider/secret boundaries are respected.
- Source/proof safety is included.
- StoryTiming is included.
- QA and diagnostics are included.
- Future phase sequencing is clear.

## AA. Example Future Migration Packages

| Package | Included tables | Prerequisite packages | Owner review needed | Validation needed | What not to include |
| --- | --- | --- | --- | --- | --- |
| Package A | Catalog, alias, relationship, contract mapping, duplicate review tables. | None beyond RP-SKILLS-21/23/24 review. | Taxonomy and database owners. | Catalog keys match TypeScript union. | Routes, providers, jobs, seeds with secrets. |
| Package B | Edit preference profile, version, snapshot, conflict tables. | Core user/workspace/project tables. | Preference and database owners. | Snapshot immutability and RLS ownership. | Settings UI or preference runtime. |
| Package C | Opportunity and concept tables. | Packages A and B where required. | Planning/source-safety owners. | Source/proof safety queryability. | Provider calls or visual analysis runtime. |
| Package D | Candidate and route assembly tables. | Packages A and C. | Planning, `signature_routes`, StoryTiming owners. | Lineage and route completeness. | Jobs, workers, route runtime. |
| Package E | Specialized plan tables, possibly split by family. | Package D. | Skill-family owners. | Required plan record coverage. | Render/export, generation, media processing. |
| Package F | StoryTiming coordination tables. | Package D and existing StoryTiming review. | StoryTiming owner. | Conflict blockers queryable. | Timeline execution. |
| Package G | Credit/approval skill planning tables. | Packages D and existing credit/approval review. | Credit, approval, billing owners. | Estimates are not reservations. | Ledger, wallet, Stripe, billing runtime. |
| Package H | QA tables. | Packages D, E, F, G as applicable. | QA/edit-quality owners. | Blockers and repairs queryable. | Runtime QA scripts. |
| Package I | Diagnostics metadata tables, only if needed. | RP-SKILLS-20 diagnostics readiness. | Diagnostics/CI/database owners. | Rule/result/run access model. | CI/static implementation. |

## AB. Table Lineage Walkthroughs

1. Caption route:
   `visual_opportunity` -> `creative_concept_candidate` -> `skill_candidate` -> `edit_plan_skill_route` -> `caption_skill_plan` -> `caption_timing_plans` / `caption_text_plans` / `caption_placement_plans` -> `skill_credit_estimate_item` -> `skill_QA_requirement`.
   RLS is project-owned. Approval depends on credit/premium status. QA checks readability, meaning, safe placement, and no execution yet.

2. Optional 3D real estate blueprint:
   opportunity -> concept -> optional premium 3D candidate -> route -> 3D plan records -> StoryTiming window -> credit item -> approval group -> lower-cost graphic alternative.
   RLS is project-owned and approval-sensitive. Credit estimate is not reservation. QA checks premium approval, lower-cost alternative, source/model provenance, and no WebGL/model runtime.

3. Product demo screen annotation:
   source-sensitive opportunity -> concept -> graphic/browser annotation route -> source safety fields -> QA blocker if source unknown.
   RLS is source-sensitive. Approval copy should disclose uncertain source. QA blocks invented UI or unverified dashboard details.

4. Education VisualExplain:
   teaching opportunity -> framework concept -> graphic, motion, and caption routes -> StoryTiming density budget -> QA.
   RLS is project-owned. Credit may stay low if no premium generation. QA checks density, readability, speech safety, and no runtime rendering.

5. Marketing proof card:
   proof claim opportunity -> concept -> graphic proof route -> source confirmation -> approval/QA.
   Source/proof status is mandatory. RLS should restrict source-sensitive details. QA blocks invented metrics, prices, names, and evidence pages.

6. SoundSync cue:
   music cue route -> music cue plan -> ducking plan -> caption/speech safety QA.
   Rights/provenance and speech safety are queryable. Approval may be needed for premium/generated music later. No audio generation or mixing happens here.

7. StoryTiming conflict:
   3D/caption collision -> conflict flag -> resolution plan -> route update/supersession.
   RLS is project-owned. QA blocks unresolved collision. Supersession keeps the old approved/planned record auditable.

8. Revision lowering cost:
   premium 3D route -> lower-cost alternative route -> revision credit impact -> superseded estimate/approval group.
   Financial data follows existing credit owners. Approval copy explains the tradeoff. No refund/spend/reservation occurs in planning tables.

## AC. Anti-Patterns

- Writing SQL in the blueprint.
- Creating migration files from this prompt.
- Connecting to Supabase.
- Naming a table after a provider or tool.
- Using a planning route table as a job table.
- Treating an estimate item as credit reservation.
- Treating approval status as generation permission.
- Storing secrets in a table or JSON.
- Omitting source/proof fields.
- Skipping RLS planning.
- Creating one giant table for everything.
- Hiding all specialized skill data in `metadata_json`.
- Duplicating existing credit/approval tables.
- Ignoring existing `signature_routes`.
- Deleting approved records instead of superseding.
- Adding diagnostics tables before a diagnostics persistence need exists.
- Making a migration package too broad to review safely.

## AD. Future Implementation Notes

RP-SKILLS-25 does not create migrations.

Future RP-SKILLS-26 should be a verification/reconciliation pass or first migration package readiness review only if owner-approved. Future migration work should start with catalog tables only unless scope is expanded. Future SQL must be reviewed against this blueprint, RP-SKILLS-21 type contracts, RP-SKILLS-22 fixtures, RP-SKILLS-23 reconciliation, RP-SKILLS-24 schema planning, and existing migrations.

Future SQL must include no secrets. Future migrations must be local/schema-only until explicitly approved.

## AE. Relationship To Type Contracts And Fixtures

- RP-SKILLS-21 type contracts define target shapes.
- RP-SKILLS-22 fixtures prove example lineage.
- Schema may normalize records differently but must preserve lineage.
- Any divergence must be documented in a future migration prompt.
- Mock fixtures can guide future seed/fixture checks, but should not be inserted into Supabase automatically.

## AF. Relationship To Existing Migration System

Future migration prompts must inspect `supabase/migrations/`.

Do not duplicate:

- Stroke Motion tables.
- Provider or generated asset tables.
- Credit, approval, reservation, wallet, ledger, Stripe, or billing tables.
- Jobs, worker leases, runtime transport, or agent run tables.
- Media, source sequence, upload, storage, render, preview, export, revision, or QA tables.
- StoryTiming and SFX tables.

If migrations are absent or incomplete, the future prompt must document that finding. Supabase target remains `reeditpro`; do not use Yuza Studio Supabase.

## AG. Next Prompt Handoff

Recommended next prompt:

`RP-SKILLS-26 - Creative Skill Catalog Migration Readiness Review`

Scope:

Docs-only readiness review for the first future migration package. It should verify whether Creative Skill catalog foundation tables are ready for a real migration, compare proposed catalog tables against existing migrations/types/docs, identify exact table/field decisions, RLS policy expectations, seed strategy, rollback notes, and validation checks.

Forbidden unless separately approved later:

- SQL.
- Migration files.
- Supabase connection.
- Runtime behavior.
- UI.
- Provider calls.
- Workers.
- Package changes.
- Schema/runtime behavior.
