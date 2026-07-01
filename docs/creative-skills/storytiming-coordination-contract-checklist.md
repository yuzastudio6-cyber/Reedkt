# StoryTiming Coordination Contract Checklist

Use this checklist for future StoryTiming coordination prompts. This is documentation only and must not be converted into runtime code, TypeScript, SQL, JSON schema, migrations, prompt execution, orchestration runtime, workers, providers, render/export, UI, package changes, Supabase work, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| All prior RP-SKILLS contracts referenced | Universal, transition, overlay/compositing, graphic design, motion design, 3D, B-roll, caption, and Sound/Music contracts are referenced. |
| Primary focus present | Every coordinated window has a primary focus or an explicitly planned multi-layer design focus. |
| Secondary support present | Secondary supports are named and do not steal attention from the primary focus. |
| Visual density present | Visual density level is declared and aligned to preference/workflow. |
| Audio density present | Audio density level is declared and protects speech/captions. |
| Time windows present | Story, speech, caption, transition, B-roll, overlay, graphic, motion, 3D, Stroke Motion, Real Motion, music, SFX, silence, hero, restraint, or QA-sensitive windows are declared where relevant. |
| Caption zone/fallback zone present | Caption and fallback caption zones are planned for conflicts. |
| Overlay/graphic/3D/B-roll zones coordinated | Spatial zones are coordinated and safe areas are respected. |
| Speaker/product/action safety present | Face, mouth, eyes, gesture, product, action, source, and redaction zones are protected. |
| Transition permission present | Transition permission is explicit. |
| SFX permission present | SFX permission is explicit when SFX exists. |
| Music ducking/speech protection present | Ducking and speech protection windows are present where speech exists. |
| Conflict detection present | Conflict types are named. |
| Conflict resolution action present | Resolution actions are named and tied to the conflict. |
| Credit/approval behavior present | Premium/generated/heavy skill approvals and credit impacts are listed. |
| QA checks present | Focus, density, captions, speech, safe zones, collisions, source safety, repetitions, preference, approval, and credit QA are present. |
| Revision impact present | Revision effects on skill plans, timing windows, credit, and approval are documented. |
| Runtime actions avoided | The prompt avoids runtime code, TypeScript, migrations, installs, package mutations, UI, providers, workers, Supabase, orchestration, render/export, media/audio/caption/browser/WebGL/canvas/3D runtime, and app behavior. |

## Required Pseudo-record Coverage

Future StoryTiming prompts should cover these documentation-only pseudo-records or explain why a record is out of scope:

- `StoryTimingWindow`
- `FocusDensityBudget`
- `StoryTimingCoordinationPlan`
- `StoryTimingConflictResolutionPlan`
- `StoryTimingDensityBudgetPlan`

These pseudo-records must remain Markdown documentation unless a later explicitly approved implementation prompt creates real contracts.

## Fail The Prompt If

- StoryTiming has no primary focus.
- All skills are allowed at once without coordination.
- Captions, graphics, 3D, B-roll, overlays, or lower thirds collide without resolution.
- Speech protection is missing.
- SFX permission is missing where SFX exists.
- Music ducking is missing where speech exists.
- Premium skill lacks approval/credit handling.
- Generated skill is treated as executed before approval.
- Source/evidence safety is ignored.
- Visual density ignores user preference.
- Audio density ignores caption/speech needs.
- Face, mouth, eyes, product, action, source, or redaction zones are unprotected.
- Transition hides important expression, captions, speech, or product action.
- B-roll hides emotional speaker moments without a reason.
- 3D/Real Motion/Stroke Motion compete in the same window without role separation.
- Runtime code is added.
- TypeScript is added before the type-contract milestone.
- Migrations are added before the schema milestone.
- Dependencies are installed.
- Package files are mutated.
- Orchestration, render/export, provider, worker, Supabase, media/audio/caption/browser/WebGL/canvas/3D runtime, generation runtime, or app behavior is unlocked.

## Future Prompt Footer

Future StoryTiming prompts should end by stating:

- Public API changes: none, unless explicitly approved later.
- TypeScript contract changes: none, unless explicitly approved later.
- Database/Supabase changes: none, unless explicitly approved later.
- Runtime/provider/package/UI changes: none, unless explicitly approved later.
- Runtime orchestration, render/export, providers, workers, Supabase, media processing, audio generation, SFX generation, music generation, caption rendering, browser/capture/media runtime, WebGL/canvas/3D runtime, and app behavior remain forbidden unless explicitly authorized in a later implementation prompt.
