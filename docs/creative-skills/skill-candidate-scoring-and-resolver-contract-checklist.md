# Skill Candidate Scoring And Resolver Contract Checklist

Use this checklist for future Skill Candidate Scoring and Resolver prompts. This is documentation only and must not become runtime code, TypeScript, SQL, JSON schema, migrations, prompt execution, skill resolver runtime, scoring runtime, skill route runtime, skill catalog runtime, concept generator runtime, visual analysis runtime, opportunity detector runtime, orchestration runtime, workers, providers, render/export, UI, package changes, Supabase work, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| Selected creative concept input present | Resolver starts from selected creative concepts, not raw opportunities or skill names. |
| Canonical skill taxonomy referenced | RP-SKILLS-13 taxonomy is referenced for families, keys, aliases, and relationships. |
| Aliases resolved | Alias keys are resolved before scoring. |
| Candidate skill key canonical | Every candidate uses a canonical skill key. |
| Candidate family canonical | Every candidate uses a canonical family. |
| Planning contract mapped | Every selected or recommended candidate maps to a universal or specialized planning contract. |
| Candidate reason present | Every candidate has a human-readable reason. |
| Scoring rationale present | Every selected/recommended/rejected/blocked candidate has score reasoning. |
| Recommendation level present | Required, recommended, optional, optional premium, lower-cost, rejected, blocked, do-not-use, or needs-user-input level is declared. |
| Preference influence considered | Edit preference, density, wow target, credit sensitivity, and restraint are considered. |
| Preferred skills handled | Preferred skills receive scoring influence but are not forced everywhere. |
| Blocked skills handled | Blocked skills become blocked candidates unless explicit override exists. |
| Must-follow and avoid rules handled | Must-follow rules, avoid rules, hard blocks, soft preferences, and unknown conflicts are recorded. |
| Credit/approval tendency present | Candidate includes credit tendency and approval tendency without spending credits. |
| Lower-cost alternative present for premium optional skill | Heavy or premium optional candidates include a lower-cost alternative or explain why not. |
| Rejected/blocked candidates recorded | Rejected and blocked candidates retain reasons and safer alternatives where useful. |
| StoryTiming readiness present | Candidate declares readiness, density/footprint concerns, and coordination needs. |
| Source/proof safety present | Proof, browser/app, metric, testimonial, source, redaction, and Reference DNA safety are checked. |
| Runtime readiness is planning-only | Runtime readiness is metadata only and does not unlock execution. |
| QA checks present | Resolver QA covers canonical keys, contracts, preference handling, source safety, premium hints, lower-cost alternatives, StoryTiming, rejection reasons, and no execution. |
| Handoff to skill route assembly present | Selected candidates hand off to future route assembly, not execution. |
| Runtime actions avoided | Prompt avoids runtime code, TypeScript, migrations, installs, package mutations, UI, providers, workers, Supabase, skill resolver runtime, scoring runtime, route runtime, catalog runtime, concept generator runtime, visual analysis, opportunity detector runtime, orchestration, render/export, media/audio/caption/browser/WebGL/canvas/3D runtime, generation runtime, and app behavior. |

## Required Pseudo-record Coverage

Future skill resolver prompts should cover these documentation-only pseudo-records or explain why a record is out of scope:

- `SkillCandidate`
- `SkillCandidateBundle`
- `SkillLowerCostAlternativeDecision`
- `RejectedSkillCandidate`
- `SkillCandidateScoreReview`
- `SkillResolverRun`
- `SkillRouteDecisionPreview`

These pseudo-records must remain Markdown documentation unless a later explicitly approved implementation prompt creates real contracts.

## Required Conceptual Coverage

Future skill resolver prompts should cover:

- Resolver output is not execution.
- Position in the planning flow.
- Required input context.
- Candidate mapping model.
- Skill candidate type family.
- Skill candidate status model.
- Recommendation level model.
- Core scoring dimensions.
- `skill_candidate_score`.
- Decision thresholds and bands.
- Preferred and blocked skill handling.
- Must-follow and avoid rules.
- Credit and approval behavior.
- Lower-cost alternatives.
- Rejected skill candidates.
- StoryTiming readiness.
- Source/proof safety.
- Runtime readiness as planning metadata only.
- Skill relationships and conflicts.
- Resolver QA.
- Examples and anti-patterns.
- Handoff to `RP-SKILLS-17`.

## Fail The Prompt If

- Skill is selected without a creative concept.
- Skill is selected without scoring or rationale.
- Non-canonical skill key is used.
- Tool, provider, worker, prompt, UI label, package, model, or route name is used as a skill.
- Blocked skill is selected without explicit override.
- Preferred skill is forced everywhere.
- Premium skill lacks credit/approval hint.
- Lower-cost alternative is missing for premium optional skill.
- Rejected or blocked candidate reason is missing.
- Source/proof risk is ignored.
- StoryTiming readiness is missing.
- Resolver implies execution or generation.
- Prompt adds runtime code.
- Prompt adds TypeScript before the type-contract milestone.
- Prompt adds migration before the schema milestone.
- Prompt installs dependencies.
- Prompt mutates package files.
- Prompt unlocks skill resolver runtime, scoring runtime, skill route runtime, skill catalog runtime, concept generator runtime, visual analysis runtime, opportunity detector runtime, preference runtime, orchestration, providers, workers, render/export, media/audio/caption/browser/WebGL/canvas/3D runtime, generation runtime, or app behavior.

## Future Prompt Footer

Future skill resolver prompts should end by stating:

- Public API changes: none, unless explicitly approved later.
- TypeScript contract changes: none, unless explicitly approved later.
- Database/Supabase changes: none, unless explicitly approved later.
- Runtime/provider/package/UI changes: none, unless explicitly approved later.
- Skill resolver runtime, scoring runtime, skill route runtime, skill catalog runtime, concept generator runtime, visual analysis runtime, opportunity detector runtime, preference runtime, settings UI, profile storage, orchestration, render/export, providers, workers, Supabase, media processing, audio generation, SFX generation, music generation, caption rendering, ASR/transcript/translation, browser/capture/media runtime, WebGL/canvas/3D runtime, generation runtime, and app behavior remain forbidden unless explicitly authorized in a later implementation prompt.
