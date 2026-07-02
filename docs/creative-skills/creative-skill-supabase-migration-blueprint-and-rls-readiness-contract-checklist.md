# RP-SKILLS-25 Creative Skill Supabase Migration Blueprint And RLS Readiness Checklist

This checklist is for future Creative Skill migration blueprint prompts. It is documentation only. It must not create SQL, migrations, schema changes, RLS policies, seed scripts, runtime code, TypeScript contracts, package changes, Supabase connections, provider calls, workers, render/export behavior, or app behavior.

## Required Checks

| Check | Requirement |
| --- | --- |
| No SQL created | The prompt must not include executable SQL or policy syntax. |
| No migration files created | The prompt must not add files under `supabase/migrations/`. |
| Supabase not connected | The prompt must not run Supabase CLI, MCP, SQL, remote queries, or project connections. |
| Existing migrations inspected | The prompt must record overlap with current `supabase/migrations/` owners before proposing table groups. |
| Supabase target respected | Future backend/database work must reference `reeditpro`, not Yuza Studio Supabase. |
| Table groups defined | Catalog, preferences, opportunities, concepts, candidates, routes, specialized plans, StoryTiming, credit/approval, QA, diagnostics, revision/audit, and future job linkage must be covered. |
| Migration phases defined | The blueprint must sequence future packages from catalog foundations through dependent planning records. |
| Table-by-table field summaries present | Each proposed table group must include purpose, key columns, likely FKs, status/version fields, RLS notes, source TypeScript/docs, migration notes, and anti-patterns. |
| RLS/security readiness matrix present | The blueprint must identify owner keys, read/write expectations, service/admin expectations, and special cautions by group. |
| FK strategy present | The blueprint must preserve opportunity -> concept -> candidate -> route -> specialized plan lineage and approval/credit/QA/revision links. |
| Status/enum strategy present | Future status alignment with TypeScript unions must be planned without premature hardcoding. |
| JSON strategy present | Required fields must be structured later; JSON is only for flexible metadata and never secrets. |
| Data lifecycle/supersession present | Approved records, snapshots, rejected candidates, removed premium items, and revision chains must remain auditable. |
| Rollback strategy present | Future migrations must be small, additive, reviewable, and include rollback notes later. |
| Seed strategy present | Catalog seed planning must be deterministic, versioned, secret-free, and aligned with `CreativeSkillKey`. |
| Migration validation plan present | Future checks must cover tables, columns, FKs, RLS, status constraints, route lineage, QA blockers, source/proof safety, and supersession. |
| Query/index readiness plan present | Common future reads by edit plan, route bundle, premium approvals, QA blockers, source sensitivity, StoryTiming windows, lineage, alternatives, preferences, catalog, revisions, and diagnostics must be listed. |
| Source/proof safety included | Unknown source, evidence, UI, metric, pricing, or claim status must stay queryable and auditable. |
| Credit/approval boundaries included | Estimates are not reservations or spend; approvals are not generation permission. |
| Job/runtime boundaries included | Routes are not jobs; provider/tool readiness is metadata. |
| Existing owners reconciled | Existing credit, approval, jobs, media, StoryTiming, SFX, render/export, provider, worker, QA, Stroke Motion, and `signature_routes` owners must not be duplicated. |
| Runtime actions avoided | No runtime systems, workers, providers, render/export, validation runtime, diagnostics runtime, or app behavior should be touched. |

## Table Group Coverage

Use this list to confirm the blueprint did not skip a required planning group:

- Creative Skill catalog foundation.
- Edit preference foundations.
- Visual opportunities.
- Creative concepts.
- Skill candidates and resolver records.
- Skill routes and plan assembly.
- Universal and specialized skill planning records.
- StoryTiming coordination.
- Skill credit and approval planning.
- Skill QA and validation.
- Diagnostics metadata, if needed.
- Revision and audit linkage.
- Future job/worker linkage.

## RLS And Security Readiness

Future blueprint prompts must identify:

- Whether the table group contains user/workspace data.
- Whether the table group contains source/proof-sensitive data.
- Whether the table group contains financial or credit data.
- Suggested owner keys such as `workspace_id`, `project_id`, `edit_plan_id`, `route_id`, or `job_id`.
- Read policy expectation in plain English.
- Write policy expectation in plain English.
- Admin/service-role expectation in plain English.
- Special cautions for secrets, source proof, financial data, jobs, approvals, or generated assets.

Do not write actual RLS policy SQL in RP-SKILLS-25-style prompts.

## Fail The Prompt If

- SQL is written.
- A migration file is created.
- A Supabase connection is attempted.
- A database schema is changed.
- RLS planning is missing.
- Source/proof safety is missing.
- A credit estimate is treated as reservation, spend, refund, bill, wallet, or ledger state.
- Approval is treated as generation permission.
- A planning route is treated as a job.
- Secrets, service-role keys, provider keys, credentials, signed URLs, or raw provider payloads are stored.
- JSON hides required fields such as route reason, approval status, source status, QA status, credit impact, StoryTiming readiness, or source/proof safety.
- Existing table owners are ignored.
- Package files are mutated.
- TypeScript contracts are changed.
- Runtime behavior is added.
- Providers, workers, render/export, QA runtime, validation runtime, diagnostics runtime, skill route runtime, skill resolver runtime, opportunity detection, concept generation, preference runtime, audio/music/SFX generation, caption rendering, browser/capture/media runtime, WebGL/canvas/3D runtime, stock/search, AI generation, Stripe, billing, wallet, ledger, or approval runtime is unlocked.

## RP-SKILLS-26 Handoff Check

The next prompt should be:

`RP-SKILLS-26 - Creative Skill Catalog Migration Readiness Review`

Allowed scope:

- Docs-only readiness review for the first future catalog migration package.
- Compare proposed catalog tables against existing migrations, RP-SKILLS-21 types, RP-SKILLS-22 fixtures, RP-SKILLS-23 reconciliation, RP-SKILLS-24 schema planning, and RP-SKILLS-25 blueprint.
- Identify exact table/field decisions, RLS expectations, seed strategy, rollback notes, and validation checks.

Forbidden scope:

- SQL.
- Migration files.
- Supabase connection.
- Schema changes.
- Runtime behavior.
- UI.
- Provider calls.
- Workers.
- Package changes.
