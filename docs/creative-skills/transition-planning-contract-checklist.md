# Transition Planning Contract Checklist

Use this checklist before adding or revising any transition-related Creative Skill planning document.

## Universal Planning Contract Inherited

- [ ] Transition plan inherits `skill-planning-contracts.md`.
- [ ] Transition plan includes reason, timing, composition, audio, tool strategy, credit/approval, QA, and revision behavior.
- [ ] Transition plan stays documentation-only unless a later prompt explicitly authorizes implementation.

## Transition Purpose Present

- [ ] Transition explains what it connects.
- [ ] Transition explains why it improves story flow, emotion, rhythm, space, time, or comprehension.
- [ ] Transition explains why it is not random decoration.

## From/To Segment Relationship Present

- [ ] `from_segment_id` is identified.
- [ ] `to_segment_id` is identified.
- [ ] Relationship between segments is explained.
- [ ] Emotional, spatial, timing, or story shift is stated.

## Cut Point Present

- [ ] Cut point or transition anchor is named.
- [ ] Transcript, action, story beat, music beat, or visual anchor is stated.
- [ ] Timing precision needed is stated.

## Duration Present

- [ ] Duration in seconds or frames is stated.
- [ ] Pre-roll or post-roll is stated when relevant.
- [ ] Hold before/after transition is stated when relevant.

## Transition Family Selected

- [ ] Transition family is selected or `no_transition` is explicitly chosen.
- [ ] Family fits the story, platform, workflow, preference, and footage.
- [ ] Family is not repeated mechanically.

## Transition Intensity Selected

- [ ] Intensity is one of `none`, `invisible`, `subtle`, `moderate`, `energetic`, or `hero`.
- [ ] Intensity is earned by story, music, platform, footage, and preference.
- [ ] Hero/energetic transitions explain why they are worth the risk.

## Restraint Decision Present

- [ ] One of `use_full`, `use_subtle`, `use_optional`, `delay`, `replace_with_simpler_skill`, or `do_not_use` is selected.
- [ ] Clean cut or no-transition decisions are treated as valid professional decisions.

## Edge Behavior Present

- [ ] Edge behavior is named.
- [ ] Hard/soft/feathered/masked/browser/object edge choice fits the transition family.
- [ ] Full overlay/compositing detail is deferred to RP-SKILLS-04.

## Motion Direction/Curve Present Where Relevant

- [ ] Motion direction is stated for moving transitions.
- [ ] Motion curve/easing is stated for moving transitions.
- [ ] Motion blur, scale, parallax, or luma continuity is stated when relevant.

## Audio/SoundSync Plan Present

- [ ] Music relationship is stated.
- [ ] Beat sync is stated.
- [ ] SFX needed/not-needed is stated.
- [ ] Ambient bridge or room tone behavior is stated.
- [ ] SoundSync handoff is noted where beat, SFX, or ducking timing matters.

## Speech Safety Present

- [ ] SFX does not hit under key speech.
- [ ] Music ducking is stated when needed.
- [ ] Silence or emotional pause preservation is stated when needed.

## Caption/Overlay Conflict Check Present

- [ ] Captions remain readable.
- [ ] Overlays clear before or after transition when needed.
- [ ] Face/expression visibility is protected.
- [ ] Browser/app/source status is protected when relevant.

## Credit/Approval Behavior Present

- [ ] Credit impact is stated.
- [ ] Estimate requirement is stated.
- [ ] Approval requirement is stated.
- [ ] Premium/generated transitions are itemized.
- [ ] Lower-cost alternative is stated for optional heavy transitions.

## QA Checks Present

- [ ] Story reason check.
- [ ] No random effect check.
- [ ] Timing/naturalness check.
- [ ] Speech safety check.
- [ ] Caption/face/object safety check.
- [ ] Edge behavior check.
- [ ] Repetition check.
- [ ] Credit/approval compliance check.
- [ ] Reference-not-copied check.

## Revision Options Present

- [ ] Remove transition.
- [ ] Make transition cleaner or softer.
- [ ] Lower transition energy.
- [ ] Remove SFX or use ambient bridge.
- [ ] Align to beat.
- [ ] Replace premium/generated transition with lower-cost route.
- [ ] State whether new approval/estimate is required.

## StoryTiming Handoff Present

- [ ] Visual footprint is declared.
- [ ] Audio footprint is declared.
- [ ] Caption footprint is declared.
- [ ] Timing footprint is declared.
- [ ] Conflict risks are declared.
- [ ] Full StoryTiming coordination is deferred to RP-SKILLS-11.

## Runtime Actions Avoided

- [ ] No TypeScript contracts.
- [ ] No runtime source code.
- [ ] No React UI.
- [ ] No Supabase migrations or SQL.
- [ ] No provider calls.
- [ ] No workers, jobs, leases, or runtime gates.
- [ ] No render/export implementation.
- [ ] No dependency installs.
- [ ] No `package.json` or `package-lock.json` changes.
- [ ] No browser/WebGL/canvas runtime unlock.

## Fail The Prompt If

- [ ] Transition can execute from only a transition name.
- [ ] Transition has no story reason.
- [ ] Transition is applied everywhere by default.
- [ ] Premium/generated transition lacks credit estimate.
- [ ] Premium/generated transition lacks approval.
- [ ] SFX plan ignores speech safety.
- [ ] Edge behavior is missing.
- [ ] Captions/safe zones are ignored.
- [ ] Prompt adds runtime code.
- [ ] Prompt adds TypeScript before the type-contract milestone.
- [ ] Prompt adds migration before schema milestone.
- [ ] Prompt installs dependencies.
- [ ] Prompt mutates package files.
