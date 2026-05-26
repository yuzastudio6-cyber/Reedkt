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

- Use the production render stack decision in `docs/production-render-stack-decision.md` as the current architecture lock.
- Hyperframe is the planned editor/timeline/interactive preview layer.
- Remotion remains the programmatic composition/render-template layer.
- FFmpeg, libass, and OpenTimelineIO complete the core render/export/interchange stack.
- Revideo is evaluation-only and not core.
- Do not install Remotion or renderer infrastructure until the backend/rendering milestone.
- Keep renderer planning frontend/mock-only until explicit rendering work is requested.

## RP-FRAME-02 Output Frame Gate

Remotion composition planning must derive canvas size, safe zones, panel zones, caption placement, and export assumptions from the user-confirmed output frame. A platform recommendation is not enough.

## Master Timing Dependency

The Renderer Composition Plan should reference `masterTimingPlanId`. Remotion sequence duration, fps, layer start/end frames, caption layer timing, visual panel timing, and transition timing should come from the Master Timing Plan.

This milestone still does not render video. Master Timing is frame-accurate mock metadata and future Remotion workers must use the approved snapshot timing contract before production rendering.

## Caption + Visual Cue Timing Dependency

Renderer planning should prefer refined Caption + Visual Cue Timing when it exists. Caption layers should use refined caption frame ranges and animation policy. Visual layers should use visual cue trigger frames, reveal/hold/exit timing, read-time notes, and collision recommendations.

This still does not render. The refined timing is metadata for future Remotion workers.

If the frame is unconfirmed, renderer planning remains draft-only and must not claim render-ready. Changing the frame resets approval, progress, preview, and the approved snapshot.

## SoundSync + Transition Timing Inputs

Remotion composition planning should consume `SoundSyncTransitionTimingPlan` when present. Transition layers use refined start/end frames, SFX markers use cue-linked frame timing, and audio mix briefs reference ducking ranges from the refined plan.

This is still planning-only. Browser-safe preview is not production rendering, and RP-TIMING-03 does not execute Remotion, FFmpeg, AudioFlux, Signalsmith Stretch, SFX generation, or media processing.

## Timing Validation Gate

Renderer composition planning should reference timing validation status when available. If timing validation is blocking or failed, the renderer plan must not be render-ready and approved snapshots must not freeze the plan.

## Editing Agent Execution Dependency

The Editing Agent Execution Plan models future renderer work as async work items:

- prepare Remotion layer metadata
- allow browser-safe placeholders only when a dependency explicitly permits `can_use_placeholder`
- wait for required generated/provider/tool assets before final export
- run timing and final QA before final render
- store the final export as an asset manifest entry after future render completion

This lets independent caption, timing, layout, asset, and QA work continue while provider/tool jobs are pending. It does not execute Remotion rendering, create queues, or store render outputs in this frontend milestone.

Remotion layer timing still comes from Master Timing plus refined Caption/Visual and SoundSync timing. Timing validation checks the structured plan only; it does not render or inspect frames.
## Async Asset Readiness

Remotion remains the final compositor, but final render readiness must respect `AsyncAssetReconciliationPlan` when present.

Final render waits for required assets, merged renderer layers, timing validation, trim review resolution, QA, and an approved snapshot. Preview rendering may use placeholders only when dependency readiness explicitly allows `can_use_placeholder`, and those placeholders must never be treated as final required assets.

This milestone does not run Remotion, render previews, render final exports, store assets, check provider status, or execute workers.

## Agent QA + Fallback Readiness

Renderer planning should respect `AgentQAFallbackPlan` when present. A blocked render preflight gate or unresolved required failure keeps final render blocked.

Preview can continue only with explicitly planned placeholders. Final render must wait for required assets, QA gates, fallback decisions, timing validation, trim review, and approved snapshot readiness.

No real rendering, QA, retry, fallback execution, provider call, or worker execution happens in this frontend mock.
