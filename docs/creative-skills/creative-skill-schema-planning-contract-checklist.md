# RP-SKILLS-24 Creative Skill Schema Planning Checklist

Use this checklist for future prompts that touch Creative Skill schema planning. It is documentation only. It does not authorize SQL, migrations, Supabase connections, schema mutations, runtime code, TypeScript contracts, provider calls, workers, package changes, UI, render/export, or app behavior.

## Required Checks

| Check | Current expectation |
| --- | --- |
| Table groups defined | Taxonomy, preferences, opportunities, concepts, candidates/resolver, routes, specialized plans, StoryTiming, credit/approval, QA, diagnostics, source/proof, revisions, audit/events, and job linkage are planned. |
| Migration phases defined | Future work has ordered phases and dependency gates before any migration. |
| Catalog tables planned | `creative_skill_families`, `creative_skills`, aliases, relationships, mappings, and duplicate reviews are covered. |
| Preference snapshot tables planned | Profiles, versions, resolved snapshots, conflict resolutions, and revision requests are covered. |
| Opportunity/concept tables planned | Opportunity runs, opportunities, concept runs, candidates, selections, rejections, questions, and lower-cost alternatives are covered. |
| Candidate/route tables planned | Resolver runs, candidates, bundles, route previews, routes, bundles, attachments, record sets, conflicts, QA requirements, summaries, and assembly runs are covered. |
| Specialized plan tables planned | Transition, overlay/compositing, graphic design, motion, 3D, B-roll, caption, sound/music/SFX, and universal plan tables are covered. |
| StoryTiming tables planned | Coordination plans, windows, conflict resolutions, density budgets, permission gates, and QA requirements are covered. |
| Credit/approval planning tables planned | Estimate items, summaries, lower-cost alternatives, approval groups, approval copy, and revision credit impact are covered. |
| QA/diagnostics tables planned | QA requirements/results/reports/repairs/gates and diagnostic rules/results/runs are covered. |
| Source/proof safety fields planned | Source type/status, evidence/proof level, rights, redaction, safe wording, user confirmation, sensitive data, Reference DNA, unknown-source block, and notes are covered. |
| RLS/security expectations defined | Workspace/project ownership, catalog mutability, sensitive source records, secrets boundary, audit events, and admin-only catalog mutation are covered. |
| Approval/credit FK strategy defined | Routes -> estimate items -> approval groups -> approval records/credit estimates -> reservations/jobs later is documented. |
| Job/orchestration boundary defined | Routes and plans do not create jobs; future jobs reference approved IDs only. |
| JSON strategy defined | Required fields stay structured; JSON is flexible metadata only and never stores secrets. |
| Query/index needs described | Edit plan routes, StoryTiming windows, approval-required items, QA blockers, lineage, source-sensitive records, alternatives, snapshots, catalog, diagnostics, and revision history are covered. |
| Existing overlap considered | Existing `signature_routes`, credit/approval, StoryTiming, SFX, provider/generation, jobs, render/export, QA, storage, worker lease, and RLS owners are referenced rather than replaced. |
| Supabase target respected | Future work targets `reeditpro` only and never Yuza Studio Supabase. |
| Runtime/SQL actions avoided | No SQL, migrations, Supabase connections, runtime, TypeScript, packages, providers, workers, UI, or app behavior changes are made. |

## Fail The Prompt If

- SQL or a migration file is created.
- A Supabase connection is attempted.
- Database schema is changed.
- A route table is treated as a job table.
- Approval is treated as generation permission.
- A credit estimate is treated as reservation, spend, or refund.
- Provider secrets, service-role keys, signed URLs, API keys, or credentials are stored.
- Source/proof safety is missing.
- RLS/security planning is missing.
- Existing table owners are ignored.
- JSON hides required planning fields.
- Dependencies are installed.
- Package files are mutated.
- Schema/runtime behavior is unlocked.
- TypeScript contracts are changed from a docs-only prompt.
- UI, provider, worker, render/export, QA runtime, diagnostics runtime, validation runtime, browser/capture/media/WebGL/canvas/3D runtime, audio/music/SFX generation, caption rendering, ASR/transcript/translation, generation runtime, or AI calls are added.

## Minimum Handoff

Every future schema-planning prompt should report:

- Files inspected.
- Missing files noted honestly.
- Existing migration overlap.
- Whether SQL/migrations/schema/runtime were avoided.
- Validation run and result.
- Next prompt recommendation.
