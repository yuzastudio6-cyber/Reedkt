# Model Routing Policy

## Launch Router

ReeditPro's launch router separates still/keyframe generation from animation/video generation.

- Image, still, keyframe, graphic, and frame model: GPT-Image-2.
- Animation stack: Wan primary, Hailuo fallback, Veo 3.1 Lite Premium-only final fallback.
- Seedance 1.5 Pro is not part of the launch router.
- Veo must never be the default primary model.
- Basic must never use Veo.
- Pro must never use Veo.
- Premium may use Veo 3.1 Lite only as final fallback/rescue after Wan and Hailuo are unsuitable, fail QA, or the scene is marked critical.

## Resolution Defaults

Default generated video output should be 720P-class. ReeditPro should never default generated AI video to 1080P.

- Wan: 720P.
- Veo: 720P.
- Hailuo: 768P.
- GPT-Image-2 and deterministic editor renderers: frame/canvas resolution.

## GPT-Image-2 Still And Keyframe Route

GPT-Image-2 creates:

- Character anchors.
- Still scenes.
- Keyframes.
- Fact cards.
- Name cards.
- Graphic design frames.
- Start frames.
- End frames.

GPT-Image-2 is the default route for still/card/graphic/frame needs. It also prepares start and end frames for animation providers when motion is justified by the story.

## Animation Routes

### Wan 2.2 KF2V Flash

Use for a 5-second story beat when the planner has a start frame and an end frame.

- Primary route for start/end short animation.
- Default resolution: 720P.
- Typical use: Stroke Motion or Real Motion beat that needs a defined visual change over exactly 5 seconds.

### Wan 2.6 I2V Flash

Use for start-frame-only animation with flexible duration.

- Primary route for start-frame animation.
- Default resolution: 720P.
- Duration: 2-15 seconds.
- Silent/no-audio generation is preferred.

### Hailuo-02

Use as normal fallback/alternate when start and end frames are available.

- Start frame plus end frame.
- Duration: 6 or 10 seconds.
- Default resolution: 768P.

### Hailuo 2.3 Fast

Use as normal fallback/alternate when only a start frame is available.

- Start-frame-only fallback.
- Default resolution: 768P.

### Veo 3.1 Lite

Use only for Premium final rescue.

- Premium-only.
- Fallback-only.
- Never primary.
- Default resolution: 720P.
- Use only when Wan/Hailuo fail, are unsuitable, fail QA, or when a critical Premium scene needs stronger prompt following.

## Graphic Design / VisualExplain Route

Graphic Design / VisualExplain should use GPT-Image-2 frame/card design plus deterministic editor motion first.

- Use controlled layouts when exact text, diagrams, labels, frameworks, or proof cards matter.
- Prefer Remotion/editor motion, SVG, or Lottie for exact timing and readable text.
- No Veo for any tier.
- Default resolution: frame/canvas resolution.
- Duration: 0 for stills; editor-controlled for deterministic motion.

## Real Motion Route

Real Motion remains premium and credit-heavy when used.

- GPT-Image-2 creates keyframes and still anchors.
- Wan is the primary animation route.
- Hailuo is the normal fallback.
- Veo 3.1 Lite is Premium-only final rescue.
- Basic and Pro never use Veo.
- Real Motion should remain overlay-first and face-safe.

## Approval Gate

All provider routing is planning data until the user approves the edit plan and credit estimate. This document does not authorize provider calls, backend work, rendering, export, billing, or credit deduction.
