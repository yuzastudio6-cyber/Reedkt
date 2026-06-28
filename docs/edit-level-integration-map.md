# Edit Level Integration Map

This map documents how future Edit Level architecture should connect to existing ReeditPro surfaces. It also records missing requested legacy files without creating placeholders.

## Future Integration Points

| Area | Future connection |
| --- | --- |
| Project setup | Capture chosen level and future recommendation metadata while preserving current `basic | pro | premium` compatibility. |
| ProjectEditSession | Store the selected level, resolved profile, profile version, and degraded capability notices as session metadata in a future persistence milestone. |
| Edit Brief workspace | Apply Edit Brief optional/recommended/strongly recommended policy by level. |
| Marker Chat context package | Include level profile, source understanding depth, Edit Brief markers, Preference DNA summary, and Qwen routing policy. |
| Edit Preference / DNA resolver | Apply safe hints, strong application, or deep DNA application by level. |
| Source Video Understanding Package | Select metadata-only, key-moment, or scene-level source understanding policy. |
| Qwen 3.7 runtime | Select standard, deep, or multi-pass reasoning policy. |
| Qwen2.5-VL runtime | Select targeted, key-moment, or scene-level visual policy. |
| Media extraction / speech / audio / graphic tools | Select transcript, SoundSync, media extraction, and graphic/design depth by level. |
| QA services | Select Normal, Premium, or Ultra Premium QA profile. |
| Plan Bridge | Pass profile metadata into edit plan, estimate, approval, and future worker contracts. |
| Credits | Use credit estimate only metadata until future credit gates exist. |
| Render/export | Use render budget future metadata until future render/export gates exist. |
| Supabase persistence | Future migrations should persist level/profile metadata in approved snapshots only after runtime types exist. |
| RP-EDITLEVEL-03 mock access boundary | Mock repository, MockDatabase collections, disabled Supabase skeleton, mock local planning-domain routes, and browser-safe client helpers are available for future UI milestones. |
| Internal testing | Verify card visibility, recommendation display, profile persistence, tool budget, QA profile, source policy, and no credit spend on selection. |

## Existing Surfaces To Reuse

Current planning should reuse `src/types/reeditpro.ts`, existing edit-level UI cards, `src/types/edit-brief.ts`, `src/types/footage-prep.ts`, `src/lib/planning/*`, tool strategy, render strategy, QA planner, credit estimator surfaces, and the RP-EDITLEVEL-03 mock repository/API/client layer when later runtime or UI milestones begin.

## Missing Requested Files

The following requested files were not present during planning and should be reported rather than recreated as placeholders:

- `src/types/project-edit-session.ts`
- `src/types/project-edit-brief.ts`
- `src/types/edit-preference.ts`
- `src/types/edit-plan-repository.ts`
- `src/types/project-source-video.ts`
- `src/types/qwen-runtime-adapter.ts`
- `src/types/qwen-marker-chat-runtime.ts`
- `docs/video-context-qwen25vl-tool-selection.md`
- `docs/video-context-updated-tool-routing-map.md`
- `docs/qwen25vl-visual-understanding-role.md`
- `docs/qwen37-vs-qwen25vl-role-split.md`
- `docs/project-edit-brief-e2e-audit.md`
- `docs/project-source-video-brief-playback.md`
- several requested `docs/reeditpro-*` roadmap/status docs.

## Boundary

No runtime implementation is added here. RP-EDITLEVEL-03 adds mock-only access surfaces, not production persistence or live UI/planner behavior.
