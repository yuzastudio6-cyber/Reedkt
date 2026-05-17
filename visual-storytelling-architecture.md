# Visual Storytelling Architecture

## Purpose

ReeditPro is a hybrid AI visual storytelling editor, not an animation-only tool. The planner should understand the user's story, break it into beats, choose the right asset type for each beat, estimate credits, and ask for approval before any expensive generation, rendering, or provider work begins.

The chat remains the primary editor. Visual planning appears in chat only when the AI needs user input, confirmation, approval, progress, or preview.

## Beat-Based Story Planning

ReeditPro stories are broken into beats. Each beat should have a story purpose before it receives any visual treatment.

Each beat can become:

- Still image.
- Fact card.
- Name card.
- Character card.
- List card.
- Timeline card.
- Graphic design frame.
- Motion design scene.
- Stroke Motion animation.
- Real Motion scene.
- Editor-motion scene.
- Transition scene.
- No extra visual.

The story decides the asset type. The workflow dropdown provides context only; it does not force animation, Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, or any provider route.

## Still/Card Versus Animation

Use still/card assets when clarity matters more than movement:

- Names.
- Facts.
- Money amounts.
- Lists.
- Evidence.
- Screenshots.
- Maps.
- Quote cards.
- Timeline points.
- Object reveals.
- Short informational beats.

Use animation when movement improves the story:

- Movement or transformation.
- Emotional reaction.
- Conflict.
- Reveal.
- Character action.
- Cause and effect.
- A change of state that viewers need to feel or understand.

Not every beat should become an animation. A professional Basic edit can use clean cuts, captions, still cards, and editor motion while avoiding unnecessary generated assets.

## Character And Visual Consistency

Character consistency must work across both still and animated assets.

- GPT-Image-2 creates character anchors, still images, keyframes, fact cards, name cards, graphic design frames, start frames, and end frames.
- Wan, Hailuo, and Veo animate only beats where motion improves the story.
- Start frames and end frames should preserve character identity, wardrobe, emotional state, scene logic, and frame/panel background.
- If a character or object must recur, the plan should identify the consistency need before generation.

## Signature System Roles

Stroke Motion is narrative motion storytelling for emotion, transformation, action, and story beats.

Graphic Design / VisualExplain should prefer controlled layouts and editor motion when exact text, diagrams, labels, frameworks, or proof cards matter. GPT-Image-2 can assist with frame/card design, but ReeditPro should own final text, timing, and composition where precision is required.

Real Motion is premium, credit-heavy, overlay-first, and face-safe. It should support real objects, places, products, proof, demonstrations, or symbolic visual moments without replacing the user's footage by default.

SoundSync is not a visual signature system. It is the audio and timing support engine for music, SFX, beat timing, ducking, transitions, and emotional polish.

StoryTiming coordinates captions, cuts, visuals, sound, timing, beat placement, and story logic.

## Approval And Credits

All generation must remain behind the approval and credit estimate gate.

- Estimate credits before generation.
- Deduct credits only after approval.
- Do not start expensive AI editing, rendering, or provider work before the user approves the edit plan and credit estimate.
- Failed ReeditPro generation should follow the refund rules in `pricing-and-credits.md`.
- Real Motion and Premium fallback routes must be clearly estimated before approval.
