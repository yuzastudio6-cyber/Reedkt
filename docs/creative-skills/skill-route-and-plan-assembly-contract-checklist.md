# Skill Route And Plan Assembly Contract Checklist

Use this checklist for future Skill Route and Plan Assembly prompts. This is documentation only and must not become runtime code, TypeScript, SQL, JSON schema, migrations, prompt execution, skill route runtime, plan assembly runtime, skill resolver runtime, scoring runtime, skill catalog runtime, concept generator runtime, visual analysis runtime, opportunity detector runtime, orchestration runtime, workers, providers, render/export, UI, package changes, Supabase work, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| Selected skill candidate input present | Route assembly starts from selected skill candidates, not raw opportunities or skill names. |
| Canonical skill key present | Every route uses a canonical RP-SKILLS-13 skill key. |
| Route type present | Route type is primary, support, optional, premium optional, lower-cost, restraint, blocked, rejected, confirmation, StoryTiming-dependent, or QA-sensitive. |
| Route status present | Route status is explicit and does not imply execution. |
| Route reason present | Every route has a specific concept/candidate-linked reason. |
| Time range or scope present | Route has seconds, segment, beat, transition, multi-segment, full-edit, export, or revision scope. |
| Primary/support/optional role present | Role is clear and does not compete with the primary focus. |
| Planning contract attached | Universal and relevant specialized planning contracts are attached. |
| Required plan record set identified | Future required plan records are listed. |
| StoryTiming readiness present | Route declares readiness, conflict, or coordination state. |
| Source/proof safety present | Source/proof, browser/app, redaction, safe wording, rights, and Reference DNA safety are recorded. |
| Credit/approval tendency present | Route includes credit tendency and approval scope without estimating/spending credits. |
| Lower-cost alternative linked for premium optional route | Premium optional route links an alternative or explains why no alternative exists. |
| Conflict flags present where needed | Route conflicts are captured with severity and recommended resolution. |
| QA requirements present | Route QA covers contracts, StoryTiming, captions, speech, source, density, credit/approval, runtime boundary, and taste. |
| Revision linkage present | Route has a revision group and safe revision options. |
| User-visible summary present | User copy explains what is planned, why, approval/credit posture, alternatives, source caveats, and revision options. |
| Existing `signature_routes` compatibility considered | Prompt references existing signature route owners without replacing them. |
| Runtime actions avoided | Prompt avoids runtime code, TypeScript, migrations, installs, package mutations, UI, providers, workers, Supabase, skill route runtime, plan assembly runtime, resolver runtime, scoring runtime, catalog runtime, concept generator runtime, visual analysis, opportunity detector runtime, orchestration, render/export, media/audio/caption/browser/WebGL/canvas/3D runtime, generation runtime, and app behavior. |

## Required Pseudo-record Coverage

Future route assembly prompts should cover these documentation-only pseudo-records or explain why a record is out of scope:

- `EditPlanSkillRoute`
- `EditPlanSkillRouteBundle`
- `SkillPlanningContractAttachment`
- `RequiredSkillPlanRecordSet`
- `LowerCostAlternativeRouteLink`
- `SkillRouteConflictFlag`
- `SkillRouteQARequirement`
- `SkillRouteRevisionLink`
- `SkillRouteUserVisibleSummary`
- `SkillPlanAssemblyRun`

These pseudo-records must remain Markdown documentation unless a later explicitly approved implementation prompt creates real contracts.

## Required Conceptual Coverage

Future route assembly prompts should cover:

- Skill routes are not execution.
- Position in the planning flow.
- Required input context.
- Route decision types.
- Route status model.
- Planning contract attachment model.
- Required plan record assembly model.
- Timing and segment mapping.
- Primary/support/optional role model.
- StoryTiming readiness handoff.
- Source/proof safety handoff.
- Approval scope model.
- Credit impact model.
- Lower-cost alternative route model.
- Route conflict model.
- Route QA requirement model.
- Revision linkage model.
- User-visible route summary model.
- Route assembly lifecycle.
- Route assembly readiness gates.
- `route_assembly_completeness`.
- Route assembly QA.
- Relationship to existing `signature_routes`.
- Examples and anti-patterns.
- Handoff to `RP-SKILLS-18`.

## Fail The Prompt If

- Route is created without selected skill candidate.
- Route has no reason.
- Route has no planning contract.
- Route uses non-canonical skill key.
- Route has no time range or scope.
- Premium route lacks credit/approval hint.
- Optional premium route lacks lower-cost alternative.
- Source-sensitive route lacks source safety status.
- StoryTiming readiness is missing.
- Route implies execution or generation.
- Route creates worker, job, provider, render, or generation request.
- Prompt adds runtime code.
- Prompt adds TypeScript before the type-contract milestone.
- Prompt adds migration before the schema milestone.
- Prompt installs dependencies.
- Prompt mutates package files.
- Prompt unlocks skill route runtime, plan assembly runtime, skill resolver runtime, scoring runtime, skill catalog runtime, concept generator runtime, visual analysis runtime, opportunity detector runtime, preference runtime, orchestration, providers, workers, render/export, media/audio/caption/browser/WebGL/canvas/3D runtime, generation runtime, or app behavior.

## Future Prompt Footer

Future route assembly prompts should end by stating:

- Public API changes: none, unless explicitly approved later.
- TypeScript contract changes: none, unless explicitly approved later.
- Database/Supabase changes: none, unless explicitly approved later.
- Runtime/provider/package/UI changes: none, unless explicitly approved later.
- Skill route runtime, plan assembly runtime, skill resolver runtime, scoring runtime, skill catalog runtime, concept generator runtime, visual analysis runtime, opportunity detector runtime, preference runtime, settings UI, profile storage, orchestration, render/export, providers, workers, Supabase, media processing, audio generation, SFX generation, music generation, caption rendering, ASR/transcript/translation, browser/capture/media runtime, WebGL/canvas/3D runtime, generation runtime, and app behavior remain forbidden unless explicitly authorized in a later implementation prompt.
