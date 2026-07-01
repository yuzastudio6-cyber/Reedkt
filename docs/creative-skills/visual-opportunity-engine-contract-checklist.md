# Visual Opportunity Engine Contract Checklist

Use this checklist for future visual opportunity prompts. This is documentation only and must not be converted into runtime code, TypeScript, SQL, JSON schema, migrations, prompt execution, opportunity detector runtime, visual analysis runtime, skill resolver behavior, orchestration runtime, workers, providers, render/export, UI, package changes, Supabase work, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| Opportunity type present | A canonical opportunity type is declared. |
| Source type present | Source is one of transcript, visual, audio, source sequence, user instruction, preference, Reference DNA, workflow, platform, QA/risk, AI-inferred, mock-only, or unknown. |
| Evidence support level present | Evidence level is declared and unknown evidence is not treated as verified. |
| Confidence present | Confidence is `high`, `medium`, `low`, `needs_user_confirmation`, or `blocked_by_unknown_source`. |
| Transcript/visual/audio/story anchor present | Available transcript, visual, audio, story, user instruction, or preference anchor is recorded. |
| Why this moment matters present | The opportunity states why the moment matters to the story or viewer. |
| Viewer benefit present | The expected viewer clarity, emotion, proof, timing, or restraint benefit is recorded. |
| Possible skill families canonical | Possible skill families use canonical RP-SKILLS-13 family keys. |
| Possible skill keys canonical | Possible skill keys use canonical RP-SKILLS-13 skill keys when listed. |
| No-op/restraint considered | A no-action or restraint path is considered. |
| Source/proof risk considered | Claim, browser, dashboard, source, metric, and reference risks are flagged. |
| Edit preference considered | Density, wow factor, blocked/preferred skills, credit sensitivity, and restraint are considered. |
| Credit sensitivity considered | Premium or generated opportunities include lower-cost alternative notes. |
| StoryTiming notes present | Focus, hero, restraint, caption, B-roll, transition, SoundSync, or conflict notes are present where relevant. |
| Score/reason present | Opportunity scoring or a clear prioritization reason exists. |
| Duplicate/repetition check present | Duplicate and repeated patterns are merged, rejected, lowered, preserved, or sent to StoryTiming. |
| User question flagged where needed | Source/proof, preference, CTA, metric, premium, or reference uncertainty is marked for user input. |
| Handoff to creative concepts present | The next step is concept ideation or rejection/restraint, not execution. |
| Runtime actions avoided | The prompt avoids runtime code, TypeScript, migrations, installs, package mutations, UI, providers, workers, Supabase, opportunity detector runtime, skill resolver runtime, orchestration, render/export, media/audio/caption/browser/WebGL/canvas/3D runtime, and app behavior. |

## Required Pseudo-record Coverage

Future visual opportunity prompts should cover these documentation-only pseudo-records or explain why a record is out of scope:

- `VisualOpportunity`
- `RestraintOpportunity`
- `OpportunityUserQuestion`
- `VisualOpportunityEngineRun`
- `VisualOpportunityScoreReview`

These pseudo-records must remain Markdown documentation unless a later explicitly approved implementation prompt creates real contracts.

## Required Conceptual Coverage

Future visual opportunity prompts should cover:

- Opportunity detection is not execution.
- Position in the planning flow.
- Required input context.
- Opportunity type families.
- Opportunity source model.
- Confidence and evidence model.
- Opportunity status model.
- Restraint/no-op opportunity model.
- Opportunity scoring dimensions and risks.
- Priority bands.
- Skill-family handoff mapping.
- Relationship to skill taxonomy.
- Relationship to edit preference.
- Relationship to StoryTiming.
- Relationship to source/proof safety.
- Relationship to credit/approval.
- Relationship to user questions.
- Duplicate/repetition behavior.
- Opportunity QA.
- Examples and anti-patterns.

## Fail The Prompt If

- Opportunity is just an effect name.
- Opportunity selects a tool directly.
- Opportunity selects a provider directly.
- Opportunity skips creative concept ideation.
- Opportunity creates a skill route without a planning contract.
- Opportunity ignores user preference.
- Opportunity ignores source/proof risk.
- Opportunity treats unknown source as verified.
- Opportunity copies reference.
- Every segment becomes a hero opportunity.
- Every pause becomes a B-roll opportunity.
- Every object mention becomes 3D.
- No restraint/no-op opportunities are considered.
- Non-canonical skill family or skill key is used.
- Opportunity implies generation or execution before approval.
- Prompt adds runtime code.
- Prompt adds TypeScript before the type-contract milestone.
- Prompt adds migration before the schema milestone.
- Prompt installs dependencies.
- Prompt mutates package files.
- Prompt unlocks opportunity detector, visual analysis, skill resolver, skill catalog, orchestration, provider, worker, render/export, media/audio/caption/browser/WebGL/canvas/3D, generation runtime, or app behavior.

## Future Prompt Footer

Future visual opportunity prompts should end by stating:

- Public API changes: none, unless explicitly approved later.
- TypeScript contract changes: none, unless explicitly approved later.
- Database/Supabase changes: none, unless explicitly approved later.
- Runtime/provider/package/UI changes: none, unless explicitly approved later.
- Visual analysis runtime, opportunity detector runtime, skill resolver runtime, skill catalog runtime, preference runtime, settings UI, profile storage, orchestration, render/export, providers, workers, Supabase, media processing, audio generation, SFX generation, music generation, caption rendering, ASR/transcript/translation, browser/capture/media runtime, WebGL/canvas/3D runtime, and app behavior remain forbidden unless explicitly authorized in a later implementation prompt.
