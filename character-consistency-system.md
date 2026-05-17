# Character Consistency System

## Purpose

Character consistency means the same important person or story figure should look consistent across stills, cards, keyframes, start frames, end frames, animation clips, and story visuals.

ReeditPro should preserve visual identity, outfit, role, emotional range, style mode, and frame/background rules whenever a recurring character appears. GPT-Image-2 creates character anchors, cards, and keyframes. Wan, Hailuo, and Premium-only final fallback Veo animate from those anchors without changing identity. Remotion places the resulting assets into the approved frame and final composition.

This system is planning only. It does not perform identity verification, face recognition, provider calls, rendering, backend persistence, or real media analysis.

## Character Types

- `primary character`: the main story figure, speaker, subject, customer, founder, victim, investigator, or recurring protagonist.
- `secondary character`: an important supporting figure who appears in fewer beats.
- `mention-only person`: a person referenced by name or role but not meant to be animated deeply.
- `narrator/speaker`: the uploaded-video speaker or voice driving the edit.
- `group/crowd character`: a group represented by shared style rules rather than individual identity depth.
- `symbolic/abstract character`: a non-literal figure used to explain a feeling, role, relationship, or process.
- `real named person`: a named person who may require careful neutral visual treatment.
- `fictional character`: a clearly fictional or scenario-based character.
- `brand/product persona`: a brand, mascot, product helper, or persona-like representative.

## Character Importance

### Primary

Primary characters appear across multiple beats and usually need a reference pack. The pack may include a neutral pose, emotional pose, action pose, character card, start frame, and end frame.

### Secondary

Secondary characters support the story in fewer beats. They usually need a smaller consistency pack: one card or neutral pose, plus start/end frame notes if they appear in animation.

### Mention-Only

Mention-only people usually get a neutral name card, character card, or lineup card only. They should not get full animation unless the approved plan explains why motion is needed.

### Group/Crowd

Groups and crowds use group style rules instead of deep individual identity. They should remain generic, respectful, and visually consistent.

### Symbolic

Symbolic characters represent a role or idea. They should be clearly non-literal and should not imply real-person likeness.

## Character Reference Pack

A character reference pack should include:

- character id
- display name
- role in story
- importance
- fictional or real-person status
- visual description
- outfit
- body type or silhouette
- hair and accessories
- expression range
- pose range
- style mode notes
- color and stroke rules
- frame/background rules
- beat ids where the character appears
- segment ids where the character appears
- required reference assets
- consistency rules
- avoid rules
- prompt notes
- QA checks

## Character Consistency Workflow

1. Identify characters from compiled intent, story beats, uploaded media, user instructions, visual assets, and segment operations.
2. Classify importance as primary, secondary, mention-only, group, or symbolic.
3. Build a character reference pack with appearance, role, prompt, and QA rules.
4. Use GPT-Image-2 for character anchors, cards, keyframes, start frames, and end frames.
5. Use start and end frames for animation when consistency matters.
6. Build provider prompt plans using the character pack.
7. QA checks whether identity, outfit, style, and emotional range remain consistent.
8. Future approved snapshots store character packs and asset usage so workers do not invent new character appearances.

## Still And Animation Consistency

Still cards and animation keyframes should use the same character pack. Start frames and end frames should preserve the same visual identity. If one character appears in multiple scenes, future workers should reuse the same pack.

If a model drifts, QA/fallback should retry within the approved route, simplify the scene, convert to still, convert to motion design, or request review if the approved fallback allowance is exceeded.

## Real-Person Caution

For real named people, public figures, user-provided people, and unknown reality status:

- Do not default to realistic likeness generation unless future product policy supports rights, source checks, and user-provided references.
- Use neutral documentary cards, stylized non-realistic representations, silhouettes, evidence-board visuals, or generic figures when appropriate.
- Do not show a person as guilty, arrested, criminal, violent, shamed, or exposed unless the claim is verified and explicitly approved in the plan.
- Do not exaggerate expressions to imply guilt.
- Do not create misleading scenes of real people doing actions that are only alleged.
- When unsure, use a neutral name card, timeline card, lineup card, or generic figure.

## Tier Behavior

### Basic

Basic uses minimal character packs, normally only for a primary character if needed. It favors still cards and controlled editor motion over unnecessary animation. Basic never uses Veo.

### Pro

Pro supports primary and important secondary character packs, better start/end frame consistency, and Hailuo fallback where routing allows it. Pro never uses Veo.

### Premium

Premium supports stronger character consistency, more reference poses, more QA, more retries, and deeper fallback planning. Veo Lite may appear only as final fallback/rescue and is never primary or default.

## Non-Goals

This document does not implement identity verification, face recognition, web research, provider calls, GPT-Image-2 calls, Wan/Hailuo/Veo calls, Remotion rendering, backend persistence, migrations, billing, credit deduction, exports, or mobile work.
