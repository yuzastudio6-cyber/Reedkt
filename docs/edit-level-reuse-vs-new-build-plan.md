# Edit Level Reuse Vs New Build Plan

## Decision Table

| Existing surface | Reuse? | Wrap? | Build new? | Reason | Risk |
| --- | --- | --- | --- | --- | --- |
| Project Edit Session setup (`InlineEditLevelCard`, `InlinePlanningContextCard`) | Yes | Yes | No | Existing chat-native UX already asks and confirms edit level. | Label migration can confuse current tests. |
| `PlannerInput.editLevel` and `CompiledEditingIntent.resolvedSettings.editLevel` | Yes | Yes | No in RP-EDITLEVEL-00 | Existing planner wiring is broad. | Direct type rename is high risk. |
| Edit Brief plan bridge (`src/types/edit-brief.ts`, `src/lib/planning/*`) | Yes | Yes | No | Existing optional brief and planning context are correct integration points. | Needs level-aware recommended/strongly recommended semantics. |
| Edit Preference/DNA resolver | Partial | Yes | Yes | Reference DNA exists, but dedicated Edit Preference/DNA source was not found. | Source-of-truth ambiguity. |
| Qwen model routing | Partial | Yes | Yes | Generation model routing exists; Qwen runtime docs/types requested in prompt are missing. | Backend/runtime gate required. |
| Qwen2.5-VL video context routing | Partial | Yes | Yes | Video understanding exists as mock planning; dedicated Qwen2.5-VL routing docs are missing. | Real visual analysis not implemented. |
| Tool-stack registry and tool strategy | Yes | Yes | No | Existing tool strategy and registry docs already separate controlled tools from AI generation. | Need level-aware tool budget. |
| QA services | Yes | Yes | No | Existing QA and validation check tier/model rules. | Must preserve no-Veo and no-default-1080P rules. |
| Credit estimate surfaces | Yes | Yes | No | Existing credit estimator already varies by level. | Product values need confirmation. |

## Expected New Pieces

- `EditLevelProfile`
- `EditLevelResolver`
- `EditLevelToolBudget`
- `EditLevelQwenProfile`
- `EditLevelQAProfile`
- `EditLevelEstimateProfile`
- `EditLevel UI recommendation model`

RP-EDITLEVEL-02 adds the mock-safe types, deterministic profiles, mappers, contracts, scenarios, and orchestrator. RP-EDITLEVEL-03 adds the mock repository, MockDatabase collections, disabled Supabase skeleton, mock local planning-domain API routes, browser-safe client wrapper, scenarios, and smokes. RP-EDITLEVEL-04 reuses those outputs for visible UI Cards + Recommendation while preserving current runtime values. RP-EDITLEVEL-05 adds the mock-safe Level-Aware Tool Capability Router before any real route, migration, provider call, media worker, render/export, or credit execution work. RP-EDITLEVEL-06 should route source video understanding depth by level next.
