# B-roll Planning Contract Checklist

Status: historical doctrine; runtime superseded by
[`docs/edit-skills/b-roll/architecture.md`](../edit-skills/b-roll/architecture.md).

This checklist is retained for compatibility review. Runtime qualification and
static validation use the canonical `b_roll@1.0.0` capability manifest and its
evidence fixtures.

This checklist is for future prompts that add, revise, or validate B-roll skill planning. It is documentation only. It does not authorize runtime code, TypeScript contracts, SQL, migrations, workers, providers, UI, browser/capture/media/generation execution, stock/search integrations, package changes, or app behavior changes.

## Required Checks

| Check | Required result |
| --- | --- |
| Universal planning contract inherited | The prompt references `skill-planning-contracts.md` and preserves planning reason, restraint, timing, composition, audio, tool, credit/approval, QA, and revision envelopes. |
| Transition contract referenced where B-roll bridges cuts | B-roll used as cut cover, scene bridge, J-cut/L-cut support, or transition bridge references `transition-planning-contract.md`. |
| Overlay/compositing contract referenced for inset/PIP/split-screen | Inset, picture-in-picture, split-screen, side-by-side, browser-frame, or layered B-roll references `overlay-compositing-planning-contract.md`. |
| Graphic design contract referenced for labels/proof/context cards | Labels, proof cards, source notes, context cards, and B-roll frames reference `graphic-design-planning-contract.md`. |
| Motion design contract referenced for B-roll movement/reveal | B-roll reveal, movement, focus motion, pacing, rhythm, or montage motion references `motion-design-planning-contract.md`. |
| 3D visual contract referenced for 3D object B-roll | 3D object B-roll, 3D explainer B-roll, or 3D overlay alternatives reference `three-d-visual-planning-contract.md`. |
| B-roll purpose present | The plan states what the B-roll proves, clarifies, covers, or emotionally supports. |
| B-roll role present | The plan selects a role such as `no_b_roll`, `source_clip_cutaway`, `proof_visual`, `context_visual`, `cut_cover`, `product_detail`, `screen_app_visual`, `generated_visual_future`, `three_d_object_broll`, or `picture_in_picture_b_roll`. |
| Source type present | The source type is declared: existing source clip, uploaded asset, user screenshot, screen recording, reference influence only, authorized capture later, internal mock, stock future, generated future, 3D future, Real Motion future, procedural future, or unknown source. |
| Source status present | The source status is declared: verified user-provided, project source footage, transcript-derived, claimed by user, reference DNA only, mock-only, needs confirmation, needs authorization, needs rights review, needs redaction, unknown, or not allowed. |
| Proof/context level present | The plan sets `none`, `atmospheric`, `illustrative`, `contextual`, `supporting`, `proof_like`, `evidence_like`, or `claim_sensitive`. |
| Existing versus generated/future source decision present | The plan states whether it uses existing source, user-provided asset, future authorized capture, future stock/search, future generated image/video, future 3D, or no B-roll. |
| Full-frame versus inset/PIP/split-screen decision present | The display mode is declared and justified. |
| Timing/duration present | The plan includes start, end, duration, timing anchor, minimum view/read time, and transition/cut relationship where relevant. |
| Speaker relationship present | The plan says whether B-roll hides, preserves, frames, or appears beside the speaker/main footage. |
| Caption relationship present | Captions remain readable and collision-safe. |
| Audio relationship present | Voiceover, original B-roll audio, ambience, room tone, music, SFX, and speech safety are declared. |
| Source/proof/redaction safety present where relevant | Proof-like, evidence-like, browser/app, private, sensitive, or claim-sensitive B-roll includes source status, safe wording, and redaction planning. |
| Credit/approval behavior present | Generated, premium, stock/library, capture, 3D, Real Motion-style, or advanced compositing B-roll includes credit estimate and approval behavior. |
| Lower-cost alternative present | Optional premium/generated B-roll includes a lower-cost alternative such as existing source footage, graphic card, caption emphasis, simple cutaway, or no B-roll. |
| QA checks present | QA covers meaning, source status, proof/context safety, face/emotion/product/action protection, captions, timing, audio, repetition, credit, approval, and lower-cost alternatives. |
| Revision options present | Revisions can remove B-roll, use less, use more source, choose another clip, replace generated/future with source, switch full-frame/inset/PIP, mute audio, add labels, redact, or lower cost. |
| StoryTiming handoff present | B-roll timing, cut covers, proof moments, captions, audio bridges, and conflicts record the relevant StoryTiming or timing handoff. |
| Runtime actions avoided | The prompt remains docs-only unless a later authorized prompt explicitly opens implementation. |

## Fail The Prompt If

- B-roll can execute from only a B-roll name.
- B-roll has no story/meaning/proof/context reason.
- B-roll is applied everywhere by default.
- Source type is missing.
- Source status is missing.
- Proof/evidence level is missing for proof-like B-roll.
- Browser/app B-roll invents exact UI/source details.
- Sensitive data risk lacks redaction/source plan.
- B-roll hides important face/emotion/product/action without reason.
- B-roll ignores captions.
- B-roll ignores original audio, ambience, room tone, speech, or music conflicts.
- Generated/future B-roll lacks credit estimate.
- Generated/future B-roll lacks approval.
- Stock/library B-roll is treated as available without future rights-aware workflow.
- Lower-cost alternative is missing for optional premium/generated B-roll.
- Reference B-roll is copied shot-for-shot.
- Unknown source is treated as verified proof.
- Prompt adds runtime code.
- Prompt adds TypeScript before the type-contract milestone.
- Prompt adds migration before schema milestone.
- Prompt installs dependencies.
- Prompt mutates package files.
- Prompt unlocks browser/capture/media/generation/runtime.
- Prompt adds provider calls, stock/search integrations, workers, render/export code, Supabase execution, credentials, secrets, or app behavior.

## Source Truth Reminders

- Universal planning contract: `docs/creative-skills/skill-planning-contracts.md`
- Transition planning: `docs/creative-skills/transition-planning-contract.md`
- Overlay/compositing planning: `docs/creative-skills/overlay-compositing-planning-contract.md`
- Graphic design planning: `docs/creative-skills/graphic-design-planning-contract.md`
- Motion design planning: `docs/creative-skills/motion-design-planning-contract.md`
- 3D visual planning: `docs/creative-skills/three-d-visual-planning-contract.md`
- B-roll planning: `docs/creative-skills/b-roll-planning-contract.md`
- Existing B-roll policies, source clip routing, source cleanup, media assets, visual observations, StoryTiming, SoundSync/SFX, render, worker, credit, and QA ownership remains with existing repo sources.

## Next Contract Check

The next recommended prompt is `RP-SKILLS-09 - Caption Planning Contract`. It should stay docs-only and define caption planning fields without creating runtime, TypeScript contracts, SQL, migrations, workers, providers, packages, UI, browser/capture/media/generation runtime, or app behavior.
