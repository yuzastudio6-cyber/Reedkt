# Model Routing Policy

## Edit Agent Model Roles

ReEditPro separates editorial reasoning from source/video understanding. These are backend model-role boundaries, not permission to call providers from the frontend.

The canonical reasoning route is ordered and may not be skipped:

1. Kimi K3 through `kimi_k3_main_edit_agent` is the primary route for user-intent reasoning, edit planning, creative edit strategy, edit-QA reasoning, tool code, and Remotion drafts.
2. Qwen 3.7 through the retained compatibility identifier `qwen_3_7_main_edit_agent` is the first full-capability fallback. The identifier is persisted compatibility metadata; it no longer means Qwen is the default route.
3. DeepSeek V4 Pro through the retained compatibility identifier `deepseek_v4_tool_code_agent` is the final full-capability fallback. It may perform reasoning or coding only after the two earlier routes have reached an allowed terminal failure.

Qwen2.5-VL through `qwen2_5_vl_visual_understanding` remains a separate visual-understanding specialist. It produces source-bound, timestamped visual evidence for the reasoning route. It must not create canonical edit authority independently, and Kimi/Qwen/DeepSeek must not claim that they inspected video when no visual-specialist evidence exists.

Fallback is permitted only for a classified provider availability/rate-limit/timeout/transient error, malformed structured output, or deterministic quality-validation failure. Missing approval, reservation, immutable snapshot, tenant authority, safety authority, or a valid request blocks the operation instead of selecting another model. The final DeepSeek failure requires deterministic recovery or user review.

All four roles remain backend/provider-gated. This policy does not activate a provider, read a secret, dispatch a worker, or make a model call.

## Visual Specialist Runtime Boundary

For production, "ReEditPro-hosted" means Qwen2.5-VL runs on private ReEditPro Google Cloud GPU workers. It does not run in the customer's browser or on the customer's computer. "Development-only proof" means workstation/container evidence and must never be presented as deployed Google Cloud proof.

The intended visual path preserves the immutable original media for editing/export, creates bounded analysis proxies for whole-source coverage, increases sampling around ambiguous or important windows, and uses targeted original-resolution crops for fine text, products, faces, or color detail. Evidence must be cached by immutable source checksum, exact model/checkpoint, and sampling-policy version. Quality gates decide whether denser inspection is required; cost optimization must not remove required coverage.

An external visual API may be introduced only as a separately approved overflow or recovery route after quality, privacy, cost, and operational evidence exists. It is not silently interchangeable with the private Google Cloud worker.

## Reasoning Cost Boundary

Every attempted reasoning route, including a failed attempt that triggers fallback, must retain provisional internal provider-cost evidence bound to the exact approved snapshot, reservation, idempotency key, request hash, response-usage hash, route ordinal, outcome, and rate-card version.

- Kimi and DeepSeek rates are recorded in their native USD pricing boundary.
- Qwen rates are recorded in native CNY. USD normalization requires an immutable, sourced FX snapshot; ReEditPro must not guess an exchange rate.
- Qwen2.5-VL on ReEditPro-hosted Google Cloud is infrastructure cost: GPU/CPU runtime, storage, and networking. It is not assigned a provider-token price without an approved external-provider route.
- Internal production cost is separate from customer price, customer credits, wallet mutation, and the ReEditPro service fee.

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
