# Provider Prompt Architecture

## Purpose

Provider prompts are not random prompts. They are structured instructions generated from the approved ReeditPro planning stack:

- compiled user intent
- professional editing directive
- visual asset plan
- style mode
- frame layout
- segment edit operations
- provider route
- QA checks
- tier/model constraints

Prompt planning exists so future workers can send high-quality, policy-safe instructions to the correct provider without reinterpreting raw chat.

This document is architecture only. It does not implement provider calls, prompt submission, OpenAI calls, GPT-Image-2 calls, Wan/Hailuo/Veo calls, Remotion rendering, backend, Supabase, billing, migrations, or exports.

## Prompt Ownership

ReeditPro owns:

- story meaning
- user request interpretation
- edit style
- visual asset decision
- frame layout
- safe zones
- caption/visual placement
- provider routing
- QA checks
- fallback logic

Providers only generate:

- images
- stills
- cards
- keyframes
- AI video clips
- animation assets

Providers do not own:

- final canvas
- final edit order
- final layout
- credit approval
- tier rules
- source order decisions
- QA requirements

Remotion owns final layout, composition, timing, captions, panel placement, and renderer assembly.

## Prompt Types

Prompt planning supports:

- `image_prompt`
- `start_frame_prompt`
- `end_frame_prompt`
- `still_card_prompt`
- `graphic_design_prompt`
- `motion_design_prompt`
- `stroke_motion_video_prompt`
- `real_motion_video_prompt`
- `veo_fallback_prompt`
- `negative_prompt`
- `remotion_motion_brief`
- `qa_prompt_notes`

## Provider-Specific Behavior

### GPT-Image-2

GPT-Image-2 is used for still images, keyframes, cards, character references, start frames, end frames, and graphic design frames.

Prompts should include exact style, background, frame/panel color, safe composition, character consistency, and asset purpose. Cards should include only intentional text, readable hierarchy, and clean Graphic Design / VisualExplain layout.

### Wan 2.2 KF2V Flash

Wan 2.2 KF2V Flash is used for five-second start-frame plus end-frame scenes.

Prompts should be concise and emphasize the transition between first and last frame. They should preserve style, characters, composition, matching panel background, and safe margins. Audio is off by default. Output stays 720P.

### Wan 2.6 I2V Flash

Wan 2.6 I2V Flash is used for start-frame-only clips from two to fifteen seconds.

Prompts should describe the motion clearly, preserve character/style/frame background, stay readable without audio, and keep action inside safe margins. Output stays 720P.

### Hailuo 2.3 Fast

Hailuo 2.3 Fast is used as start-frame-only fallback/alternate.

Prompts should stay under 2000 characters, remain direct, preserve style, use matching panel background, avoid transparent-background defaults, and output 768P.

### Hailuo-02

Hailuo-02 is used for start-frame plus end-frame six-second or ten-second fallback.

Prompts should stay under 2000 characters and clearly describe the transition from first frame to last frame. Output stays 768P.

### Veo 3.1 Lite

Veo 3.1 Lite is Premium-only and final fallback/rescue only. It is never primary and never available to Basic or Pro.

Veo prompt plans may be more structured and story-aware, but they may be created only when the edit level is Premium and the provider route includes Veo as final fallback.

### Remotion

Remotion does not need an AI-video prompt. It needs a motion brief:

- layer timing
- motion preset
- card/graphic behavior
- safe zones
- captions
- panel layout
- transition timing

Remotion owns final composition.

## Frame Background Rule

All image and video prompts should include:

- use a plain matching panel background
- background color should match the frame panel
- keep action inside safe margins
- do not depend on transparent background
- avoid transparent background unless the route explicitly requires controlled renderer transparency

AI-video generation defaults to matching white, near-white, or custom frame panel backgrounds.

## Prompt Safety

Prompts must include:

- no random extra characters
- no unrelated scenery
- no style drift
- no face/product obstruction
- no text unless the asset is a card or graphic that needs text
- avoid realism for Stroke Motion unless the asset is Real Motion
- avoid childish/cartoonish style when the user asked for serious or professional
- documentary/case-study names and claims must be treated neutrally unless verified

## Tier Policy

The prompt builder must enforce:

- Basic and Pro never generate allowed Veo prompts.
- Premium can generate a Veo fallback prompt only when the route includes Veo as final fallback.
- No provider prompt can default to 1080P.
- No prompt can imply Veo is default.

## Future Approved Snapshot

Prompt plans should be stored in approved snapshots later. Workers should use approved prompt plans, not invent prompts from scratch or reinterpret raw chat.
