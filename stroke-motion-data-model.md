# Stroke Motion Data Model

## Purpose

This document defines the future Stroke Motion database architecture. It is documentation only and does not implement generation, animations, migrations, AI calls, or rendering.

## RP-DB-08 Implementation

`supabase/migrations/202605130006_stroke_motion_data_model.sql` creates the local Supabase/Postgres foundation for Stroke Motion planning. It stores planning records only: no animation generation, provider integration, render/export/revision tables, AI API calls, Stripe, Google Cloud deployment, uploads, rendering, or mobile work.

RP-DB-08 creates structured records for:

- `stroke_motion_plans`
- `stroke_motion_meaning_expansions`
- `stroke_motion_beats`
- `stroke_motion_characters`
- `stroke_motion_symbols`
- `stroke_motion_beat_characters`
- `stroke_motion_beat_symbols`
- `stroke_motion_transitions`
- `stroke_motion_timing_anchors`
- `stroke_motion_storyboard_frames`
- `stroke_motion_generation_specs`
- `stroke_motion_plan_examples`

The migration supports `spoken_story_mode` and `source_reading_mode`. Source reading mode requires meaning expansion before animation planning so the AI understands the source text before it designs visual story beats.

Beats store both `meaning` and `visual_action`. Transitions connect beats into one animated story. Timing anchors synchronize motion to words, phrases, sentences, pauses, emotional shifts, scene cuts, music beats, SFX hits, or manual marks. Storyboard frames prove the visual meaning before expensive generation. Generation specs describe future renderer requirements without creating a generation request, including controlled transparent-overlay output only when a deterministic renderer needs it.

The seeded `joseph_mary_source_reading_example` is example-only reference data. It demonstrates the Joseph/Mary transition chain and respectful worker notes, but Stroke Motion is not Bible-only and must work for business stories, real estate tours, product explanations, education, documentaries, personal stories, books, historical text, documents, lessons, and articles.

## Definition

Stroke Motion is a fast 2D animated story system that turns spoken meaning, source text, or scripture/book/document reading into clear visual story beats using stroke characters, symbols, paths, cards, panels, and transitions timed to the speaker's words.

Stroke Motion is not random arrows, circles, icons, or decoration. It must support meaning, emotion, transformation, and story clarity.

Stroke Motion does not require transparent AI video backgrounds by default. AI-generated motion should use the approved frame/panel background from `frame-layout-system.md`; transparent overlays remain a future option for SVG, Lottie, Remotion, or another controlled renderer.

## Understanding Modes

### `spoken_story_mode`

Use when the user already explains the story clearly.

Example:

> Joseph saw Mary was pregnant, misunderstood, planned to leave, then God spoke to him.

The AI can extract story beats directly from the spoken explanation.

### `source_reading_mode`

Use when the user reads directly from a source:

- Bible verse.
- Book passage.
- Quote.
- Script.
- Historical text.
- Document.

In this mode, the AI must understand the meaning behind the source text first, then turn it into visual story beats. This required step is called `meaning_expansion`.

## Required Tables

### `stroke_motion_plans`

Stores the overall plan.

Fields:

- `id`
- `project_id`
- `edit_plan_id`
- `edit_plan_segment_id`
- `understanding_mode`: `spoken_story_mode`, `source_reading_mode`
- `source_text_type`
- `source_reference`
- `source_text_excerpt`
- `story_summary`
- `meaning_expansion_summary`
- `animation_goal`
- `style_level`
- `transition_strategy`
- `timing_strategy`
- `approval_status`
- `credit_estimate_id`
- `status`

### `stroke_motion_beats`

Stores each animated story beat.

Fields:

- `id`
- `stroke_motion_plan_id`
- `beat_order`
- `story_beat_label`
- `meaning`
- `visual_action`
- `characters_json`
- `symbols_json`
- `motion_path`
- `transition_in`
- `transition_out`
- `start_time`
- `end_time`
- `matched_words`
- `timing_anchor_id`
- `sfx_hint`
- `worker_notes`
- `render_status`

### `stroke_motion_characters`

Reusable or plan-specific stroke figures.

Fields:

- `id`
- `stroke_motion_plan_id`
- `character_key`
- `character_label`
- `role_in_story`
- `visual_style`
- `emotion_state`
- `do_not_misrepresent_rules_json`
- `metadata_json`

### `stroke_motion_symbols`

Symbolic visual elements.

Fields:

- `id`
- `stroke_motion_plan_id`
- `symbol_key`
- `symbol_label`
- `meaning`
- `visual_form`
- `allowed_usage`
- `avoid_usage`
- `metadata_json`

### `stroke_motion_transitions`

Connected visual transformations.

Fields:

- `id`
- `stroke_motion_plan_id`
- `from_beat_id`
- `to_beat_id`
- `transition_label`
- `transition_path`
- `visual_continuity_rule`
- `start_time`
- `end_time`
- `sfx_hint`
- `worker_notes`

### `stroke_motion_timing_anchors`

Word, phrase, beat, or silence anchors.

Fields:

- `id`
- `stroke_motion_plan_id`
- `transcript_segment_id`
- `anchor_type`: `word`, `phrase`, `pause`, `music_beat`, `scene_change`
- `anchor_text`
- `start_time`
- `end_time`
- `importance`
- `notes`

### `stroke_motion_generation_specs`

Worker-ready generation/render specs.

Fields:

- `id`
- `stroke_motion_plan_id`
- `target_renderer`: `svg`, `lottie`, `remotion`, `ai_assisted`, `other`
- `transparent_background_required` for future controlled renderers when transparency is explicitly needed
- `resolution`
- `fps`
- `duration_seconds`
- `style_constraints_json`
- `timing_constraints_json`
- `output_asset_requirements_json`
- `credit_estimate_id`
- `status`

## Joseph And Mary Example

This example uses the Joseph and Mary story, but Stroke Motion applies to all kinds of stories: business stories, real estate tours, product demonstrations, education, documentaries, personal stories, scripture, books, historical text, and documents.

### Source Reading

If the user reads Matthew 1:18-25, the AI should not animate literal words without understanding. It should first create `meaning_expansion`:

- Mary and Joseph were engaged.
- Mary was pregnant by the Holy Spirit.
- Joseph did not fully understand.
- Joseph wanted to separate quietly.
- An angel appeared in a dream.
- The angel explained the child was from God.
- Joseph obeyed and accepted Mary.

### Plan Summary

`stroke_motion_plans`:

- `understanding_mode`: `source_reading_mode`
- `source_text_type`: `scripture`
- `source_reference`: `Matthew 1:18-25`
- `story_summary`: Joseph moves from confusion to obedience after divine reassurance.
- `meaning_expansion_summary`: The source describes misunderstanding, mercy, revelation, and restored commitment.
- `animation_goal`: Show relationship, tension, divine message, and restoration with one connected stroke path.
- `transition_strategy`: connected transformation path.
- `timing_strategy`: word-level anchors for Mary, Joseph, angel, dream, and obeyed.

### Beat Examples

1. Relationship line
   - Meaning: Mary and Joseph are connected.
   - Visual action: two simple stroke characters connected by a thin line.

2. Holy glow
   - Meaning: pregnancy by the Holy Spirit.
   - Visual action: soft symbolic glow near Mary, not literalized or sensational.

3. Tension/crack
   - Meaning: Joseph misunderstands and feels conflict.
   - Visual action: relationship line develops a crack.

4. Separation path
   - Meaning: Joseph considers leaving quietly.
   - Visual action: path gently separates but does not accuse Mary.

5. Divine message line
   - Meaning: angel message in dream.
   - Visual action: symbolic line enters from above or side.

6. Repaired connection
   - Meaning: Joseph obeys and accepts Mary.
   - Visual action: line reconnects.

7. Protective circle
   - Meaning: restored commitment and protection.
   - Visual action: circle wraps around the couple.

## Connected Transition Principle

Stroke Motion should prefer connected visual transitions:

```text
relationship line
-> holy glow
-> tension/crack
-> separation path
-> divine message line
-> repaired connection
-> protective circle
-> fade/underline transition out
```

The animation should feel like one fast animated story, not random icons.

## Worker Notes And Rules

Planning should leave structured notes:

- Do not make Mary look guilty.
- Show Joseph's misunderstanding respectfully.
- Use one continuous stroke line through relationship, tension, separation, divine message, and restoration.
- Keep divine presence symbolic, not literal.
- Preserve emotional pause.
- Avoid loud SFX under speech.

These should be stored in:

- `edit_instructions`
- `worker_notes`
- `segment_notes`
- `must_follow_rules`
- `avoid_rules`

## Renderer Strategy

Stroke Motion should eventually use controlled animation systems such as SVG, Lottie, Remotion, or another deterministic renderer when possible because it needs word-level timing, inspectable output, and optional transparent overlays.

AI video models such as Wan, Hailuo, or Premium-only Veo final fallback may support approved animation beats, but the architecture should not depend only on full AI video generation for Stroke Motion. AI video generation should default to matching the approved white/near-white/custom panel background instead of requiring transparency.

## StoryTiming Handoff

Stroke Motion beats, matched words, timing anchors, transitions, SFX hints, and generation specs should become future StoryTiming anchors and events. StoryTiming should coordinate Stroke Motion start, beat, and completion timing with captions, speech meaning, music, SFX, Graphic Design, Real Motion, and render layer timing without replacing Stroke Motion planning.

