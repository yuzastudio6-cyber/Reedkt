# RP-SKILLS-24 Creative Skill Schema Planning Contract

## A. Purpose

This document defines the future database and Supabase schema planning contract for the ReeditPro Creative Skill System.

This is documentation only. It does not create migrations, write SQL, connect to Supabase, modify database schema, add RLS policies, add seed data, create TypeScript contracts, create runtime code, or change app behavior.

It maps RP-SKILLS docs, RP-SKILLS-21 TypeScript contracts, RP-SKILLS-22 static mock fixtures, and RP-SKILLS-23 reconciliation findings to future table groups. It prepares future migration work, but does not implement it.

Future backend/database work must target the Supabase project named `reeditpro` only. Do not use Yuza Studio Supabase resources.

## B. Schema Planning Doctrine

Schema planning is not a migration.

Schema planning defines which future tables may need to exist, how they relate, what security boundaries matter, which records must be auditable, which records are planning-only, and what must be approval-gated before future execution.

Core doctrine:

- Planning records are not execution records.
- Skill routes are not jobs.
- Credit estimates are not credit reservations.
- Approvals are not generation.
- Provider/tool readiness is metadata, not execution.
- Source/proof safety must be queryable and auditable.
- StoryTiming conflicts must be auditable.
- QA blockers must be visible before preview or future execution.
- Every premium or generation-heavy route must connect to approval and credit gates later.
- Secrets must never be stored in Creative Skill tables.

Principle: "Future schema must make the safe path easy and the unsafe path hard."

## C. Schema Source-Of-Truth Mapping

| Source | Owns | This contract does not replace |
| --- | --- | --- |
| RP-SKILLS docs | Doctrine, planning contracts, taxonomy, route, QA, diagnostics, schema planning sequence. | Existing product, edit, credit, job, provider, StoryTiming, or Supabase owners. |
| RP-SKILLS TypeScript contracts | Field-shape source for Creative Skill planning records. | Database migrations, SQL, RLS, runtime services, or storage decisions. |
| RP-SKILLS mock records | Static lineage examples across preferences, opportunities, concepts, routes, plans, credit, QA, and diagnostics. | Real records, generated assets, provider outputs, jobs, or user data. |
| `database-architecture.md` | Backend/database architecture and table families. | Creative Skill-specific schema sequencing details. |
| `ai-editor-data-model.md` | Chat-native editing and edit-plan data model. | Skill-specific route and planning table groups. |
| `type-contracts.md` | Type contract index and contract ownership notes. | SQL implementation. |
| Existing planning/signature/edit-quality/audio/credits/jobs/generation types | Domain-specific contracts that Creative Skills must reference. | Creative Skill schema ownership. |
| `supabase/migrations/` | Existing local migration artifacts for core ReeditPro data. | RP-SKILLS-24, because this prompt creates no migration. |

Existing migrations already cover core workspace/project/chat/media, intent/edit planning, professional edit quality, credit/approval, jobs, Stroke Motion, generation providers/assets, render/export/revision/QA, storage, SFX Director, StoryTiming, worker leases, and E2E readiness. Future Creative Skill schema work must reconcile with those before adding any table.

## D. Future Table Group Overview

| Group | Purpose | Likely records | Primary dependencies | Must not do | Phase |
| --- | --- | --- | --- | --- | --- |
| Creative skill taxonomy | Store canonical skill vocabulary. | Families, skills, aliases, relationships, contract mappings. | RP-SKILLS-13 and `creative-skills-core.ts`. | Act as provider registry or runtime resolver. | 1 |
| Edit preference | Preserve preference sources and immutable resolved snapshots. | Profiles, versions, snapshots, conflict resolutions. | Users, workspaces, projects, edit plans. | Rewrite approved plans when defaults change. | 2 |
| Visual opportunity | Store possible moments before concepts or skill selection. | Runs, opportunities, score reviews, restraint opportunities, questions. | Source context, project, edit plan. | Select skills, call tools, or execute analysis. | 3 |
| Creative concept | Store candidate creative ideas after opportunities. | Ideation runs, candidates, selections, rejections, lower-cost alternatives. | Opportunities, preferences, source safety. | Approve execution. | 3 |
| Skill candidate/resolver | Score skill candidates for concepts. | Candidates, bundles, score reviews, rejections, route previews. | Concepts, taxonomy, preferences. | Assemble routes or start jobs. | 4 |
| Skill route/plan assembly | Convert selected candidates into planning routes. | Routes, bundles, attachments, record sets, conflicts, summaries. | Candidates, edit plans, StoryTiming, credit/QA. | Act as job queue. | 4 |
| Specialized skill planning | Store universal and specialized planning records. | Transition, overlay, graphic, motion, 3D, B-roll, caption, sound/music. | Routes and universal plan envelope. | Hide required planning fields in generic JSON. | 5 |
| StoryTiming coordination | Coordinate focus, density, windows, permissions, and conflicts. | Windows, coordination plans, conflict resolutions, density budgets. | Existing StoryTiming owner and skill routes. | Execute timeline/render logic. | 6 |
| Skill credit/approval planning | Link skill routes to future estimate and approval gates. | Estimate items, summaries, lower-cost alternatives, approval groups/copy. | Existing credits and approval records. | Reserve, spend, refund, or bill. | 7 |
| Skill QA/validation | Store planning QA requirements, results, reports, and repairs. | Requirements, results, reports, repairs, gate decisions. | Routes, plan records, StoryTiming, source safety. | Run runtime QA. | 8 |
| Skill diagnostics | Store future diagnostics metadata if database persistence is needed. | Rules, results, runs. | RP-SKILLS-20 diagnostics. | Replace CI/static checks. | 9 |
| Source/proof safety | Make evidence, rights, and redaction state queryable. | Shared fields or source safety records. | Media, source sequence, Reference DNA. | Treat unknown source as verified proof. | 3 to 8 |
| Revision linkage | Preserve supersession and revision intent. | Revision links, revision credit impacts. | Routes, plans, approval, QA. | Delete approved history silently. | 10 |
| Audit/event linkage | Connect user/agent/system changes to audit events. | Audit refs, actor refs, event ids. | Jobs, agent runs, approval records, audit events. | Store secrets or raw provider payloads. | 10 |
| Future job/worker linkage | Prepare approved routes for later job inputs by ID. | Nullable job ids, worker candidate ids, readiness metadata. | Jobs, workers, approval, credit reservation. | Create jobs from routes automatically. | 11 |

## E. Table Naming Principles

Future schema planning should use:

- snake_case table names.
- Plural table names where the existing repo convention uses plural.
- Stable foreign key names, such as `project_id`, `edit_plan_id`, `route_id`, and `credit_estimate_id`.
- Domain names before implementation names, such as `creative_skills` rather than provider/tool names.
- No provider-specific table names unless the provider layer owns them.
- No tool names as core table names.
- No runtime output stored in planning tables.
- No secrets, credentials, provider keys, service-role keys, or signed URLs.
- `metadata_json` only for flexible metadata, not required contract fields.
- Linkable opportunity -> concept -> candidate -> route -> plan lineage.

## F. Core ID And Ownership Fields

Future project-owned planning tables should consider:

- `id`
- `workspace_id`
- `project_id`
- `edit_plan_id`
- `edit_plan_segment_id`
- `chat_session_id`
- `source_chat_message_id`
- `created_by_user_id`
- `created_by_agent_run_id`
- `status`
- `version`
- `created_at`
- `updated_at`
- `superseded_by_id`
- `metadata_json`

Rationale:

- Workspace/project ownership supports RLS.
- Version and supersession support revisions without silently mutating approved records.
- User/agent provenance supports audit.
- Chat links support chat-native editing and approval.
- Nullable links are acceptable when records are created in stages.

## G. Creative Skill Taxonomy Table Planning

| Future table | Purpose | Key fields and likely FKs | Source type/interface | RLS/security notes | Migration sequencing notes | Must not store |
| --- | --- | --- | --- | --- | --- | --- |
| `creative_skill_families` | Canonical top-level families. | `skill_family`, label, description, status, default contract, related families. | `CreativeSkillFamilyRecord` | Likely public read/admin-managed mutation. | Phase 1 before any route tables. | Provider credentials, runtime configs. |
| `creative_skills` | Canonical skill keys and catalog metadata. | `skill_key`, family, role, lifecycle, route status, credit/approval tendency. | `CreativeSkillCatalogRecord` | Public or workspace-readable catalog; admin-managed writes later. | Phase 1. | Executable prompt text, provider model choice. |
| `creative_skill_aliases` | Map user language to canonical keys. | alias, canonical skill key, source, confidence, status. | `CreativeSkillAliasRecord` | Admin-managed or reviewed. | Phase 1 after `creative_skills`. | Arbitrary runtime resolver state. |
| `creative_skill_relationships` | Related, alternative, conflict, and support links. | from/to skill keys, relationship type, status. | `CreativeSkillRelationshipRecord` | Readable with catalog. | Phase 1. | Route-specific conflict state. |
| `creative_skill_contract_mappings` | Map skills to planning contract types. | skill key, family, contract type, runtime readiness, required plan records. | `CreativeSkillContractMappingRecord` | Catalog-managed. | Phase 1 before plan assembly. | Runtime worker spec. |
| `creative_skill_duplicate_reviews` | Audit proposed duplicate or alias decisions. | proposed key/family, similar keys, decision, reviewer, status. | `CreativeSkillDuplicateReviewRecord` | Admin/reviewer-only mutation. | Phase 1 or diagnostics phase. | User project data unless linked by ID. |

Canonical fields come from RP-SKILLS-13 and RP-SKILLS-21. These tables must not be confused with `SignatureSystemCatalogRecord`; signature systems remain their own owner lane.

## H. Edit Preference Table Planning

| Future table | Purpose | Key fields and likely FKs | Source type/interface | RLS/security notes | Snapshot/versioning notes | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| `edit_preference_profiles` | Store user/workspace/project/brand preference sources. | workspace, user, project, source type, strength, confidence, categories. | `EditPreferenceProfileRecord` | User/workspace-owned. | Mutable source profile, not plan snapshot. | 2 |
| `edit_preference_profile_versions` | Preserve profile changes over time. | profile id, version, changed by, changed at, change reason. | Derived from RP-SKILLS-12. | Same owner as profile. | Old versions remain available for audit. | 2 |
| `resolved_edit_preference_snapshots` | Attach resolved preference state to edit plans. | project, edit plan, profile ids, resolved values, created at. | `ResolvedEditPreferenceSnapshotRecord` | Project-owned. | Immutable once used by an approved plan. | 2 |
| `edit_preference_conflict_resolutions` | Record priority decisions across preference sources. | snapshot id, conflict type, chosen source, rejected source, reason. | `EditPreferenceConflictResolutionRecord` | Project-owned. | Immutable if tied to approved plan. | 2 |
| `edit_preference_revision_requests` | Track preference-driven revision asks. | project, edit plan, route id, requested change, status. | Derived from revision contracts. | Project-owned. | Supersede affected plan records. | 10 |

Resolved snapshots should attach to edit plans. User/workspace defaults must not rewrite old approved plans. Direct project instructions have priority.

## I. Visual Opportunity Table Planning

| Future table | Purpose | Key fields and likely FKs | Source type/interface | Source/proof safety notes | Phase |
| --- | --- | --- | --- | --- | --- |
| `visual_opportunity_engine_runs` | Group opportunity detection output. | project, edit plan, source context ids, status, confidence. | `VisualOpportunityEngineRunRecord` | Must record input context without pretending analysis executed. | 3 |
| `visual_opportunities` | Store possible moments before concepts. | run id, time range, opportunity type, possible skill keys/families, evidence, source status. | `VisualOpportunityRecord` | Unknown evidence cannot be verified proof. | 3 |
| `visual_opportunity_score_reviews` | Store score review metadata. | opportunity id, score, reason, reviewer, status. | `VisualOpportunityScoreReviewRecord` | Must preserve source/proof uncertainty. | 3 |
| `restraint_opportunities` | Store no-op or restraint recommendations. | project, opportunity id, reason, affected families, status. | `RestraintOpportunityRecord` | Useful for proving intentional non-use. | 3 |
| `opportunity_user_questions` | Store needed user clarification. | opportunity id, question, answer status, blocking target. | `OpportunityUserQuestionRecord` | Can block source-sensitive routes. | 3 |
| `opportunity_duplicate_reviews` | Track repeated or redundant opportunities. | opportunity ids, duplicate reason, decision. | Derived from RP-SKILLS-14. | Helps avoid visual clutter. | 3 |

Opportunities do not select skills or execute tools. Opportunities can be rejected, deferred, blocked, or converted into concept candidates.

## J. Creative Concept Table Planning

| Future table | Purpose | Key fields and likely FKs | Source type/interface | Notes | Phase |
| --- | --- | --- | --- | --- | --- |
| `creative_concept_ideation_runs` | Group concept generation attempts. | project, opportunity ids, preference snapshot id, status. | `CreativeConceptIdeationRunRecord` | Does not run a generator. | 3 |
| `creative_concept_candidates` | Store candidate creative ideas. | run id, opportunity id, concept type, title, role, possible skill keys. | `CreativeConceptCandidateRecord` | Source/proof and credit tendencies must remain visible. | 3 |
| `creative_concept_selections` | Record selected concepts. | concept id, selected skill candidates, reason, status. | `CreativeConceptSelectionRecord` | Selection is not approval. | 3 |
| `creative_concept_rejections` | Record rejected concepts. | concept id, rejected for, reason, safer alternative. | `CreativeConceptRejectionRecord` | Supports restraint and revisions. | 3 |
| `creative_concept_lower_cost_alternatives` | Link premium concepts to lower-cost concepts. | original concept, alternative concept/skill, reason, tradeoff. | `CreativeConceptLowerCostAlternativeRecord` | Must feed credit planning later. | 3 |
| `creative_concept_user_questions` | Ask for user direction before skill scoring. | concept id, question, blocking target, status. | `CreativeConceptUserQuestionRecord` | Can block source/credit-sensitive concepts. | 3 |
| `creative_concept_score_reviews` | Record concept score review. | concept id, score, priority band, QA notes. | Derived from RP-SKILLS-15. | Static/planning review only. | 3 |

Selected concepts are not approved execution. Rejected concepts support restraint, lower-cost alternatives, and revision traceability.

## K. Skill Candidate And Resolver Table Planning

| Future table | Purpose | Key fields and likely FKs | Source type/interface | Notes | Phase |
| --- | --- | --- | --- | --- | --- |
| `skill_resolver_runs` | Group skill candidate scoring output. | project, concept selection id, preference snapshot id, status. | `SkillResolverRunRecord` | Not runtime resolver execution. | 4 |
| `skill_candidates` | Store scored skill candidates. | concept id, skill key, family, score, recommendation, runtime readiness. | `SkillCandidateRecord` | Candidates are not routes. | 4 |
| `skill_candidate_score_reviews` | Store score rationale review. | candidate id, score components, reviewer, warnings. | `SkillCandidateScoreReviewRecord` | Useful for diagnostics. | 4 |
| `skill_candidate_bundles` | Group candidates for a plan. | resolver run id, selected ids, optional ids, blocked ids. | `SkillCandidateBundleRecord` | Feeds route assembly. | 4 |
| `skill_route_decision_previews` | Preview future route decisions. | candidate id, route type, reason, readiness. | `SkillRouteDecisionPreviewRecord` | Preview only, not route record. | 4 |
| `rejected_skill_candidates` | Audit blocked/rejected candidates. | skill key, family, rejected for, lower-cost alternative. | `RejectedSkillCandidateRecord` | Must remain auditable. | 4 |
| `skill_lower_cost_alternative_decisions` | Compare selected vs lower-cost skill options. | original skill, alternative skill, tradeoff, decision. | `SkillLowerCostAlternativeDecisionRecord` | Feeds credit/approval. | 4 |

Skill candidates are not skill routes until route assembly. Blocked candidates should remain auditable.

## L. Skill Route And Plan Assembly Table Planning

| Future table | Purpose | Key fields and likely FKs | Source type/interface | Notes | Phase |
| --- | --- | --- | --- | --- | --- |
| `edit_plan_skill_routes` | Store planned skill route decisions. | edit plan, candidate id, skill key, route type, status, time range/scope. | `EditPlanSkillRouteRecord` | Routes are planning records, not jobs. | 4 |
| `edit_plan_skill_route_bundles` | Group routes for an edit plan. | edit plan, route ids, required/optional/blocked counts. | `EditPlanSkillRouteBundleRecord` | User-visible plan assembly. | 4 |
| `skill_planning_contract_attachments` | Attach planning contract docs/types to routes. | route id, contract type, plan record ids, status. | `SkillPlanningContractAttachmentRecord` | Must not store executable prompt. | 4 |
| `required_skill_plan_record_sets` | Declare plan records required before approval. | route id, required contract types, missing types. | `RequiredSkillPlanRecordSetRecord` | Blocks incomplete routes. | 4 |
| `lower_cost_alternative_route_links` | Link premium route to lower-cost route. | route id, alternative route id, tradeoff, credit impact. | `LowerCostAlternativeRouteLinkRecord` | Supports approval copy. | 4 |
| `skill_route_conflict_flags` | Record route conflicts. | route id, conflict type, severity, status, related route. | `SkillRouteConflictFlagRecord` | StoryTiming/QA visible. | 4 |
| `skill_route_qa_requirements` | Attach route-specific QA requirements. | route id, QA category, severity, blocker target. | `SkillRouteQARequirementRecord` | Later links to QA tables. | 4 |
| `skill_route_revision_links` | Preserve route revision lineage. | original route, revised route, revision request id. | `SkillRouteRevisionLinkRecord` | Supersede, do not silently mutate. | 10 |
| `skill_route_user_visible_summaries` | Store plan summaries shown in chat. | route bundle id, summary, approval copy ids. | `SkillRouteUserVisibleSummaryRecord` | Chat-native display, not UI code. | 4 |
| `skill_plan_assembly_runs` | Group assembly attempts. | project, edit plan, candidate bundle id, completeness score. | `SkillPlanAssemblyRunRecord` | Static planning run metadata. | 4 |

Existing `signature_routes` direction must be reconciled carefully. Future implementation may keep signature routes as compatibility/specialized views or map them into broader skill routes after review.

## M. Specialized Skill Planning Table Planning

| Group | Likely future tables | Purpose and key records | Route linkage | Source/proof/approval notes | Phase |
| --- | --- | --- | --- | --- | --- |
| Universal skill plans | `universal_skill_plans` | Common reason, timing, composition, audio, tool, credit, QA, revision envelope. | `route_id` required. | Required before specialized plan can be complete. | 5 |
| Transition | `transition_plans`, `transition_timing_plans`, `transition_composition_plans`, `transition_audio_plans` | Timing, edge behavior, intensity, audio bridge intent. | route plus StoryTiming window ids. | No random effects; avoid duplicate edit-quality transition owners. | 5 |
| Overlay/compositing | `overlay_compositing_plans`, `overlay_timing_plans`, `overlay_composition_plans` | Screen zone, safe area, blend, layer order, tracking/depth planning. | route plus safe-zone refs. | Source/proof safety for evidence overlays. | 5 |
| Graphic design | `graphic_design_plans`, `graphic_design_structure_plans`, `graphic_design_timing_plans` | Hierarchy, layout, typography intent, proof card safety. | route plus concept/source refs. | Approval for premium/generated graphics. | 5 |
| Motion design | `motion_design_plans`, `motion_timing_plans`, `motion_behavior_plans`, `motion_composition_plans` | What moves, why, when, how, and when it stops. | route plus StoryTiming anchors. | Accessibility/comfort and speech safety. | 5 |
| 3D visuals | `three_d_visual_plans`, `three_d_timing_plans`, `three_d_spatial_composition_plans`, `three_d_motion_behavior_plans` | 3D role, camera, scale, depth, material, tracking/occlusion planning. | route plus approval and source refs. | Premium approval, lower-cost alternative, no model loading. | 5 |
| B-roll | `b_roll_plans`, `b_roll_timing_plans`, `b_roll_source_selection_plans`, `b_roll_composition_plans`, `b_roll_audio_relationship_plans` | Proof/context/support shot planning. | route plus source sequence refs. | Rights/source status and redaction. | 5 |
| Caption | `caption_plans`, `caption_timing_plans`, `caption_text_plans`, `caption_placement_plans` | Meaning, readability, placement, accuracy, emphasis. | route plus transcript refs. | Do not replace existing StoryTiming caption owner. | 5 |
| Sound/music/SFX | `sound_music_plans`, `music_cue_plans`, `sound_timing_plans`, `ducking_speech_safety_plans`, `sfx_plans`, `ambience_room_tone_plans` | Music/SFX/ambience roles, rights, ducking, speech safety. | route plus StoryTiming/SoundSync refs. | Rights/provenance and no audio generation. | 5 |

Required planning fields should be structured columns later where stable. Flexible notes can use `metadata_json`, but required contract fields should not be hidden in JSON.

## N. StoryTiming Table Planning

| Future table | Purpose | Key fields and likely FKs | Source type/interface | Conflict/QA notes | Phase |
| --- | --- | --- | --- | --- | --- |
| `storytiming_coordination_plans` | Coordinate skill focus and density. | edit plan, route bundle id, primary focus, status. | `StoryTimingCoordinationPlanRecord` | Blocks overstuffed moments. | 6 |
| `storytiming_windows` | Store time windows for skill coordination. | plan id, time range, primary focus, support roles. | `StoryTimingWindowRecord` | Connects skills to timeline safely. | 6 |
| `storytiming_conflict_resolution_plans` | Resolve timing/focus conflicts. | conflict type, related route ids, resolution action. | `StoryTimingConflictResolutionPlanRecord` | Auditable conflict state. | 6 |
| `storytiming_density_budget_plans` | Store visual/audio density budgets. | window id, visual density, audio density, budget notes. | `StoryTimingDensityBudgetPlanRecord` | Prevents all skills at once. | 6 |
| `storytiming_permission_gates` | Record permission gates for transitions/SFX/music/3D. | window id, route id, gate type, approval state. | `StoryTimingPermissionGate` | Gate before preview/execution readiness. | 6 |
| `storytiming_qa_requirements` | Attach timing QA checks to routes/windows. | route id, window id, QA category, blocker target. | Derived from StoryTiming and QA contracts. | Can block approval/preview/future execution. | 6 |

StoryTiming should coordinate skills, not execute them. StoryTiming conflicts can block approval, preview, or future execution readiness.

## O. Skill Credit And Approval Planning Table Planning

| Future table | Purpose | Key fields and likely FKs | Source type/interface | Existing relationship | Phase |
| --- | --- | --- | --- | --- | --- |
| `skill_credit_estimate_items` | Route-linked skill credit planning items. | route id, skill key, credit impact, estimate category, confidence. | `SkillCreditEstimateItemRecord` | Later maps to `credit_estimate_items`. | 7 |
| `skill_credit_estimate_summaries` | Summarize skill-level estimate needs. | edit plan, route bundle, total impact, approval required. | `SkillCreditEstimateSummaryRecord` | Later maps to `credit_estimates`. | 7 |
| `skill_credit_lower_cost_alternatives` | Store cheaper route/skill options. | estimate item id, alternative route id, tradeoff. | `SkillCreditLowerCostAlternativeRecord` | Supports approval copy. | 7 |
| `skill_approval_groups` | Group related approval asks. | route ids, estimate item ids, approval scope, status. | `SkillApprovalGroupRecord` | Later links to `approval_records`. | 7 |
| `skill_approval_copy` | Store user-facing approval wording. | approval group id, title, body, risk notes. | `SkillApprovalCopyRecord` | Chat-native approval. | 7 |
| `skill_revision_credit_impacts` | Track credit impact of revisions. | revision request id, route id, impact, reason. | `SkillRevisionCreditImpactRecord` | Later links revision/credit owners. | 10 |

These tables must reconcile with existing credit wallet, ledger, estimate, reservation, and approval architecture. They do not reserve, spend, refund, bill, or approve credits. Future credit reservation remains separate and gated.

## P. Skill QA And Validation Table Planning

| Future table | Purpose | Key fields and likely FKs | Source type/interface | Existing relationship | Phase |
| --- | --- | --- | --- | --- | --- |
| `skill_qa_requirements` | Store required QA checks. | route id, plan id, QA stage, category, severity, blocker target. | `SkillQARequirementRecord` | Align with edit quality QA. | 8 |
| `skill_qa_results` | Store QA result state. | requirement id, status, severity, finding, checked at. | `SkillQAResultRecord` | May block plan display/approval. | 8 |
| `skill_qa_reports` | Aggregate QA for a route bundle/edit plan. | edit plan, route bundle, status, highest severity. | `SkillQAReportRecord` | Relates to existing QA reports. | 8 |
| `skill_qa_repair_recommendations` | Store repair suggestions. | report id, affected route, recommended fix, status. | `SkillQARepairRecommendationRecord` | Planning-only repair notes. | 8 |
| `skill_qa_gate_decisions` | Record gate decisions. | report id, target, decision, reason. | `SkillQAGateDecision` | Gate readiness, not runtime QA. | 8 |

QA records should be able to block user plan display, credit estimate display, approval, preview, or future execution readiness. QA records are not runtime QA execution in this prompt.

## Q. Skill Diagnostics Table Planning

| Future table | Purpose | Key fields and likely FKs | Source type/interface | Phase |
| --- | --- | --- | --- | --- |
| `skill_diagnostic_rules` | Store diagnostics rule metadata if persistence becomes necessary. | rule key, category, level, severity, owner doc, status. | `SkillDiagnosticRuleRecord` | 9 |
| `skill_diagnostic_results` | Store diagnostic findings. | rule id, status, target path/table, remediation. | `SkillDiagnosticResultRecord` | 9 |
| `skill_diagnostic_runs` | Group diagnostic runs. | run id, checked paths, summary status, created by. | `SkillDiagnosticRunRecord` | 9 |

Diagnostics may remain docs/static artifacts for a while. Runtime diagnostics tables should only be added if needed. CI/static validation may not need database tables at first.

## R. Source/Proof Safety Schema Planning

Future source/proof safety may be shared fields on source-sensitive tables or a normalized table group. Required planning fields:

- `source_type`
- `source_status`
- `evidence_support_level`
- `proof_context_level`
- `rights_or_authorization_status`
- `redaction_needed`
- `safe_wording_required`
- `user_confirmation_required`
- `sensitive_data_risk`
- `reference_dna_only`
- `unknown_source_blocked`
- `source_notes`

Browser/app/evidence/metric/price/source visuals need source safety. Unknown source cannot be treated as verified proof. Sensitive/private data requires redaction planning. Reference DNA must not become copied assets.

## S. Approval/Credit Foreign-Key Strategy

Future FK strategy should preserve ordering and avoid circular dependencies:

- Skill routes link to skill credit estimate items.
- Estimate items link to skill approval groups.
- Approval groups may later link to existing/future `approval_records`.
- Estimate summaries may later link to existing/future `credit_estimates`.
- Credit reservations later link to approved estimates, not directly to draft routes.
- Generation/jobs later link to approved estimate/reservation records.
- Revision requests link to revision credit impact records.

Use nullable FKs where approval/credit records are created later. Preserve audit trail when routes are removed, rejected, or superseded.

## T. Job/Orchestration Linkage Strategy

Routes and plan records should not create jobs. Approved routes may later produce job inputs, but future jobs should reference IDs, not raw prompts. Future workers should load trusted context by ID. Future jobs must check approval and credit reservation before work. Failed jobs should later link to QA, revision, and credit behavior.

## U. RLS/Security Planning

Future RLS/security expectations:

- Workspace/project ownership on user/project data.
- Catalog tables may be public/readable if safe or admin-managed later.
- Preference profiles are user/workspace-owned.
- Project planning records are workspace/project-owned.
- Source/proof records may contain sensitive context and require strict project membership checks.
- No secrets in tables.
- No provider keys.
- No signed URLs.
- No service-role keys.
- Use storage references carefully later.
- Audit events for approval, credit, source-sensitive, and catalog mutation changes.
- Admin-only mutation for canonical skill catalog later if needed.

RLS planning must exist before real user data is stored.

## V. Migration Sequencing Recommendation

| Phase | Theme | Why this order | Dependencies | Validate before next phase | Must not include yet |
| --- | --- | --- | --- | --- | --- |
| 1 | Catalog and taxonomy | Stable keys are needed before routes. | RP-SKILLS-13 and type aliases. | No duplicate keys or provider-name tables. | Project routes/jobs. |
| 2 | Preference profiles/snapshots | Preferences influence all downstream decisions. | Users, workspaces, projects. | Snapshot immutability and RLS plan. | Runtime preference resolution. |
| 3 | Opportunities and concepts | Concepts precede candidate scoring. | Source/proof safety and edit plan links. | Source uncertainty captured. | Skill execution or tools. |
| 4 | Candidates and route assembly | Routes need scored candidates and contract mappings. | Catalog, concepts, preferences. | Route lineage and required contracts complete. | Jobs or workers. |
| 5 | Specialized skill plan tables | Routes determine which specialized plan records are needed. | Universal plan, routes, contract attachments. | Route-to-plan completeness. | Provider requests. |
| 6 | StoryTiming coordination | Timing validates multi-skill moments. | Routes and plan records. | Conflict blockers queryable. | Render timeline execution. |
| 7 | Credit/approval planning | Premium routes need estimates and approval groups. | Routes, plans, QA blockers. | No-generation-before-approval path. | Reservations/spend/refunds. |
| 8 | QA/validation | Planning QA gates user-visible readiness. | Routes, plans, StoryTiming, credit. | Blockers visible by edit plan. | Runtime QA execution. |
| 9 | Diagnostics metadata if needed | Static checks may not need DB first. | Docs/types/schema readiness. | Rule ownership clear. | CI runtime storage unless justified. |
| 10 | Revision and audit expansion | Revisions depend on approved route history. | Approved plans, QA, approvals. | Supersession semantics. | Hard deletes of approved history. |
| 11 | Worker/job linkage later | Jobs belong after approval and reservation. | Approval, credit reservation, jobs owner. | Backend worker boundary review. | Automatic route-to-job creation. |

## W. Data Lifecycle And Versioning

Future records should support:

- draft records
- approved records
- superseded records
- rejected records
- blocked records
- archived records
- revision versions
- snapshot immutability
- catalog versioning
- soft delete over hard delete for approved planning history
- audit trail requirements

Approved edit plans should not change silently. Preference snapshots should be immutable once used. Route revisions should supersede rather than mutate important planning records.

## X. JSON And Structured Fields Strategy

Prefer structured columns for required fields. Use JSON only for flexible future metadata. Avoid hiding required planning contract fields in JSON. Use future check constraints or enums where helpful. JSON must never store secrets. JSON may preserve provider/runtime boundary notes only as references, not credentials.

## Y. Indexing And Query Planning Notes

Future query needs:

- Fetch all skill routes for an edit plan.
- Fetch StoryTiming windows for an edit plan.
- Fetch approval-required premium items.
- Fetch QA blockers.
- Fetch route lineage opportunity -> concept -> candidate -> route.
- Fetch source-sensitive items.
- Fetch lower-cost alternatives.
- Fetch current preference snapshot.
- Fetch active catalog skills.
- Fetch diagnostics/QA status.
- Fetch revision history.

Recommended index categories, not SQL:

- Project/edit plan foreign keys.
- Status fields.
- Skill key/family.
- Route id.
- Approval required.
- QA severity/status.
- Source safety status.
- Created at/version.

## Z. Schema QA Checks

Future schema QA should verify:

- Every planning table has project/workspace ownership where needed.
- Every route can trace opportunity/concept/candidate lineage.
- Every premium route can link credit/approval item.
- Every source-sensitive route has source safety fields.
- Every specialized plan links to route.
- Every QA blocker links to a record.
- No provider secrets in schema.
- No execution status in planning table unless clearly planning status.
- No migration before docs/types readiness.
- RLS plan exists before production user data.

## AA. Example Schema Walkthroughs

1. Basic caption route from opportunity to caption plan to credit item to QA: Opportunity detects readability need; concept selects clean captions; candidate becomes caption route; caption plan links to transcript/timing; credit item is low/no premium; QA checks readability. Nothing renders captions yet.
2. Optional 3D real estate blueprint route with lower-cost graphic alternative: Concept proposes 3D blueprint; resolver marks premium optional; route links 3D plan and lower-cost graphic route; approval group and estimate item are required. No model loads or provider calls.
3. Product demo screen annotation with source safety confirmation: Opportunity references app screen; source safety requires confirmation/redaction; graphic/overlay route waits on user confirmation; QA blocks unsafe labels. No browser capture runs.
4. Education VisualExplain diagram with captions and StoryTiming: Concept selects diagram plus caption support; route bundle links graphic, caption, and StoryTiming windows; QA checks density and speech safety. No animation or render job starts.
5. Marketing proof card with source/proof caution and approval group: Proof-card concept records evidence support level; source safety flags unknown metrics; approval copy explains uncertainty; QA blocks invented claims. No generated proof page is created.
6. SoundSync music cue with lyrics policy and ducking plan: Sound/music plan stores cue intent, rights status, lyric policy, and ducking safety; StoryTiming gates music around speech. No audio generation, mixing, or provider call occurs.
7. StoryTiming conflict blocking 3D/caption collision: 3D route and caption route share a window; conflict resolution plan records collision; QA blocks preview readiness until placement changes. No preview/render executes.
8. Revision removing premium 3D and activating lower-cost route: Revision link supersedes the premium 3D route; lower-cost graphic route becomes active; credit impact record notes reduced estimate. Existing approvals/reservations are not mutated silently.

## AB. Anti-Patterns

- Route table used as job table.
- Estimate item used as credit reservation.
- Approval status used as generation permission without reservation/job gate.
- Planning records storing provider secrets.
- JSON hiding required fields.
- Source/proof fields missing.
- No RLS ownership fields.
- Deleting approved plans instead of superseding.
- Skill catalog mixed with provider registry.
- Tool names hard-coded as skill tables.
- Migration creates everything in one huge table.
- Migration duplicates existing credit/approval tables.
- Migration ignores `signature_routes` compatibility.
- Migration before type/docs readiness.
- SQL written in a docs-only prompt.

## AC. Future Implementation Notes

This contract prepares future migrations but does not create them. Future migration prompts must reconcile this contract with `database-architecture.md`, `supabase/README.md`, `supabase/migration-order.md`, and existing migrations. Future schema work should begin with a migration blueprint/review, not direct production changes. Future migrations must be local/schema-only until approved. Future SQL must avoid secrets and provider credentials. Future RLS policies are required before real user data.

## AD. Relationship To RP-SKILLS TypeScript Contracts

TypeScript contracts are the source for field names and shapes. Schema should map to contracts but may normalize records differently. Any divergence must be documented. Contract aliases/collisions noted in RP-SKILLS-23 should be preserved, especially `CreativeSkillCaptionTimingPlanRecord` and `CreativeSkillStoryTimingConflictType`. Mock fixtures from RP-SKILLS-22 provide example lineage and should remain static planning examples, not seed data.

## AE. Relationship To Existing Migration System

Future migration work must inspect `supabase/migrations/` before writing anything. Do not duplicate existing Stroke Motion, provider, credit, approval, job, media, StoryTiming, SFX, render/export, revision, QA, storage, worker lease, or planning tables. Existing docs say the Supabase target is `reeditpro`; preserve that boundary. Do not use Yuza Studio Supabase.

Relevant existing migration overlap includes:

- Core workspace/project/chat/media/source sequence.
- Intent and edit planning.
- Professional edit quality.
- Credit ledger and approval gate.
- Job orchestration and agent runs.
- Stroke Motion data model.
- Generation providers and generated assets.
- Render, preview, export, revision, and QA.
- RLS policies and storage buckets.
- SFX Director tables.
- StoryTiming master tables.
- Worker lease/runtime transport.
- E2E runtime readiness.

## AF. Next Prompt Handoff

Recommended next prompt:

`RP-SKILLS-25 - Creative Skill Supabase Migration Blueprint and RLS Readiness Contract`

Scope:

Docs-only migration blueprint contract that turns this schema planning document into ordered future migration groups, proposed table-by-table field summaries, FK/RLS/security readiness checklist, rollback/supersession strategy, and migration validation plan. It must not write SQL or create migration files yet.
