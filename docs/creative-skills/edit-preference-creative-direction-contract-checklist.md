# Edit Preference Creative Direction Contract Checklist

Use this checklist for future edit preference creative direction prompts. This is documentation only and must not be converted into runtime code, TypeScript, SQL, JSON schema, migrations, prompt execution, settings UI, preference storage, profile management, orchestration runtime, workers, providers, render/export, UI, package changes, Supabase work, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| Preference source identified | The prompt states whether preference came from current chat, project, workspace/user default, brand brief, Reference DNA, workflow, platform, AI inference, mock data, or unknown context. |
| Priority order respected | Current chat and explicit must-follow/do-not-do instructions outrank lower-priority defaults and Reference DNA. |
| Confidence declared | Preference confidence is one of `explicit`, `strong_inferred`, `weak_inferred`, `default`, or `unknown`. |
| Strength declared | Preference strength is one of `must_follow`, `strong_preference`, `soft_preference`, `experimental_preference`, `avoid`, or `blocked`. |
| Resolved preference snapshot present | A documentation-only `ResolvedEditPreferenceSnapshot` or equivalent summary exists. |
| Conflict resolution documented | Preference conflicts are named, resolved by priority, and flagged for confirmation where needed. |
| Visual density preference present | Visual density is declared or explicitly left to AI judgment. |
| Motion intensity preference present | Motion intensity is declared or explicitly left to AI judgment. |
| Transition energy preference present | Transition energy is declared or explicitly left to AI judgment. |
| Caption preference present | Caption style and caption density are declared or explicitly left to AI judgment. |
| B-roll preference present | B-roll source/density posture is declared or explicitly left to AI judgment. |
| Graphic Design preference present | Graphic Design / VisualExplain posture is declared or explicitly left to AI judgment. |
| 3D/Real Motion preference present | 3D and Real Motion posture is declared or explicitly left to AI judgment. |
| Stroke Motion preference present | Stroke Motion posture is declared or explicitly left to AI judgment. |
| SoundSync/SFX preference present | SoundSync/music and SFX posture are declared or explicitly left to AI judgment. |
| Restraint/wow target present | Restraint level and wow-factor target are declared or explicitly left to AI judgment. |
| Credit sensitivity present | Credit sensitivity is declared or explicitly left to AI estimate. |
| Preferred/blocked skills present | Preferred and blocked skill keys are listed or explicitly empty. |
| Skill scoring influence documented | Preference effects on skill scoring are documented without executing a route. |
| Creative concept influence documented | Preference effects on concept generation are documented without creating prompt/runtime behavior. |
| StoryTiming influence documented | Preference effects on focus, density, hero permission, conflict resolution, and restraint windows are documented. |
| QA checks present | Preference QA checks cover direct instructions, blocked skills, density, motion, captions, B-roll, 3D/Real Motion, SoundSync, credit, wow target, sameness, approval, source/proof safety, and Reference DNA. |
| Revision behavior present | Preference revision behavior distinguishes current edit revisions from future profile/default saving. |
| Runtime actions avoided | The prompt avoids runtime code, TypeScript, migrations, installs, package mutations, UI, providers, workers, Supabase, settings/preference runtime, orchestration, render/export, media/audio/caption/browser/WebGL/canvas/3D runtime, and app behavior. |

## Required Pseudo-record Coverage

Future edit preference prompts should cover these documentation-only pseudo-records or explain why a record is out of scope:

- `EditPreferenceProfile`
- `ResolvedEditPreferenceSnapshot`
- `EditPreferenceConflictResolution`

These pseudo-records must remain Markdown documentation unless a later explicitly approved implementation prompt creates real contracts.

## Required Preference Coverage

Future edit preference prompts should cover:

- Visual density.
- Motion intensity.
- Transition energy.
- Caption style and density.
- B-roll posture.
- Graphic Design / VisualExplain posture.
- 3D posture.
- Real Motion posture.
- Stroke Motion posture.
- SoundSync/music posture.
- SFX posture.
- Restraint level.
- Wow-factor target.
- Credit sensitivity.
- Preferred skill keys.
- Blocked skill keys.
- Must-follow rules.
- Avoid rules.

## Fail The Prompt If

- Preference is treated as a rigid template.
- Preference overrides direct user instruction.
- Preference overrides approval gates.
- Preference overrides credit gates.
- Preference overrides source/proof safety.
- Reference DNA overrides explicit user preference.
- Workflow context overrides current chat instruction.
- Blocked skill is selected without override.
- Preferred skill is forced everywhere.
- Preference snapshot is missing.
- Preference conflict is silently ignored.
- Out-of-this-world preference means effects everywhere.
- Minimal preference means low quality.
- Low-credit preference still produces only premium plans.
- No music, no captions, or no 3D preference is ignored.
- Preference is saved as a default without user intent.
- Runtime code is added.
- TypeScript is added before the type-contract milestone.
- Migrations are added before the schema milestone.
- Dependencies are installed.
- Package files are mutated.
- Settings UI, preference profile storage, preference resolution runtime, orchestration runtime, provider calls, workers, Supabase, render/export, media/audio/caption/browser/WebGL/canvas/3D runtime, generation runtime, or app behavior is unlocked.

## Future Prompt Footer

Future edit preference prompts should end by stating:

- Public API changes: none, unless explicitly approved later.
- TypeScript contract changes: none, unless explicitly approved later.
- Database/Supabase changes: none, unless explicitly approved later.
- Runtime/provider/package/UI changes: none, unless explicitly approved later.
- Preference runtime, settings UI, profile storage, orchestration, render/export, providers, workers, Supabase, media processing, audio generation, SFX generation, music generation, caption rendering, ASR/transcript/translation, browser/capture/media runtime, WebGL/canvas/3D runtime, and app behavior remain forbidden unless explicitly authorized in a later implementation prompt.
