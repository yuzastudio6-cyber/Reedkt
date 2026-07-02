# RP-SKILLS-26 Creative Skill Catalog Migration Readiness Review Checklist

Use this checklist for future Creative Skill catalog migration readiness prompts. This is documentation only and must not create SQL, migrations, schema changes, RLS policies, seed scripts, Supabase connections, TypeScript contracts, mock fixture changes, package changes, runtime code, providers, workers, UI, render/export, or app behavior.

## Required Checks

| Check | Requirement |
| --- | --- |
| No SQL created | The readiness review must not include executable SQL. |
| No migration file created | The readiness review must not add files under `supabase/migrations/`. |
| Supabase not connected | The readiness review must not run Supabase CLI, MCP, SQL, remote queries, or project connections. |
| Existing migrations inspected | Current migrations are searched for `creative_skill_*`, `signature_system`, and `signature_routes` overlap. |
| Existing types inspected | RP-SKILLS-21 catalog interfaces are mapped to future table decisions. |
| Mock fixtures inspected | RP-SKILLS-22 catalog fixtures are treated as seed guidance only. |
| Signature system catalog compatibility reviewed | `SignatureSystemCatalogRecord`, `signature_system`, and `signature_routes` remain separate owners. |
| Table scope narrowed to catalog foundation | Scope is limited to six catalog tables only. |
| Field decisions documented | Each proposed table includes required, optional, and structured fields. |
| Structured versus `metadata_json` decisions documented | Required catalog facts stay structured; `metadata_json` is non-critical only. |
| RLS/security matrix completed | Every proposed catalog table has read/write/admin and RLS expectations. |
| Seed strategy completed | Deterministic seed source, key validation, and no user/project mutation are covered. |
| Constraints/indexes proposed | Uniqueness, FK, status/check, and lookup/index candidates are covered. |
| Versioning/supersession planned | Lifecycle, alias status, relationship status, and historical key preservation are covered. |
| Rollback notes present | Future migration is additive, reviewable, and rollback-safe in local/dev before dependencies. |
| Migration validation plan present | Future validation covers required tables, columns, FKs, RLS, no secrets, no runtime columns, and lint/diff checks. |
| Readiness blockers/warnings table present | The review names ready items, warnings, blockers, evidence, decisions, and owner follow-up. |
| Final readiness decision present | The review ends with `ready_for_migration_prompt`, `ready_with_warnings`, `not_ready_blocked`, or `needs_owner_decision`. |
| Next migration implementation scope defined | The next prompt is allowed only if readiness supports it and must stay catalog-only. |
| Runtime actions avoided | No runtime, UI, provider, worker, render/export, validation, diagnostics, or app behavior is touched. |

## Catalog Table Scope

The readiness review should cover exactly:

- `creative_skill_families`
- `creative_skills`
- `creative_skill_aliases`
- `creative_skill_relationships`
- `creative_skill_contract_mappings`
- `creative_skill_duplicate_reviews`

Fail the prompt if it expands scope to:

- edit preferences.
- visual opportunities.
- creative concepts.
- skill candidates or resolver records.
- routes or plan assembly.
- specialized skill plans.
- StoryTiming.
- credit/approval.
- QA.
- diagnostics beyond duplicate-review readiness.
- jobs/workers.
- providers/tools.
- user project planning data.

## Table Readiness Sections

Each table readiness section should include:

- purpose.
- proposed field list.
- required fields.
- optional fields.
- candidate constraints.
- candidate indexes.
- RLS expectation.
- seed/static data expectation.
- rollback/supersession notes.
- validation checks.
- readiness status.

## Fail The Prompt If

- SQL is written.
- A migration file is created.
- A Supabase connection is attempted.
- Database schema is changed.
- Non-catalog tables are included.
- Signature system ownership is ignored.
- RLS/security readiness is missing.
- Seed strategy is missing.
- Rollback notes are missing.
- Validation plan is missing.
- Provider/tool secrets are referenced.
- Package files are mutated.
- TypeScript contracts are changed.
- Mock fixture code is changed.
- Runtime behavior is added.
- Providers, workers, UI, render/export, QA runtime, validation runtime, diagnostics runtime, credit runtime, skill route runtime, skill resolver runtime, visual analysis runtime, opportunity detector runtime, creative concept runtime, preference runtime, orchestration runtime, audio/music/SFX generation, caption rendering, ASR/transcript/translation, browser/capture/media runtime, WebGL/canvas runtime, generation runtime, Stripe, billing, wallet, ledger, reservation, approval runtime, or AI calls are added.

## RP-SKILLS-27 Handoff Check

If the final readiness decision is `ready_for_migration_prompt` or `ready_with_warnings`, the next recommended prompt may be:

`RP-SKILLS-27 - Creative Skill Catalog Supabase Migration Implementation`

Allowed future scope:

- Owner-approved migration-only implementation.
- A single Supabase migration for catalog foundation tables only.
- No runtime code, UI, workers, providers, package changes, Supabase connection, production deployment, or non-catalog tables.

If the final readiness decision is `not_ready_blocked` or `needs_owner_decision`, recommend a docs-only repair/decision prompt instead.
