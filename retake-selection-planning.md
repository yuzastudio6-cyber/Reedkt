# Retake Selection Planning

## Purpose

Retake selection helps ReeditPro handle repeated takes, retry clips, alternate versions, false starts, repeated explanations, take 1/take 2/take 3 naming, retry/again/final/alt naming, repeated product demos, repeated hook attempts, and repeated CTA attempts.

A professional editor should not keep every repeated take, but ReeditPro must not blindly delete earlier takes. The best take may be the clearest explanation, strongest emotion, cleanest audio, best visual framing, least mistake-prone option, best product/demo continuity, strongest hook, best ending, user-marked important source, or most complete tutorial step.

## Mock-Only Detection

Until real transcript and media analysis workers exist, retake groups are inferred only from structured/mock context:

- file names and notes
- uploaded order
- source roles
- important/optional flags
- custom instructions
- demo scenario metadata
- video understanding mock summaries

The planner must state that no real transcript comparison, semantic comparison, audio quality analysis, visual quality analysis, or media inspection has run.

## Retake Selection Strategies

- `latest_good_take`: choose the later take when no stronger signal exists.
- `clearest_explanation`: prefer the candidate that appears most explanatory from notes/roles/mock summaries.
- `strongest_emotion`: prefer the candidate that supports a story or emotional beat.
- `best_audio_visual_quality`: prefer candidate metadata that suggests cleaner audio/visual quality.
- `user_marked_important`: preserve the user-marked important take.
- `preserve_multiple_for_broll`: keep alternates as b-roll/support.
- `preserve_multiple_for_context`: preserve multiple takes when context or proof might matter.
- `ask_user_review`: require review when mock confidence is low.
- `custom`: follow explicit user direction.

## Retake Decisions

Each retake group should include candidates, selected take, alternates, reason, confidence, user-review requirement, fallback decision, and QA checks.

## Category Behavior

- Storytelling: choose strongest emotion or clearest story beat; preserve alternate reactions if useful.
- Education: choose clearest explanation; keep alternates only when they add clarity.
- Documentary / Case Study: preserve context and proof when uncertain; user review when selection could affect claim meaning.
- Business / SaaS / Product: choose clean product/demo continuity; do not cut required UI or action steps.
- Lifestyle / Behind the Scenes: preserve authenticity when requested; avoid over-polishing unless requested.

## Tier Behavior

- Basic: simple grouping; choose obvious best take or ask for review.
- Pro: stronger selection and b-roll/alt take repurposing.
- Premium: deeper alternate take strategy, richer selects, and more review notes.

## Non-Goals

This milestone does not implement real transcript comparison, semantic comparison, media comparison, silence detection, FFmpeg/VapourSynth execution, rendering, provider calls, backend work, or worker execution.
