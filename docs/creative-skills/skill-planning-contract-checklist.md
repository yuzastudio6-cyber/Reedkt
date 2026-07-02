# Skill Planning Contract Checklist

Use this checklist before adding or revising any future Creative Skill planning document.

## Universal Planning Fields Present

- [ ] Skill plan has project, edit plan, segment, source clip, transcript, story beat, platform, aspect ratio, edit level, preference, reference DNA, and credit context.
- [ ] Skill plan includes `skill_key`, `skill_family`, `skill_plan_status`, `planning_reason`, `creative_intent`, and alignment fields.
- [ ] Skill plan states `must_follow_rules` and `avoid_rules`.
- [ ] Skill plan remains documentation-only unless a later prompt explicitly authorizes implementation.

## Planning Reason Quality

- [ ] Reason explains what is happening in the segment.
- [ ] Reason explains the spoken or visual meaning.
- [ ] Reason identifies the visual/audio/story opportunity.
- [ ] Reason answers why this skill, why here, and why now.
- [ ] Reason explains why the skill is not random decoration.
- [ ] Reason notes what would make the skill amateur if misused.

## Restraint Decision Present

- [ ] One of `use_full`, `use_subtle`, `use_optional`, `delay`, `replace_with_simpler_skill`, or `do_not_use` is selected.
- [ ] Heavy skills explain why they are worth cost, approval, screen space, and QA.
- [ ] Rejected skills have a reason when their rejection helps prove restraint or support revision.

## Timing Plan Present

- [ ] Start, end, duration, and anchor summary are present or explicitly not applicable.
- [ ] Transcript, story beat, visual, or music anchors are named where relevant.
- [ ] Entry, hold, and exit behavior are described.
- [ ] StoryTiming handoff is noted for conflicts or precision timing.

## Composition Plan Present Where Visual

- [ ] Screen zone and safe-area strategy are present.
- [ ] Face, object, caption, UI, and proof-visual safety are addressed.
- [ ] Hard edge or soft edge choice is named.
- [ ] Layer order, depth, opacity, shadow/contact, tracking, or masking placeholders are present when relevant.
- [ ] 3D skills include at least role and placement placeholders.

## Audio Relationship Present Where Relevant

- [ ] Music relationship is stated.
- [ ] SFX relationship is stated.
- [ ] Speech safety is stated.
- [ ] Ducking, ambience, room tone, beat sync, and avoid-under-speech guidance are included when relevant.

## Tool Strategy Is Planning-Only

- [ ] Tool candidates are ranked guidance only.
- [ ] Preferred and fallback tool families are planning metadata.
- [ ] Runtime readiness is stated.
- [ ] Provider dependency is stated if relevant.
- [ ] Future worker target does not imply dispatch.
- [ ] Worker notes say future workers load approved records by ID.

## Credit / Approval Present

- [ ] Credit impact is one of `none`, `low`, `medium`, `high`, or `premium`.
- [ ] Estimate requirement is stated.
- [ ] Approval requirement is stated.
- [ ] Premium skills are itemized and explain why they cost more.
- [ ] Lower-cost alternative or remove/downgrade behavior is stated for optional heavy skills.

## QA Present

- [ ] QA checks cover story fit and not-random-decoration.
- [ ] QA checks cover visual density and repetition.
- [ ] QA checks cover user preference compliance.
- [ ] QA checks cover safe areas, captions, faces, objects, and speech where relevant.
- [ ] QA checks cover credit, approval, and reference-copy compliance.

## Revision Behavior Present

- [ ] Revision allowed/not allowed is stated.
- [ ] Revision scope is stated.
- [ ] Revision cost behavior is stated.
- [ ] New approval requirement is stated.
- [ ] Safe revision options are listed.

## Conflict Handoff Present

- [ ] Visual footprint is declared.
- [ ] Audio footprint is declared.
- [ ] Caption footprint is declared.
- [ ] Timing footprint is declared.
- [ ] Credit footprint is declared.
- [ ] Conflict risks are declared for future StoryTiming / Composition Coordination.

## Forbidden Runtime Actions Avoided

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

- [ ] A skill can execute from only a skill name.
- [ ] A premium skill lacks approval/credit behavior.
- [ ] A visual skill lacks screen/composition plan.
- [ ] A sound-related skill lacks speech safety.
- [ ] A 3D skill lacks role/placement placeholder.
- [ ] The prompt adds runtime code.
- [ ] The prompt adds a migration before a schema milestone.
- [ ] The prompt installs dependencies.
- [ ] The prompt mutates package files.
