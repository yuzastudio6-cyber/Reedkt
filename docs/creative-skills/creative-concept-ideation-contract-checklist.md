# Creative Concept Ideation Contract Checklist

Use this checklist for future creative concept prompts. This is documentation only and must not be converted into runtime code, TypeScript, SQL, JSON schema, migrations, prompt execution, concept generator runtime, visual analysis runtime, opportunity detector runtime, skill resolver behavior, orchestration runtime, workers, providers, render/export, UI, package changes, Supabase work, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| Concept traces to visual opportunity | Every concept references one or more visual opportunities. |
| Concept type present | A canonical concept type is declared. |
| Concept title/summary present | Concept has a clear title and summary. |
| Primary creative role present | One primary visual/audio role is declared. |
| Viewer benefit present | Viewer benefit is explicit. |
| What viewer sees/hears present | Visual and audio experience are described where relevant. |
| Possible skill families canonical | Possible skill families use RP-SKILLS-13 canonical family keys. |
| Possible skill keys canonical | Possible skill keys use RP-SKILLS-13 canonical skill keys. |
| Edit preference fit considered | Visual density, motion, 3D, B-roll, SoundSync, credit sensitivity, and blocked/preferred skills are considered. |
| StoryTiming fit considered | Primary focus, density, captions, speech, hero windows, and conflicts are considered. |
| Source/proof safety considered | Claims, metrics, browser/app visuals, testimonials, and reference influence are checked. |
| Credit/approval tendency present | Credit tendency and approval tendency are declared. |
| Lower-cost alternative present for premium concept | Premium concepts include a lower-cost alternative or explain why not. |
| Restraint/no-op candidate considered | Restraint or no-op is considered where the moment may not earn extra visuals/audio. |
| Selected/rejected reasoning present | Selected and rejected concepts include reasons. |
| Duplicate/repetition check present | Repeated concepts, hero moments, 3D ideas, graphics, transitions, SFX, and reference-like patterns are checked. |
| User question flagged where needed | Source, preference, brand, metric, premium, model/source, music/reference, or generated/future uncertainty is flagged. |
| Handoff to skill candidate scoring present | Selected concepts hand off to future skill candidate scoring, not execution. |
| Runtime actions avoided | The prompt avoids runtime code, TypeScript, migrations, installs, package mutations, UI, providers, workers, Supabase, concept generator runtime, opportunity detector runtime, skill resolver runtime, orchestration, render/export, media/audio/caption/browser/WebGL/canvas/3D runtime, and app behavior. |

## Required Pseudo-record Coverage

Future creative concept prompts should cover these documentation-only pseudo-records or explain why a record is out of scope:

- `CreativeConceptCandidate`
- `CreativeConceptSelection`
- `CreativeConceptRejection`
- `CreativeConceptLowerCostAlternative`
- `CreativeConceptUserQuestion`
- `CreativeConceptIdeationRun`

These pseudo-records must remain Markdown documentation unless a later explicitly approved implementation prompt creates real contracts.

## Required Conceptual Coverage

Future creative concept prompts should cover:

- Concept ideation is not execution.
- Position in the planning flow.
- Required input context.
- Concept type families.
- Creative visual/audio role model.
- Candidate generation requirements.
- Concept status model.
- Selection and rejection behavior.
- Concept scoring.
- Priority bands.
- Relationship to visual opportunities.
- Relationship to skill taxonomy.
- Relationship to edit preference.
- Relationship to StoryTiming.
- Relationship to source/proof safety.
- Relationship to credit/approval.
- Relationship to tools/providers/workers.
- Lower-cost alternatives.
- Restraint concepts.
- Duplicate/novelty behavior.
- User-question behavior.
- Concept QA.
- Examples and anti-patterns.

## Fail The Prompt If

- Concept is only a skill, effect, tool, or provider name.
- Concept has no linked opportunity.
- Concept skips skill planning contracts.
- Concept implies generation or execution before approval.
- Concept ignores user preference.
- Concept ignores source/proof risk.
- Concept treats unknown source as verified.
- Concept copies reference.
- Every concept is 3D or hero.
- No restraint/no-op concept is considered.
- Premium concept lacks lower-cost alternative.
- Premium concept lacks credit/approval tendency.
- Non-canonical skill family or skill key is used.
- Concept jumps directly to a provider, worker, render job, or tool runtime.
- Prompt adds runtime code.
- Prompt adds TypeScript before the type-contract milestone.
- Prompt adds migration before the schema milestone.
- Prompt installs dependencies.
- Prompt mutates package files.
- Prompt unlocks concept generator, visual analysis, opportunity detector, skill resolver, skill catalog, orchestration, provider, worker, render/export, media/audio/caption/browser/WebGL/canvas/3D, generation runtime, or app behavior.

## Future Prompt Footer

Future creative concept prompts should end by stating:

- Public API changes: none, unless explicitly approved later.
- TypeScript contract changes: none, unless explicitly approved later.
- Database/Supabase changes: none, unless explicitly approved later.
- Runtime/provider/package/UI changes: none, unless explicitly approved later.
- Creative concept runtime, concept generator runtime, visual analysis runtime, opportunity detector runtime, skill resolver runtime, skill catalog runtime, preference runtime, settings UI, profile storage, orchestration, render/export, providers, workers, Supabase, media processing, audio generation, SFX generation, music generation, caption rendering, ASR/transcript/translation, browser/capture/media runtime, WebGL/canvas/3D runtime, and app behavior remain forbidden unless explicitly authorized in a later implementation prompt.
