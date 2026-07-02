# Adaptive Edit Strategy Planner

## Purpose

The Adaptive Edit Strategy Planner turns user intent and the Video Understanding Report into segment-level creative decisions. It decides what each segment should accomplish, what visual support is needed, what layout mode is best, what tool category might help later, what should stay simple, what should be animated, what should be a still/card, what should become a full visual takeover, what is too risky or expensive for the tier, and why the decision was made.

This planner exists to keep ReeditPro from editing every video with the same template.

## Inputs

The planner uses:

- compiled user intent
- video understanding report
- reference DNA
- editing category
- edit level
- target platform
- aspect ratio
- source sequence mode
- source order confirmation
- professional editing directive
- visual preference
- credit preference
- quality standards
- model routing constraints
- frame/layout rules
- fact safety and character consistency constraints

User instructions remain higher priority than default analysis. Video understanding informs the plan, but it does not override explicit instructions unless safety, tier, model policy, approval, or technical constraints require it.

## Output

The planner produces:

- overall adaptive strategy summary
- segment strategy items
- hook strategy
- pacing strategy
- speaker/visual layout recommendation
- visual support recommendation
- tool need hints
- generation restraint notes
- cost/credit complexity notes
- QA implications
- fallback strategy
- user instruction alignment notes

Every segment strategy should explain what the viewer needs to see and why the planner chose speaker focus, visual takeover, both, b-roll, a card, a map, a chart, Stroke Motion, Real Motion, captions only, or no extra visual.

## Decision Principles

- The user's explicit request comes first unless blocked by safety, tier, model policy, approval, or technical constraints.
- Video understanding informs what the footage needs.
- Do not add visuals just because a category usually uses them.
- Use stills, cards, Remotion, and controlled tool-based visuals when exact text, labels, maps, arrows, or charts matter.
- Use AI video only when organic motion or generative animation actually improves the segment.
- Keep the speaker visible when trust, emotion, authenticity, or personal story matters.
- Let visuals take over when explanation, evidence, map, chart, timeline, diagram, or screen capture needs space.
- Avoid clutter.
- Avoid random b-roll.
- Avoid random transitions.
- Basic should be professional, safe, and simple.
- Pro is the main balanced production tier.
- Premium allows deeper fallback and QA, but does not default to Veo.

## Strategy Examples

### Storytelling Couple Scene

- Setup: warm source footage, speaker/story framing, simple captions.
- Reveal: strong speaker reaction or restrained Stroke Motion if the story benefits.
- Confusion: animated story beat only if it clarifies the moment.
- Ending: sadness or isolation can use still/editor motion or a focused speaker close.
- Pro does not use Veo.

### Education Money Flow

- Use Graphic Design / VisualExplain, diagram, chart, or later Remotion/D3-style controlled visuals.
- Avoid AI video for exact labels, arrows, numbers, and account flow.
- Speaker can become voiceover while the visual takes over when explanation needs space.

### Documentary Scam Case

- Use evidence board, timeline cards, source cards, name cards, and selected reenactments only when useful.
- Fact safety stays active.
- Character consistency stays active for recurring visualized figures.
- Premium may include Veo only as final fallback/rescue, never primary.

### Business Product

- Use product feature callouts, screen capture when a dashboard/app is central, and VisualExplain for benefits.
- Real Motion is used only when realistic product/proof motion improves the segment.
- Exact interface detail should prefer screen capture or controlled editor motion over generated video.

### Lifestyle Basic

- Keep speaker/source footage primary.
- Use light captions, clean pacing, warm natural color, and minimal graphics.
- Avoid heavy AI video and keep the result professional rather than plain.

## Tier Behavior

Basic identifies opportunities but favors captions, uploaded b-roll, still cards, lower panels, simple Remotion/editor motion, and no Veo.

Pro supports balanced visual planning, controlled maps/charts/screen work, Stroke Motion where useful, Wan primary, Hailuo fallback, and no Veo.

Premium supports deeper fallback, richer layout/depth QA, more complex visual strategies, and Veo only as final fallback/rescue.

## Non-Goals

This task does not:

- run real video analysis
- generate transcripts
- install tools
- call providers
- render video
- process media
- create backend persistence
- deduct credits
- execute workers
