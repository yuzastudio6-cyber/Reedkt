# ReeditPro Signature Systems

## Overview

ReeditPro has three visual signature systems:

1. Stroke Motion
2. Graphic Design / VisualExplain
3. Real Motion

SoundSync is still important, but it is not the third visual signature system. It is the audio and timing support engine. StoryTiming is the coordination engine that keeps captions, cuts, visuals, sound, and story beats aligned.

For backend/database architecture, see `stroke-motion-data-model.md`, `generation-provider-architecture.md`, and `job-orchestration-architecture.md`. Stroke Motion supports `spoken_story_mode` and `source_reading_mode`; source reading requires `meaning_expansion` before animation planning.

ReeditPro is a hybrid visual storytelling system. Not every story beat should become animation. Beats may become stills, cards, graphic frames, motion design, Stroke Motion, Real Motion, transitions, or no extra visual depending on what improves the story.

AI video generation should default to matching white, near-white, or custom frame panels inside ReeditPro's editor/compositor. Transparent overlays remain valid for controlled renderer systems such as SVG, Lottie, Remotion, or other deterministic outputs, but transparent AI video backgrounds are not the default.

## Stroke Motion

Stroke Motion is 2D overlay motion storytelling. It is used for emotion, story, emphasis, transformation, movement, speaker-aligned visual motion, and simple visual metaphors.

Stroke Motion should:

- Stay tied to transcript meaning and story beats.
- Feel lightweight and integrated.
- Use still/card or panel-based visuals when animation is not needed.
- Support the speaker's message instead of decorating randomly.
- Appear as an editable visual layer in future editor work.
- Vary by segment instead of repeating the exact same animation.

## Graphic Design / VisualExplain

Graphic Design / VisualExplain creates clean overlay graphics for education, explanation, concepts, diagrams, lists, frameworks, product features, and visual understanding.

VisualExplain should:

- Clarify ideas.
- Use strong hierarchy and readable text.
- Avoid cluttering the video.
- Support explanations, not replace them.
- Use diagrams, callouts, cards, labels, comparison layouts, and clean information graphics where useful.

## Real Motion

Real Motion creates realistic animated overlay objects or scenes inside the user's video. It is used when the speaker talks about real objects, products, places, proof, demonstrations, or symbolic visual moments.

Real Motion should:

- Stay integrated as an overlay inside the user's footage.
- Keep the speaker/user video as the base layer.
- Avoid blocking the speaker's face unless intentionally planned.
- Scale objects based on meaning.
- Use the same blueprint family for repeated topics when useful, but never repeat the exact same animation every time.
- Be treated as premium and credit-heavy.

## SoundSync Support Engine

SoundSync supports:

- Music
- SFX
- Beat timing
- Mood
- Ducking
- Transition sounds
- Emotional polish

SoundSync can support any video type and any signature system, but it is not a visual signature system.

## StoryTiming Coordination Engine

StoryTiming coordinates:

- Captions
- Cuts
- Stroke Motion
- Graphic Design / VisualExplain
- Real Motion
- SoundSync
- Story beats
- Platform pacing

StoryTiming decides when elements appear, how long they remain, and how they support speech, emotion, and viewer comprehension.

Future StoryTiming work should consolidate existing timing records into a Master Timing Map. It should coordinate timing across Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, captions, cuts, and render timing without replacing the systems that decide what those layers are.

## Segment-By-Segment Routing Logic

The AI planner should decide systems per segment based on:

- User instructions
- Video type dropdown context
- Edit level
- Uploaded clip order
- Transcript
- Visual footage
- Reference video style
- Platform
- Credit budget
- Whether the visual actually improves the video

## Dropdown Rule

The video type dropdown gives workflow context only. It does not automatically decide which signature systems are used.

All video types can use:

- Stroke Motion
- Graphic Design / VisualExplain
- Real Motion
- SoundSync
- None

No workflow profile should force a signature system. The AI must justify system usage in the edit plan.

## Same Topic, Different Generation

The same topic can reuse a blueprint family, but the exact same animation should not be reused every time.

Example: If multiple videos mention "saving money," Real Motion might reuse a finance blueprint family such as bills, coins, receipts, or charts, but it should vary object scale, motion path, timing, layout, and emphasis based on the specific segment.
