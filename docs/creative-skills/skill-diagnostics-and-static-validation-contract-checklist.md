# Skill Diagnostics And Static Validation Contract Checklist

Use this checklist for future Creative Skill diagnostics and static validation prompts. It is documentation only and must not create diagnostics scripts, validation runtime, CI workflows, TypeScript contracts, SQL, migrations, package changes, UI, providers, workers, render/export, Supabase work, QA runtime, browser/WebGL/canvas/3D runtime, audio/caption/media runtime, or app behavior.

## Required Checks

| Check | What to verify | Pass condition |
| --- | --- | --- |
| Diagnostic category identified | The rule names the relevant category. | Uses categories such as `docs_completeness`, `skill_taxonomy_validation`, `planning_contract_validation`, or `runtime_unlock_detection`. |
| Validation level identified | The rule names the current or future validation layer. | Uses `docs_only_static`, `docs_plus_types_static_future`, `docs_types_schema_static_future`, `mock_fixture_static_future`, `planner_static_future`, `CI_gate_future`, or `runtime_gate_future`. |
| Target path identified | The rule says what it inspects. | Target paths point to approved docs, future types, future schemas, future fixtures, or future planner outputs. |
| Required pattern described | Required headings, fields, records, or source truths are explicit. | The rule can explain what evidence must exist. |
| Forbidden pattern described | Runtime, package, migration, Supabase, provider, worker, CI, or app unlocks are forbidden when out of scope. | The rule can explain what evidence must not exist. |
| Pass/fail/warning condition present | Each rule has clear outcomes. | Pass, fail, warning, not-applicable, and future-pending behavior is actionable. |
| Remediation guidance present | Each failure tells the implementer what to fix. | Guidance references the owner doc or source truth. |
| Source-of-truth owner referenced | Rule links to current owner docs or code. | Existing owners are referenced instead of duplicated. |
| Docs completeness checked | Contract docs include required sections. | Purpose, doctrine, boundary, pseudo-records, examples, anti-patterns, missing notes, and handoff are present. |
| Skill taxonomy checked | Canonical skill families and keys are safe. | No duplicate skill keys, duplicate skill families, alias conflicts, or non-canonical keys. |
| Planning contract checked | Every future skill has planning discipline. | Skill name alone never authorizes execution; use/avoid rules and planning contract mapping exist. |
| Pseudo-record checked | Pseudo-records are complete and non-runtime. | Fields include description, required/optional status, examples, and docs-only warnings. |
| Checklist checked | Checklist exists and has fail cases. | Runtime, TypeScript, migration, package, provider, worker, Supabase, and app behavior fail cases are present. |
| Prompt duplication checked | Future prompts avoid duplicate lanes. | Existing source truths are referenced before adding new owners. |
| Runtime unlock checked | Docs-only prompts stay docs-only. | No runtime code, script implementation, worker, provider, render/export, QA runtime, validation runtime, diagnostics runtime, or app runtime. |
| Package mutation checked | Packages remain unchanged in docs-only prompts. | No installs, package scripts, lockfile changes, or package metadata mutations. |
| Migration timing checked | Database work stays future-gated. | No SQL, migrations, Supabase CLI, schema files, or RLS behavior before schema milestone. |
| TypeScript/schema/mock/planner future checks marked future | Missing future artifacts are not treated as pass. | Uses `future_pending` or `skipped_future_artifact_missing`. |
| Credit/approval checked | Premium and generated work stays gated. | Estimate hints, approval groups, lower-cost alternatives, and no-generation-before-approval are required. |
| Source/proof checked | Claims and evidence stay truthful. | Source status, proof level, rights/provenance, and redaction are planned. |
| StoryTiming checked | Time/focus/density conflicts are caught. | Primary focus, secondary support, captions, SFX, music, motion, B-roll, 3D, and safe zones are coordinated. |
| QA coverage checked | RP-SKILLS-19 validation is respected. | Blockers, warnings, repair recommendations, user-visible messages, and revision readiness are covered. |
| Existing diagnostics/script source truths considered | Current validation owners are not duplicated. | `scripts/validation/*.mjs`, package diagnostics scripts, planner validation, production readiness, StoryTiming QA, and prior RP-SKILLS docs are referenced. |
| Runtime actions avoided | The prompt remains documentation only. | No Supabase, providers, workers, render/export, browser/WebGL/canvas/3D runtime, QA runtime, validation runtime, diagnostics runtime, or app runtime is run. |

## Required Pseudo-record Coverage

Future docs or prompts that claim RP-SKILLS-20 coverage must account for these documentation-only pseudo-records:

- `SkillDiagnosticRule`
- `SkillDiagnosticResult`
- `SkillDiagnosticRun`

Do not convert these into TypeScript, SQL, JSON schema, migrations, CI workflows, validation scripts, diagnostics scripts, runtime contracts, storage records, worker specs, provider instructions, or UI behavior unless a later prompt explicitly authorizes implementation after source-truth reconciliation.

## Fail The Prompt If

- Diagnostics implement scripts in this prompt.
- Diagnostics mutate package files.
- Diagnostics create runtime code.
- Diagnostics add TypeScript before the type-contract milestone.
- Diagnostics add migrations before the schema milestone.
- Diagnostics run Supabase, SQL, providers, workers, render/export, QA runtime, validation runtime, diagnostics runtime, browser/WebGL/canvas/3D runtime, audio/caption/media runtime, or app runtime.
- Diagnostics ignore duplicate skill keys.
- Diagnostics ignore duplicate skill families.
- Diagnostics ignore alias conflicts.
- Diagnostics ignore non-canonical skill keys.
- Diagnostics ignore missing planning contracts.
- Diagnostics ignore missing when-to-use rules.
- Diagnostics ignore missing when-to-avoid rules.
- Diagnostics ignore approval/credit hints for premium skills.
- Diagnostics ignore no-generation-before-approval.
- Diagnostics ignore source/proof safety.
- Diagnostics ignore StoryTiming coordination.
- Diagnostics ignore QA coverage.
- Diagnostics ignore prompt duplication.
- Diagnostics ignore provider/tool execution leakage.
- Diagnostics ignore package mutation detection.
- Diagnostics ignore migration timing checks.
- Diagnostics ignore Supabase boundary checks.
- Diagnostics silently treat future-missing artifacts as pass.

## RP-SKILLS-21 Handoff Check

The next docs-only prompt should be:

`RP-SKILLS-21 - TypeScript Creative Skill Contracts`

It should reconcile this diagnostics/static validation contract before any TypeScript surfaces are introduced, and it should not implement runtime, schemas, migrations, package changes, providers, workers, UI, Supabase execution, diagnostics runtime, validation runtime, QA runtime, render/export, media processing, browser/WebGL/canvas/3D runtime, or app behavior.
