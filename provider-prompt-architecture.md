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
- source cleanup, trim review, timing validation, and editing agent execution context
- QA checks
- tier/model constraints

Prompt planning exists so future workers can send high-quality, policy-safe instructions to the correct provider without reinterpreting raw chat.

Provider prompt plans feed the Editing Agent Execution Plan as future provider work items. The execution graph can queue/check back on image or AI video generation while unrelated caption timing, layout, SoundSync timing, tool planning, and QA work continues. Provider prompts remain plans; RP-AGENT-01 does not call GPT-Image-2, Wan, Hailuo, Veo, OpenAI, or any provider API.

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

The editing supervisor owns dependency tracking. If an AI video prompt depends on a generated start frame, the graph must represent that dependency and the asset manifest must track both assets before final render can proceed.

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

## RP-FRAME-02 Output Frame Gate

Provider prompt plans must use the confirmed output frame, visual zone, safe margin, caption safe zone, and panel background. If the aspect ratio is only recommended, prompt plans stay draft/blocked and must not be executable.

AI models generate assigned assets or clips only. They do not create the final canvas unless a later render strategy explicitly scopes a controlled asset, and Remotion remains responsible for final composition.

## Master Timing Notes

Provider prompt plans should include timing notes from the Master Timing Plan: expected provider clip duration, placement frames, start/end frame purpose, and visual hold/read timing where useful.

Wan, Hailuo, and Veo prompts create assets or clips only. Remotion places those assets into the final canvas using the approved Master Timing Plan. Unconfirmed frame/timing blocks executable provider prompts.

## Caption + Visual Cue Timing Notes

Provider and Remotion briefs should include refined caption/visual cue notes when available: caption safe-zone constraints, visual cue trigger frames, label hold/read time, reveal/hold/exit frames, collision avoidance recommendations, and whether captions overlay the generated asset.

If the refined cue timing is blocked, provider-executable prompts remain blocked. AI video clips are still assets placed by Remotion, not final canvases.

## SoundSync + Transition Notes

Provider and Remotion briefs should include `soundSyncTransitionNotes` when a SoundSync + Transition Timing Plan exists. Notes may describe transition start/end frames, SFX cue frames, music ducking ranges, and beat/phrase timing context.

AI video prompts should remain silent asset prompts unless a future approved provider explicitly supports audio. Remotion owns transition placement, SFX timing, and final audio/layout assembly. AudioFlux is represented only as a future analysis tool and is not executed by prompt planning.

## Timing Validation Notes

Provider and Remotion briefs should include timing validation status when available. If `TimingValidationPlan.approvalBlocked` is true or the status is blocking/failed, provider-executable prompts stay draft/blocked.

Providers should not solve timing validation issues. Remotion and future approved workers execute timing from approved snapshots.
## Async Dependency Notes

Provider prompt plans may reference `AsyncAssetReconciliationPlan` when available. The prompt remains a plan, not an execution request.

Dependent prompts should stay draft/blocked when required upstream assets are missing. For example, an AI video prompt that needs a generated start image should wait for the start-image asset to be checked back, merged, QA-checked, and reconciled into the correct segment/timing/layer before future execution.

Provider outputs are not complete until the asset manifest, merge plan, version policy, and QA state are reconciled. No provider API calls, status checks, webhooks, polling, or asset storage happen in the frontend mock.

## Agent QA + Fallback Notes

Provider prompt plans may reference `AgentQAFallbackPlan` when available. Provider request gates must preserve tier/model rules before any future provider execution.

If a provider request gate is blocked, the prompt should remain draft/blocked. Fallback notes may explain retry, simpler prompt, still/card, motion design, Remotion-only, Hailuo fallback, or Premium-only Veo final rescue when allowed.

Basic/Pro cannot use Veo. Premium Veo is final fallback only for approved AI video assets. Maps, charts, browser captures, captions, timing, and masks should not fallback to AI video.
