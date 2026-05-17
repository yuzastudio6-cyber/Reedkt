# Remotion Renderer Plan

## Purpose

ReeditPro plans to use Remotion as the controlled renderer and compositor layer for final video assembly. Remotion is not a replacement for GPT-Image-2, Wan, Hailuo, or Veo. AI generation outputs are assets; Remotion is the compositor; ReeditPro owns the final layout and timing.

## Why Remotion

Remotion gives ReeditPro a controlled final canvas for:

- Frame layouts for TikTok/Reels/Shorts, YouTube, and square outputs.
- Captions, caption safe zones, and timing.
- Speaker zones, animation panels, and safe margins.
- Timeline timing across story beats.
- Still image motion such as zoom, pan, slide, scale, opacity, count-up, highlights, and arrows.
- Graphic Design / VisualExplain cards, lists, timelines, evidence boards, and motion design.
- Placement of generated AI clips inside approved panel zones.
- Final assembly in a later rendering milestone.

## What Remotion Does

Remotion should:

- Lay out vertical, landscape, and square canvases.
- Own speaker/source footage zones, animation panel zones, and caption safe zones.
- Place user clips in the approved layout.
- Place GPT-Image-2 stills, cards, keyframes, designed frames, and graphic assets.
- Place Wan, Hailuo, and Premium-only Veo generated clips inside frame panels.
- Animate Graphic Design / VisualExplain cards deterministically.
- Animate stills with controlled editor motion.
- Control transitions between beats.
- Support StoryTiming and captions.

## What Remotion Does Not Do

Remotion does not:

- Replace GPT-Image-2.
- Replace Wan.
- Replace Hailuo.
- Replace Veo.
- Decide story meaning by itself.
- Bypass edit plan approval or credit estimate approval.
- Start rendering before approval.
- Authorize provider calls, backend work, exports, or credit deduction.

## Renderer Rule

AI models generate assets and clips only. They should not generate the whole final TikTok, YouTube, or square video. Remotion places those assets into the ReeditPro frame, applies timing, captions, cards, transitions, and controlled motion, and later becomes the final assembly layer.

## Frame Background Rule

AI video assets should be generated on matching white, near-white, or custom panel backgrounds by default. Remotion then places those clips into panels with the same background color. This avoids relying on transparent AI-video generation or background removal, which can fail around edges, scale, and framing.

Transparent overlays remain a future option for deterministic SVG, Lottie, Remotion, or controlled renderer outputs. They are not the default for AI video generation.

## Launch Renderer Policy

- Use Remotion as the planned renderer/compositor layer.
- Do not use Hyperframe for launch.
- Do not install Remotion or renderer infrastructure until the backend/rendering milestone.
- Keep renderer planning frontend/mock-only until explicit rendering work is requested.
