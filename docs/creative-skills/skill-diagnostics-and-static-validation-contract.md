# Skill Diagnostics And Static Validation Contract

This document is documentation only. It is not a diagnostics script, a validation runtime, a CI workflow, a TypeScript contract, a SQL schema, a migration, a package change, a worker spec, a provider instruction, a prompt executor, a render/export system, a Supabase operation, a QA runtime, or a UI surface.

It defines how future Creative Skill System docs, contracts, pseudo-records, TypeScript types, schemas, fixtures, planner outputs, and CI gates should be checked before runtime code depends on them.

## Purpose

The Skill Diagnostics and Static Validation contract defines the future checks that should keep the Creative Skill System from drifting into duplicate skill keys, missing planning contracts, unsafe premium approval behavior, runtime unlocks, package mutations, provider leakage, migration timing mistakes, or source-of-truth duplication.

It exists to make future implementation safer. It does not implement those checks in this prompt.

## Diagnostics Doctrine

Diagnostics should fail architecture drift before runtime code depends on it.

Creative Skill diagnostics are not execution. They are static source-truth checks that make the planning layer boringly reliable so the creative layer can stay ambitious, professional, and approval-gated.

Diagnostics must:

- Detect missing or duplicated planning source truths.
- Preserve the source-of-truth hierarchy defined by prior RP-SKILLS docs.
- Block skill execution paths when planning contracts, approval hints, source/proof safety, StoryTiming coordination, or QA coverage are missing.
- Treat future artifacts that do not exist yet as `future_pending`, not as passed.
- Refuse runtime unlocks inside docs-only milestones.

Diagnostics must not:

- Generate assets.
- Run providers.
- Dispatch workers.
- Reserve or spend credits.
- Mutate package files.
- Create migrations.
- Start browser, WebGL, canvas, 3D, media, audio, caption, render, QA, validation, or diagnostics runtime.
- Treat a skill name as enough information to execute.

## Position In Implementation Roadmap

Diagnostics should arrive in controlled layers:

| Order | Layer | Diagnostic posture |
| --- | --- | --- |
| 1 | Docs-only contracts | Human-run static checks over Markdown source truths. |
| 2 | Static docs completeness checks | Future scriptable docs checks may verify required sections, rule keys, and forbidden wording. |
| 3 | TypeScript contracts | Future types may encode selected docs-only pseudo-records after approval. |
| 4 | TypeScript static validation | Future static checks may compare type surfaces against docs source truths. |
| 5 | Mock records / fixtures | Future fixtures may provide sample opportunities, concepts, candidates, routes, approvals, and QA reports. |
| 6 | Fixture diagnostics | Future checks may validate fixture completeness and conflict behavior without executing providers. |
| 7 | Supabase schema/migration readiness | Future checks may confirm schema readiness only after schema prompts approve migrations. |
| 8 | Schema diagnostics | Future checks may compare tables, RLS assumptions, and required fields after migrations exist. |
| 9 | Planner/mock integration | Future checks may validate planner output shape against contracts. |
| 10 | Planner diagnostics | Future checks may identify bad plans, missing alternatives, missing approvals, or unsafe source/proof claims. |
| 11 | UI cards | Future UI work may show diagnostic summaries after contracts and planner output exist. |
| 12 | UI/static checks | Future checks may validate display completeness and no hidden blockers. |
| 13 | Worker/job integration later | Future checks may block execution if planning, approval, QA, and credit gates fail. |
| 14 | Runtime gates later | Future runtime gates may enforce approved plans only after all prior layers exist. |

RP-SKILLS-20 covers only the docs-only diagnostic doctrine and future static validation boundaries.

## Diagnostics Scope Categories

| Category | What it checks | Future implementation layer | Example failure | Notes |
| --- | --- | --- | --- | --- |
| `docs_completeness` | Required sections, handoffs, examples, anti-patterns, missing-file notes, and checklists. | Docs-only static. | A contract omits QA or revision behavior. | Current prompt documents checks only. |
| `source_of_truth_integrity` | Prior RP-SKILLS docs and existing repo owners are referenced, not replaced. | Docs-only static. | A skill doc creates a second credit approval architecture. | Uses `source-of-truth-map.md` and handoff notes. |
| `skill_taxonomy_validation` | Canonical families, keys, aliases, statuses, and duplicate prevention. | Docs now, type/static later. | Two skills claim the same canonical key. | Must reference RP-SKILLS-13. |
| `planning_contract_validation` | Every skill route has a contract, use rules, avoid rules, and required envelopes. | Docs now, planner later. | Premium 3D route has no planning contract. | Must reference RP-SKILLS-02 through RP-SKILLS-12. |
| `pseudo_record_validation` | Pseudo-record tables have fields, descriptions, required/optional status, and examples. | Docs-only static. | `SkillCandidate` lacks rejection reason fields. | Future types must not silently diverge. |
| `checklist_validation` | Checklist docs include required checks and fail cases. | Docs-only static. | Checklist omits runtime-forbidden fail cases. | Applies to each RP-SKILLS checklist. |
| `prompt_duplication_detection` | Future prompts do not create parallel runtime, prompt, schema, or owner lanes. | Docs-only static, CI later. | Prompt creates a new provider prompt lane for skills. | Uses duplicate-lane checklist. |
| `runtime_unlock_detection` | Docs-only prompts do not introduce executable behavior or runtime language. | Docs-only static, CI later. | Contract says a worker should execute immediately. | Runtime language must be future-gated. |
| `package_mutation_detection` | Package files and installs remain untouched in docs-only prompts. | Git/static later. | `package.json` gains a diagnostics command during docs-only work. | RP-SKILLS-20 does not mutate packages. |
| `migration_timing_validation` | Migrations, SQL, and schemas are not added before the schema milestone. | Git/static later. | A skill table migration appears before type contracts. | Supabase remains forbidden here. |
| `TypeScript_contract_validation_future` | Future TypeScript types match approved docs contracts. | TypeScript static future. | Type omits approval-gate fields. | Not implemented in RP-SKILLS-20. |
| `schema_validation_future` | Future schema fields match approved type and docs contracts. | Schema static future. | Table allows route execution without approval status. | Not implemented in RP-SKILLS-20. |
| `mock_fixture_validation_future` | Future fixtures cover pass, warning, fail, rejected, and lower-cost cases. | Fixture static future. | No fixture covers blocked premium skill. | Not implemented in RP-SKILLS-20. |
| `planner_validation_future` | Future planner output includes opportunities, concepts, candidates, routes, credits, QA, and summaries. | Planner static future. | Planner emits skill route without contract attachment. | Not implemented in RP-SKILLS-20. |
| `StoryTiming_validation_future` | Time windows, focus, density, speech, caption, visual, and SFX conflicts are checked. | Planner/static future. | Captions, 3D, and SFX collide in one moment. | Must reference RP-SKILLS-11. |
| `credit_approval_gate_validation` | Premium or generated work has estimate, approval, lower-cost, and no-generation-before-approval behavior. | Planner/static future. | Generated music appears without approval copy. | Must reference RP-SKILLS-18. |
| `source_proof_safety_validation` | Claims, URLs, dashboards, metrics, screenshots, rights, provenance, and redaction are safe. | Docs/planner/static future. | B-roll invents a dashboard metric. | Must reference source/proof safety in prior contracts. |
| `provider_tool_boundary_validation` | Tool/provider candidates stay planning metadata until implementation is approved. | Docs/static future. | Route names a provider call as already selected. | Existing tool registry is source truth. |
| `Supabase_boundary_validation` | Supabase migrations, tables, SQL, and runtime access remain milestone-gated. | Schema/static future. | Prompt runs Supabase CLI during docs-only work. | Supabase is forbidden in RP-SKILLS-20. |
| `QA_contract_validation` | Future plans satisfy QA requirements before display, approval, preview, revision, or execution. | Planner/static future. | Plan has no blocker/warning matrix. | Must reference RP-SKILLS-19. |
| `CI_static_boundary_validation` | Future CI checks are static, deterministic, and scoped to approved artifacts. | CI future. | CI runs provider calls or media processing. | CI is not added in RP-SKILLS-20. |

## Static Validation Levels

| Level | Meaning | Current status |
| --- | --- | --- |
| `docs_only_static` | Check Markdown source truths, headings, required strings, pseudo-record tables, forbidden scopes, and handoffs. | Defined here. |
| `docs_plus_types_static_future` | Check approved Markdown against future TypeScript contracts. | Future pending. |
| `docs_types_schema_static_future` | Check docs, TypeScript, and future schema/migration shape. | Future pending. |
| `mock_fixture_static_future` | Check future fixtures for required pass/warn/fail examples. | Future pending. |
| `planner_static_future` | Check future mock or real planner output against contracts. | Future pending. |
| `CI_gate_future` | Run approved static checks in CI without providers, workers, media processing, or Supabase execution. | Future pending. |
| `runtime_gate_future` | Block runtime execution if approved planning, credit, QA, and route gates fail. | Future pending. |

## Diagnostic Severity Model

| Severity | Meaning |
| --- | --- |
| `pass` | Required condition is satisfied. |
| `info` | Non-blocking evidence or note. |
| `warning` | Issue should be reviewed but does not block the current docs milestone. |
| `fail` | Required static condition is missing or violated. |
| `critical_fail` | Condition would unlock runtime, spend credits, run providers, mutate packages, create migrations, or bypass approval. |
| `not_applicable` | Rule does not apply to the current artifact. |
| `future_pending` | Rule targets an artifact that does not exist yet and must not be treated as pass. |

## Diagnostic Status Model

| Status | Meaning |
| --- | --- |
| `not_started` | Diagnostic has not been evaluated. |
| `running_future` | Reserved for future executable diagnostics. |
| `passed` | Rule passed without warnings. |
| `passed_with_warnings` | Rule passed but produced review notes. |
| `failed` | Rule failed. |
| `failed_critical` | Rule failed with a critical boundary violation. |
| `skipped_not_applicable` | Rule was skipped because it does not apply. |
| `skipped_future_artifact_missing` | Rule targets a future artifact that is intentionally absent. |
| `superseded` | Rule has been replaced by a newer rule. |
| `needs_owner_review` | Rule outcome requires human source-truth review. |

## SkillDiagnosticRule

Documentation-only pseudo-record. Do not convert this table into TypeScript, SQL, JSON schema, scripts, CI, storage, workers, or runtime behavior in RP-SKILLS-20.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable diagnostic rule identifier. | `diag_rule_001` |
| `rule_key` | Required | Canonical machine-readable rule key. | `duplicate_skill_key` |
| `rule_name` | Required | Human-readable rule name. | `Duplicate skill key detection` |
| `category` | Required | Diagnostic scope category. | `skill_taxonomy_validation` |
| `severity_on_fail` | Required | Severity to assign on failure. | `fail` |
| `applies_to_layers` | Required | Static validation levels the rule applies to. | `docs_only_static, docs_plus_types_static_future` |
| `input_paths` | Required | Files or directories to inspect. | `docs/creative-skills/skill-taxonomy-and-family-catalog-contract.md` |
| `required_patterns` | Optional | Required strings, headings, fields, or structures. | `skill_family, skill_key, SkillAlias` |
| `forbidden_patterns` | Optional | Forbidden strings, files, commands, or runtime unlock language. | `provider call, package install, migration` |
| `expected_outputs` | Required | Expected diagnostic output shape or note. | `one result per duplicate key group` |
| `pass_condition` | Required | Condition that makes the rule pass. | `No duplicate canonical skill keys exist.` |
| `fail_condition` | Required | Condition that makes the rule fail. | `A canonical skill key appears in two active records.` |
| `warning_condition` | Optional | Condition that produces a warning. | `Alias is similar but not identical to canonical key.` |
| `remediation_guidance` | Required | Human action to repair failure. | `Merge aliases or rename one skill key before type work.` |
| `owner_doc` | Required | Source-truth owner document. | `skill-taxonomy-and-family-catalog-contract.md` |
| `status` | Required | Rule lifecycle status. | `not_started` |
| `metadata_json` | Optional | Documentation-only notes for future implementers. | `{ "milestone": "RP-SKILLS-20" }` |

## SkillDiagnosticResult

Documentation-only pseudo-record. This is the future shape of a diagnostic result, not executable output.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable result identifier. | `diag_result_001` |
| `rule_key` | Required | Rule key that produced the result. | `missing_planning_contract` |
| `run_id` | Required | Diagnostic run identifier. | `diag_run_2026_06_24_docs` |
| `status` | Required | Diagnostic status. | `failed` |
| `severity` | Required | Diagnostic severity. | `fail` |
| `checked_paths` | Required | Paths inspected by the rule. | `docs/creative-skills/skill-route-and-plan-assembly-contract.md` |
| `matched_evidence` | Optional | Evidence found. | `Skill route section exists.` |
| `missing_evidence` | Optional | Evidence missing. | `No planning contract attachment table found.` |
| `failure_summary` | Optional | Short failure summary. | `Route lacks required plan record set.` |
| `warning_summary` | Optional | Short warning summary. | `Future schema field is pending.` |
| `remediation_guidance` | Required | Suggested repair. | `Add contract attachment coverage before route implementation.` |
| `created_at` | Required | Future timestamp for diagnostic output. | `2026-06-24T00:00:00Z` |
| `metadata_json` | Optional | Documentation-only metadata. | `{ "source": "docs_only_static" }` |

## SkillDiagnosticRun

Documentation-only pseudo-record. This is not a script output in RP-SKILLS-20.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable run identifier. | `diag_run_2026_06_24_docs` |
| `run_scope` | Required | Scope of diagnostic run. | `creative_skills_docs_only` |
| `run_reason` | Required | Why diagnostics ran. | `RP-SKILLS-20 acceptance check` |
| `target_paths` | Required | Paths included in the run. | `docs/creative-skills/` |
| `rule_keys` | Required | Rules requested. | `duplicate_skill_key, missing_planning_contract` |
| `passed_count` | Required | Count of passing results. | `18` |
| `warning_count` | Required | Count of warning results. | `2` |
| `failed_count` | Required | Count of failed results. | `1` |
| `critical_failed_count` | Required | Count of critical failures. | `0` |
| `skipped_count` | Required | Count of skipped results. | `4` |
| `highest_severity` | Required | Highest observed severity. | `fail` |
| `result_ids` | Required | Linked result identifiers. | `diag_result_001, diag_result_002` |
| `can_continue` | Required | Whether next milestone may proceed. | `false` |
| `blocked_next_steps` | Optional | Next steps blocked by the run. | `TypeScript contract generation` |
| `created_by` | Required | Future actor that created the run. | `static_docs_validation` |
| `created_at` | Required | Future timestamp for diagnostic output. | `2026-06-24T00:00:00Z` |
| `metadata_json` | Optional | Documentation-only metadata. | `{ "mode": "docs_only_static" }` |

## Docs Completeness Diagnostics

Docs completeness checks should verify that each Creative Skill contract includes:

- Purpose and strict non-runtime boundary.
- Doctrine and a planning-first principle.
- Inheritance or coordination references to the correct prior contracts.
- Required input context.
- Use and avoid rules where applicable.
- Pseudo-record tables with description, required/optional status, and examples.
- Credit/approval behavior.
- Source/proof safety behavior where applicable.
- StoryTiming coordination.
- QA and revision behavior.
- Examples and anti-patterns.
- Duplicate/overlap notes.
- Missing-file notes when requested docs are absent.
- Next RP-SKILLS handoff.

Failure example: `RP-SKILLS-07` omits tracking/masking/occlusion safety.

## Source-of-truth Integrity Diagnostics

Source-of-truth checks should compare new docs against:

- `source-of-truth-map.md`
- `duplicate-lane-checklist.md`
- Prior RP-SKILLS contracts.
- Existing repo owners such as `src/lib/planner-validation.ts`, `src/lib/professional-editing-ontology.ts`, `src/lib/prompt-builders.ts`, `src/lib/workflow-profiles.ts`, `src/types/`, StoryTiming docs/services, credit/approval docs, production readiness docs, and tool-calling diagnostics docs/scripts.

Failure example: a docs-only contract defines a new provider router rather than referencing provider prompt owners.

## Skill Taxonomy Diagnostics

Skill taxonomy checks should verify:

- Canonical `skill_family` values.
- Canonical `skill_key` values.
- Alias ownership.
- No duplicate skill keys.
- No duplicate skill families with conflicting meanings.
- Relationships to planning contracts.
- Status, recommendation, complexity, credit tendency, and approval tendency vocabulary.
- Separation between future Creative Skill catalog records and existing signature system catalog records.

Failure example: `three_d_visual` and `3d_visual` both appear as active canonical keys.

## Planning Contract Diagnostics

Planning contract checks should verify:

- Every future skill route maps to an approved planning contract.
- A skill name alone never authorizes execution.
- When-to-use and when-to-avoid rules exist.
- Timing, composition, audio, tool/provider, credit/approval, QA, and revision envelopes are covered where relevant.
- Premium or generated skills have approval/credit hints.
- Lower-cost alternatives exist where appropriate.

Failure example: a premium generated music route appears with no `SoundMusicSkillPlan` or approval group.

## Pseudo-record Diagnostics

Pseudo-record checks should verify:

- Tables are marked documentation-only.
- Fields have descriptions.
- Fields have required/optional status.
- Fields have example values.
- Pseudo-record names do not collide across contracts unless intentionally inherited.
- Pseudo-records are not represented as TypeScript, SQL, JSON schema, migrations, scripts, or runtime contracts before the correct milestone.

Failure example: `SkillRouteUserVisibleSummary` is documented but future type work omits its approval caveat field.

## Checklist Diagnostics

Checklist checks should verify:

- Each contract checklist exists when expected.
- It names inheritance and source truths.
- It includes required checks, pass conditions, and fail cases.
- It blocks runtime actions in docs-only prompts.
- It mentions TypeScript, migrations, packages, Supabase, providers, workers, and app behavior as forbidden when scoped as docs-only.

Failure example: a checklist allows provider calls during a planning-only prompt.

## Prompt Duplication Diagnostics

Prompt duplication checks should detect:

- A future prompt recreating an existing owner lane.
- A prompt adding parallel provider, tool, worker, QA, schema, prompt, or UI architecture.
- Repeating RP-SKILLS content without referencing source-truth owners.
- Implementing RP-SKILLS-21 or later scope inside RP-SKILLS-20.

Failure example: a prompt adds `skill-provider-router.ts` before taxonomy, type, route, credit, QA, and diagnostics milestones are approved.

## Runtime Unlock Diagnostics

Runtime unlock checks should flag:

- New source files under `src/`, `server/`, `scripts/validation/`, worker folders, or UI folders during docs-only prompts.
- Wording that says diagnostics execute providers, generate assets, reserve credits, render previews, process media, start browser runtime, or run workers.
- Any command that starts a dev server, provider flow, Supabase, SQL, worker, render/export, QA runtime, validation runtime, diagnostics runtime, browser/WebGL/canvas/3D runtime, audio runtime, caption runtime, or app runtime.

Failure example: a docs-only prompt adds a diagnostics script and package command.

## Package Mutation Diagnostics

Package mutation checks should flag:

- Changes to `package.json`.
- Changes to lockfiles.
- Dependency installs.
- New scripts in package files.
- Generated package metadata.

Failure example: RP-SKILLS-20 adds `creative-skills:diagnostics` to `package.json`.

## Migration Timing Diagnostics

Migration timing checks should flag:

- New Supabase migrations before the schema milestone.
- SQL execution.
- Schema files, RLS policies, or table definitions added from docs-only prompts.
- Migration language that implies immediate deployment.

Failure example: a prompt creates `edit_plan_skill_diagnostics` before RP-SKILLS-21 type work and a later schema prompt.

## TypeScript Contract Diagnostics Future

Future TypeScript diagnostics should compare approved docs against future interfaces and ensure:

- All required pseudo-records have approved type counterparts only after the type milestone.
- No type introduces execution behavior.
- No type omits approval, credit, source/proof, StoryTiming, or QA fields required by docs.
- Future type names do not conflict with existing `src/types/` surfaces.

This is `future_pending` in RP-SKILLS-20.

## Schema Diagnostics Future

Future schema diagnostics should verify:

- Schema fields map to approved TypeScript and docs contracts.
- Credit, approval, QA, route, and diagnostics records do not bypass existing owners.
- RLS, audit, and event behavior is reconciled before migration.
- Missing future schema artifacts are not treated as passed now.

This is `future_pending` in RP-SKILLS-20.

## Mock Fixture Diagnostics Future

Future fixture diagnostics should verify representative fixtures for:

- Passing docs-only plans.
- Warning plans.
- Blocking plans.
- Premium approval cases.
- Lower-cost alternatives.
- Source/proof safety failures.
- StoryTiming conflicts.
- Runtime boundary violations.

This is `future_pending` in RP-SKILLS-20.

## Planner Diagnostics Future

Future planner diagnostics should verify that planner output includes the complete chain:

User intent -> opportunities -> concepts -> skill candidates -> routes -> required plan records -> StoryTiming -> credit/approval -> QA -> user-visible summary -> revision links.

Failure example: planner emits a route with no credit estimate and no QA result.

## Credit And Approval Diagnostics

Credit and approval checks should verify:

- Premium, generated, provider-backed, custom music, 3D, browser/app capture, and other credit-bearing work is itemized.
- Approval groups have user-facing copy.
- Lower-cost alternatives are present when a high-cost option is recommended.
- No generation happens before approval.
- Approval is not treated as credit spend, reservation, wallet mutation, ledger mutation, billing, or Stripe behavior.

Failure example: a route says "generate custom music now" without estimate, approval group, or no-generation-before-approval gate.

## Source/Proof Safety Diagnostics

Source/proof checks should verify:

- No invented exact websites, dashboards, UI labels, prices, metrics, names, dates, or evidence pages.
- Source status and proof level are explicit.
- Redaction and privacy are planned where needed.
- Reference DNA is used as inspiration only, not copied.
- Rights/provenance is recorded for media, music, models, stock, browser/app visuals, and generated assets.

Failure example: B-roll claims a product grew 42 percent without source confirmation.

## StoryTiming Diagnostics

StoryTiming checks should verify:

- Every dense moment has one clear primary focus unless a deliberate multi-layer design moment is planned.
- Captions, overlays, graphics, motion, transitions, B-roll, 3D, Real Motion, Stroke Motion, browser/app visuals, music, SFX, ambience, and silence are coordinated.
- Speech protection, ducking, SFX permission, transition permission, and safe zones are present.
- Conflicts have resolution actions.

Failure example: caption emphasis, SFX hit, 3D hero reveal, and browser overlay all peak on the same word without a focus budget.

## QA Diagnostics

QA checks should verify:

- RP-SKILLS-19 planning QA coverage exists before user-facing plan display.
- Blocking issues are not hidden.
- Warnings are not treated as clean passes.
- Repair recommendations are linked to the affected records.
- Runtime boundary issues are critical.
- Revision readiness is recorded.

Failure example: a premium route proceeds to approval without QA report or user-visible blocker copy.

## Diagnostic Rule Set Overview

| Rule key | Category | Severity on fail | Owner doc | Expected failure signal |
| --- | --- | --- | --- | --- |
| `duplicate_skill_key` | `skill_taxonomy_validation` | `fail` | `skill-taxonomy-and-family-catalog-contract.md` | Same canonical key appears twice. |
| `duplicate_skill_family` | `skill_taxonomy_validation` | `fail` | `skill-taxonomy-and-family-catalog-contract.md` | Two families define the same domain. |
| `missing_planning_contract` | `planning_contract_validation` | `fail` | `skill-planning-contracts.md` | Skill route has no contract. |
| `missing_when_to_use_rule` | `planning_contract_validation` | `warning` | Specialized skill contracts | Contract lacks use rules. |
| `missing_when_to_avoid_rule` | `planning_contract_validation` | `warning` | Specialized skill contracts | Contract lacks avoid rules. |
| `premium_without_credit_approval_hint` | `credit_approval_gate_validation` | `fail` | `skill-credit-and-approval-planning-contract.md` | Premium skill lacks approval/credit hint. |
| `non_canonical_skill_key` | `skill_taxonomy_validation` | `fail` | `skill-taxonomy-and-family-catalog-contract.md` | Skill key is not in the canonical catalog. |
| `alias_conflict` | `skill_taxonomy_validation` | `warning` | `skill-taxonomy-and-family-catalog-contract.md` | Alias points to two canonical skills. |
| `prompt_duplication` | `prompt_duplication_detection` | `fail` | `duplicate-lane-checklist.md` | Prompt creates parallel owner lane. |
| `docs_completeness` | `docs_completeness` | `fail` | `README.md` | Required doc section is missing. |
| `pseudo_record_completeness` | `pseudo_record_validation` | `fail` | Contract-specific docs | Pseudo-record field lacks example. |
| `runtime_unlock_detection` | `runtime_unlock_detection` | `critical_fail` | `implementation-handoff.md` | Docs-only prompt adds runtime behavior. |
| `provider_tool_execution_leakage` | `provider_tool_boundary_validation` | `critical_fail` | `open-source-tool-registry.md` and source-truth map | Provider call appears in planning prompt. |
| `package_mutation_detection` | `package_mutation_detection` | `critical_fail` | `package.json` source truth | Package file changes in docs-only prompt. |
| `migration_timing_check` | `migration_timing_validation` | `critical_fail` | Supabase schema owners | Migration appears before schema milestone. |
| `Supabase_boundary_check` | `Supabase_boundary_validation` | `critical_fail` | Supabase owners | CLI, SQL, or schema execution appears. |
| `credit_approval_gate_check` | `credit_approval_gate_validation` | `fail` | `skill-credit-and-approval-planning-contract.md` | Credit-bearing route lacks approval group. |
| `no_generation_before_approval_check` | `credit_approval_gate_validation` | `critical_fail` | `skill-credit-and-approval-planning-contract.md` | Generation begins before approval. |
| `source_proof_safety_check` | `source_proof_safety_validation` | `fail` | Source/proof sections in contracts | Source-sensitive claim lacks proof status. |
| `StoryTiming_coordination_check` | `StoryTiming_validation_future` | `fail` | `storytiming-coordination-contract.md` | Skill conflicts lack resolution. |
| `edit_preference_snapshot_check` | `planner_validation_future` | `warning` | `edit-preference-creative-direction-contract.md` | Plan ignores direct user preference. |
| `QA_contract_coverage_check` | `QA_contract_validation` | `fail` | `skill-qa-and-validation-contract.md` | Plan lacks QA result. |
| `CI_static_boundary_check` | `CI_static_boundary_validation` | `critical_fail` | Future CI owner | CI would run providers or media processing. |

## Static Validation Command Boundaries

Allowed command types for docs-only prompts:

- `find` and `rg` searches.
- File reads such as `sed`, `nl`, `wc`, and `git diff --check`.
- `npm run lint` when it does not rewrite files.
- Direct ASCII and trailing-whitespace checks.
- Git status or diff inspection.

Forbidden command types for docs-only prompts:

- Package installs or package mutations.
- Formatters or generators that rewrite tracked files outside the approved docs.
- Supabase CLI, SQL, migrations, database connections, or RLS work.
- Provider calls, model calls, generation calls, render/export, media processing, browser capture, Playwright execution, WebGL/canvas/3D runtime, audio generation, caption rendering, workers, jobs, leases, QA runtime, validation runtime, diagnostics runtime, app runtime, or dev servers.
- CI workflow creation or execution unless a later prompt explicitly authorizes it.

## Future CI/static Validation Boundary

Future CI checks should be deterministic and static. They may inspect approved docs, types, schemas, fixtures, and planner outputs only after those artifacts exist.

Future CI checks must not:

- Call providers.
- Process user media.
- Generate assets.
- Read secrets.
- Connect to Supabase.
- Mutate packages.
- Dispatch workers.
- Reserve or spend credits.
- Run app runtime.

Missing future artifacts should produce `skipped_future_artifact_missing` or `future_pending`, not `passed`.

## Examples

| Example | Diagnostic category | Issue summary | Severity | Recommended fix |
| --- | --- | --- | --- | --- |
| 1 | `skill_taxonomy_validation` | `animated_caption` and `caption_motion` both claim the same canonical skill. | `fail` | Choose one canonical key and map the other as alias. |
| 2 | `planning_contract_validation` | A route names 3D visual work without a `ThreeDVisualSkillPlan`. | `fail` | Attach the 3D planning contract or reject the candidate. |
| 3 | `credit_approval_gate_validation` | Custom generated music has no approval group. | `fail` | Add estimate item, approval copy, and lower-cost option. |
| 4 | `runtime_unlock_detection` | Docs-only prompt adds a worker execution path. | `critical_fail` | Remove runtime work and restore docs-only scope. |
| 5 | `package_mutation_detection` | `package.json` adds a diagnostics command in a docs-only prompt. | `critical_fail` | Revert package mutation and document future script boundary. |
| 6 | `source_proof_safety_validation` | Browser overlay invents a dashboard KPI. | `fail` | Mark proof as unconfirmed or request source confirmation. |
| 7 | `StoryTiming_validation_future` | Caption, overlay, SFX, and 3D reveal all peak together. | `fail` | Assign one primary focus and move support layers. |
| 8 | `QA_contract_validation` | User-facing summary hides a blocking source/proof issue. | `fail` | Add QA result and user-visible blocker copy. |
| 9 | `prompt_duplication_detection` | Prompt creates a second tool registry for skills. | `fail` | Reference existing tool registry owners instead. |
| 10 | `migration_timing_validation` | Migration appears before TypeScript contracts and schema milestone. | `critical_fail` | Remove migration and defer to schema prompt. |
| 11 | `provider_tool_boundary_validation` | Skill route states a provider has been selected and called. | `critical_fail` | Reword as future candidate metadata only. |
| 12 | `docs_completeness` | Checklist lacks fail cases for installs and runtime unlocks. | `fail` | Add forbidden runtime/package fail cases. |
| 13 | `pseudo_record_validation` | Pseudo-record table omits examples. | `fail` | Add examples for every field. |
| 14 | `CI_static_boundary_validation` | Future CI proposal would run media analysis and provider probes. | `critical_fail` | Limit CI to static checks over approved artifacts. |

## Anti-patterns

- Treating diagnostics as permission to implement scripts in a docs-only milestone.
- Treating `future_pending` as pass.
- Checking only headings while ignoring source-truth duplication.
- Accepting skill-name-only execution.
- Allowing premium or generated skills without approval and credit hints.
- Adding package scripts for diagnostics before the package/script milestone.
- Adding migrations before TypeScript and schema readiness.
- Running Supabase to prove a docs-only contract.
- Running providers, workers, render/export, browser, media, audio, caption, 3D, QA, validation, or diagnostics runtime.
- Creating a new skill catalog that competes with RP-SKILLS-13.
- Creating a new QA system that competes with RP-SKILLS-19.
- Creating a new credit approval path that competes with RP-SKILLS-18.

## Future Implementation Notes

Future implementation should proceed only after explicit approval and source-truth reconciliation:

1. Convert selected pseudo-records to TypeScript contracts in RP-SKILLS-21 or later.
2. Add static TypeScript validation only after contracts exist.
3. Add fixtures only after types are stable.
4. Add schema readiness checks only after schema prompts approve migrations.
5. Add planner diagnostics only after planner output exists.
6. Add CI checks only after static checks are deterministic and safe.
7. Add runtime gates only after approval, credit, QA, and worker orchestration are implemented.

No future implementation should read this document as permission to add runtime code now.

## Relationship To Existing Validation / Diagnostics

Existing owners already include:

- `src/lib/planner-validation.ts`
- `docs/storytiming-qa-plan.md`
- `docs/caption-cut-timing-integration.md`
- `docs/music-sfx-timing-integration.md`
- `docs/production-readiness-validation-plan.md`
- `docs/production-e2e-readiness-blocker-policy.md`
- `scripts/validation/*.mjs`
- Package scripts such as `tool-calling:diagnostics`
- Prior RP-SKILLS QA, credit, route, resolver, taxonomy, preference, StoryTiming, and source/proof contracts.

RP-SKILLS-20 does not replace those owners. It documents the Creative Skill static validation lane that future prompts must reconcile with those owners before adding scripts, CI, schemas, or runtime behavior.

## Duplicate And Overlap Notes

Future prompts must not duplicate:

- Existing tool-calling diagnostics scripts.
- Existing package diagnostics scripts.
- Existing planner validation.
- Existing StoryTiming QA.
- Existing caption/cut timing QA.
- Existing music/SFX timing QA.
- Existing credit approval gates.
- Existing source/proof safety docs.
- Existing production readiness and E2E blocker policies.
- Existing RP-SKILLS contracts and checklists.

The current overlap shows diagnostics language already exists in tool-calling and production readiness areas. Creative Skill diagnostics should remain a docs-only planning/static validation layer until a later prompt explicitly approves implementation.

## Missing-file Notes

Current repo inspection found:

- `audio-library-and-licensing.md` exists.
- `soundsync-music-intelligence.md` is missing.
- `music-reference-dna.md` is missing.
- `lyria-music-generation-plan.md` is missing.
- `browser-app-capture-planning.md` is missing.
- `browser-capture-settings-catalog.md` is missing.
- `src/lib/browser-capture-planner.ts` is missing.

Missing future artifacts should be recorded honestly and treated as `future_pending` or `skipped_future_artifact_missing`, not passed.

## RP-SKILLS-21 Handoff

Recommended next prompt:

`RP-SKILLS-21 - TypeScript Creative Skill Contracts`

Allowed scope for `RP-SKILLS-21` should remain approval-gated and source-truth-led. It may define TypeScript contract planning only if explicitly authorized, but must still avoid runtime behavior, migrations, Supabase execution, package installs, providers, workers, render/export, UI, diagnostics runtime, validation runtime, QA runtime, browser/WebGL/canvas/3D runtime, audio/caption/media runtime, and app behavior unless a later prompt separately approves those layers.
