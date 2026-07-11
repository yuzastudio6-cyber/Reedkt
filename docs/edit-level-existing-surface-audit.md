# Edit Level Existing Surface Audit

RP-EDITLEVEL-00 is a docs/report/smoke-only audit. It creates no runtime implementation, no API route, no repository, no migration, no UI behavior, no provider call, no media worker, no render/export path, and no credit spend.

## Current Finding

The active repo currently uses `basic | pro | premium` for the main runtime `EditLevel`. The beta product contract for this track uses `Normal | Premium | Ultra Premium`. The naming bridge is audit-only for this milestone:

| Current surface value | Future beta meaning | Status |
| --- | --- | --- |
| `basic` | Normal | Compatibility mapping only; final alias policy is `needs_product_value`. |
| `pro` | Premium | Compatibility mapping only; final migration policy is `needs_product_value`. |
| `premium` | Ultra Premium | Compatibility mapping only; final label policy is `needs_product_value`. |

Normal is not low quality. Every level must produce a professional edit.

## Inventory

| File path | Symbol or UI copy | Current purpose | Level names used | Active UI/runtime/doc | Recommendation | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `src/types/reeditpro.ts` | `export type EditLevel = 'basic' | 'pro' | 'premium'` | Primary planner edit-level type. | Basic, Pro, Premium | Runtime type | Reuse later by wrapping with a resolver; do not change in RP-EDITLEVEL-00. | Direct rename would break many planners and tests. |
| `src/types/edit-quality.ts` | `EditQualityLevel = 'basic' | 'pro' | 'signature' | 'premium_signature'` | Older quality/profile layer for professional edit policy. | Basic, Pro, Signature, Premium Signature | Runtime type | Audit and reconcile later with `EditLevelProfile`. | Naming differs from main `EditLevel`. |
| `src/lib/product-taxonomy.ts` | `editLevelDefinitions` | User-facing level descriptions and routing rules. | Basic, Pro, Premium | Runtime data/UI labels | Reuse as source for future display profile migration. | Current `Pro` does not match future beta label set. |
| `src/components/editor/InlineEditLevelCard.tsx` | "How deep should this edit be?", Basic/Pro/Premium cards | Required chat-native edit-level selection card. | Basic, Pro, Premium | Active UI | Reuse UI structure later; update labels only in future UI milestone. | Runtime behavior must not change in this audit. |
| `src/components/editor/InlinePlanningContextCard.tsx` | Level and model rule summary | Shows chosen level and Veo policy in chat planning context. | Basic, Pro, Premium | Active UI | Reuse, with future copy fed by `EditLevelProfile`. | Current copy is tied to Basic/Pro/Premium policy. |
| `src/components/editor/ChatNativeEditor.tsx` | `editLevel`, `editLevelConfirmed`, `handleEditLevelSelect` | Stores selected level in local state and resets plan/progress when changed. | Basic, Pro, Premium | Active UI/runtime | Audit only; do not modify. | This is approval-critical behavior. |
| `src/lib/demo-scenario-index.ts` and `src/lib/demo-scenarios.ts` | demo scenario `editLevel` | Demo coverage and regression inputs. | Basic, Pro, Premium | Runtime fixtures/tests | Reuse; add Normal/Premium/Ultra fixtures in a later milestone. | Tests expect current values. |
| `src/lib/intent-compiler.ts` | `applyEditLevel`, `buildTierConstraints` | Parses user chat into structured intent and tier constraints. | Basic, Pro, Premium | Runtime planner | Reuse by adding an edit-level resolver later. | User copy and constraints mention current names. |
| `src/lib/professional-editing-ontology.ts` | `defaultForLevels`, `applyLevelRules` | Professional editing defaults by level. | Basic, Pro, Premium | Runtime planner | Reuse; preserve professional baseline rule. | Naming shift could accidentally imply Normal is lower quality. |
| `src/lib/model-routing-policy.ts` | `fallbackModelsByEditLevel` | Model fallback policy for generated assets. | Basic, Pro, Premium | Runtime policy | Reuse constraints; map future labels later. | Veo rules must not regress. |
| `src/lib/provider-router.ts` | `enforceVeoTierRule` and route builders | Enforces Basic/Pro no-Veo and Premium final-fallback-only Veo. | Basic, Pro, Premium | Runtime policy | Reuse; wrap after product naming decision. | High risk if changed before tests. |
| `src/lib/edit-qa-planner.ts` | tier policy checks and fallback actions | QA gates tied to edit level. | Basic, Pro, Premium | Runtime planner | Reuse QA categories; future `EditLevelQAProfile` should feed this. | Must preserve no-primary-Veo and no default 1080P. |
| `src/lib/planner-validation.ts` | validation checks for tier, routing, prompts | Regression-safe plan validation. | Basic, Pro, Premium | Runtime validation | Reuse. | Prompt/route policy must stay snapshot-safe. |
| `src/lib/planner-regression.ts` | Basic/Pro/Premium coverage checks | Regression coverage by level. | Basic, Pro, Premium | Runtime tests/planning | Reuse; later add coverage for future display labels. | Missing migration could leave gaps. |
| `src/lib/credit-estimator.ts` | `editLevelLabels`, tier base credits, fallback allowances | Credit estimate by level, asset count, timing/tool complexity. | Basic, Pro, Premium | Runtime planner | Reuse; future `EditLevelEstimateProfile` should own multipliers. | Credit values need product values. |
| `src/types/footage-prep.ts` | Footage Prep and Source Understanding types | Transcript, scene, silence, retake, quality, hook, CTA, and source understanding map contracts. | No edit-level field yet | Runtime type | Reuse; future level router should choose depth. | Current depth is not level-aware. |
| `docs/reeditpro-production-workflow/*` | Footage Prep, Edit Brief, Edit Cues, DB plan | Current production workflow docs replacing older requested `project-edit-*` docs. | Mostly level-neutral | Docs | Reuse and reference in audit. | Older requested doc paths are missing. |
| `src/types/edit-brief.ts` and `src/components/editor/edit-brief/*` | Edit Brief optional direction | Captures goal, audience, platform, style, pacing, captions, music, B-roll, assets, brand notes. | No level policy yet | Active local/mock UI/type | Reuse; future profile controls optional/recommended/strongly recommended policy. | Current UI treats brief as optional. |
| `src/lib/planning/build-planning-context.ts` | Planning context readiness | Pulls Clean Assembly, Source Library, Edit Brief, Edit Cues into planning context. | No level policy yet | Runtime planner | Reuse; future level profile should affect readiness messaging. | Missing level-aware brief policy. |
| `src/types/media.ts` and `src/types/audio-music.ts` | Reference DNA / sound preference records | Reference DNA exists, but dedicated Edit Preference / Preference DNA docs from the prompt are missing in this checkout. | Level-neutral | Runtime type/docs | Audit as partial/replacement surface. | Product "Edit Preference/DNA" needs source-of-truth cleanup. |
| `README.md`, `AGENTS.md`, `edit-quality-standards.md`, `professional-editing-ontology.md` | Product tier rule | State Basic is professional, level controls complexity/cost not quality. | Basic, Pro, Premium | Docs | Reuse product principle. | Future labels must preserve this. |

## Requested Legacy Paths Missing

These requested read/update paths were not present in the active checkout and should not be created as legacy placeholders in RP-EDITLEVEL-00: `docs/reeditpro-tool-stack-integration-registry.md`, `docs/reeditpro-mock-vs-real-board.md`, `docs/reeditpro-milestone-dependency-graph.md`, `docs/reeditpro-cross-workstream-contracts.md`, `docs/reeditpro-agent-model-routing.md`, `docs/model-routing-policy.md`, `docs/project-edit-session-*`, `docs/project-edit-brief-*`, `docs/edit-preference-*`, `docs/preference-dna-*`, `docs/video-context-*`, `docs/qwen*`, and several `src/types/project-edit-*` names.

Actual replacement surfaces found include root policy docs, `docs/reeditpro-production-workflow/*`, `src/types/reeditpro.ts`, `src/types/footage-prep.ts`, `src/types/edit-brief.ts`, `src/lib/planning/*`, `src/lib/model-routing-policy.ts`, and `src/lib/provider-router.ts`.
