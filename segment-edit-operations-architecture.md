# Segment Edit Operations Architecture

## Purpose

Segment edit operations convert an approved ReeditPro plan into concrete editing instructions that future workers can execute. The edit plan explains the strategy; segment operations explain what to do, in what order, and which QA checks must pass before delivery.

ReeditPro should never stop at "make a good edit." A professional plan should resolve into segment-level instructions for cuts, trims, captions, b-roll, color, audio, transitions, visual assets, frame layout, and QA.

## Plan vs. Operation

An edit plan describes intent:

- Open with the strongest line.
- Keep the pacing clean and premium.
- Use meaningful b-roll only.
- Avoid random effects.

An edit operation describes execution:

- Use `clip_3`.
- Trim source `00:05-00:09`.
- Place it at final `00:00-00:04`.
- Apply clean tight pacing.
- Add keyword-emphasis captions.
- Add subtle impact SFX.
- Use no b-roll on this hook.
- QA caption placement so it stays face-safe.

The approved plan is the contract. Operations are the worker-readable instructions derived from that contract.

## Segment Roles

Common segment roles include:

- `hook`
- `setup`
- `context`
- `proof`
- `explanation`
- `example`
- `emotional_beat`
- `reveal`
- `transition`
- `recap`
- `call_to_action`
- `ending`
- `montage`
- `b_roll_support`
- `title_card`
- `evidence_card`
- `visual_explainer`
- `custom`

Roles help workers understand why a segment exists, not just what clip appears there.

## Operation Types

Operation types include:

- `cut`
- `trim`
- `reorder`
- `speed_change`
- `silence_removal`
- `filler_word_removal`
- `caption`
- `b_roll`
- `color_grade`
- `audio_cleanup`
- `music`
- `sfx`
- `transition`
- `visual_asset`
- `renderer_layer`
- `frame_layout`
- `qa_check`

Operations should remain specific enough for a future worker, but not pretend that this frontend milestone performs the editing itself.

## Professional Controls Per Segment

Each segment should be able to define:

- source clips
- source time range
- final time range
- segment purpose
- pacing instruction
- cut instruction
- caption instruction
- b-roll instruction
- color instruction
- sound instruction
- transition instruction
- visual asset instruction
- frame/layout instruction
- must-follow rules
- avoid rules
- QA checks

These controls come from the compiled intent, the professional editing ontology, the selected edit level, source order, visual asset plan, renderer plan, and user instructions.

## Source Cleanup Operations

Segment trim and cut operations should reference `SourceCleanupPlan` decisions. Each trim operation carries `trimDecisionItemIds`, source range, final use, reason, risk, and QA notes.

If cleanup preference is not confirmed, final trim/cut operations remain draft or needs-review and approval stays locked. Future workers execute approved trim decisions from the approved snapshot rather than improvising from raw chat.

## Tier Behavior

Basic remains professional. It should include clean cuts, clean captions, natural color correction, voice leveling, tasteful simple transitions, uploaded-footage-first b-roll, and minimal generated assets. Basic never uses Veo.

Pro adds stronger segment structure, planned b-roll, better caption emphasis, style-specific color grade, more SoundSync polish, and Hailuo fallback where allowed. Pro never uses Veo.

Premium adds scene-by-scene treatment, more custom visual assets, stronger QA, more retries, advanced SoundSync, and deeper fallback planning. Veo Lite is available only as final fallback/rescue and is never primary or default.

## Worker Execution Principle

Workers must execute the approved segment plan version. Workers should not improvise outside approved fallback rules.

If a required edit cannot be completed within the approved plan and fallback allowance, the system should request a revision or new approval. This protects user intent, credit expectations, and tier/model constraints.

No real editing, FFmpeg, Remotion rendering, provider generation, export, billing, backend, or database behavior is implemented by this planning layer.

## Trim Review Operations

Trim and cut operations reference `TrimReviewPlan` where available. Retake selection IDs and meaning-preservation check IDs should flow into operation params, QA notes, and worker notes. If trim review blocks or requires review for risky cuts, operations remain `needs_review` and workers must not execute final trim instructions.
