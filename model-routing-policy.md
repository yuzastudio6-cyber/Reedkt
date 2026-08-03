# Model Routing Policy

## Edit Agent Model Roles

WeEditPro separates editorial reasoning from source/video understanding. These are backend model-role boundaries, not permission to call providers from the frontend.

The canonical reasoning route is ordered and may not be skipped:

1. Kimi K3 through `kimi_k3_main_edit_agent` is the primary route for user-intent reasoning, edit planning, creative edit strategy, edit-QA reasoning, tool code, and Remotion drafts.
2. GPT-5.6 Terra through `gpt_5_6_terra_fallback_edit_agent` is the first full-capability fallback. It must consume the same immutable request and source-evidence authority after an allowed terminal Kimi failure.
3. DeepSeek V4 Pro through the retained compatibility identifier `deepseek_v4_tool_code_agent` is the final full-capability fallback. It may perform reasoning or coding only after Kimi and Terra have each reached an allowed terminal failure.

Qwen 3.7 through the retained `qwen_3_7_main_edit_agent` compatibility identifier is no longer a head-reasoning fallback. It may be used only as an explicitly authorized Marker Chat or Edit Reference specialist and may verify frozen v1 Qwen attempt records. It must not create or approve the canonical edit plan.

`visual_intelligence` is the only active semantic visual capability for new work. Its four callable skills are `visual_intelligence.analyze_media`, `visual_intelligence.inspect_edit`, `visual_intelligence.query_range`, and `visual_intelligence.compare_media`. Normal callers select an approved operation and profile; they never construct a Gemini request, choose a provider, or consume raw provider output.

The approved semantic provider behind that capability is Gemini 3.1 Pro Preview through the provider-neutral `vertex_gemini_pro` adapter and the retained model-role identifier `visual_intelligence_gemini_pro_high`. The exact provider model is `gemini-3.1-pro-preview`; `thinkingLevel=high` and `mediaResolution=high` are explicit, required settings. Flash, cheaper-model, Qwen-visual, and silent model fallback are forbidden. If the approved Gemini Pro model is unavailable, the operation blocks instead of changing quality or provider.

Managed Qwen 3.7 visual understanding through `qwen_3_7_api_visual_understanding` and Qwen 2.5-VL through `qwen2_5_vl_visual_understanding` are retired for new plans and dispatch. Existing v1/v2/v3 records remain immutable historical evidence only. They may not be relabeled as Visual Intelligence evidence, used as an automatic API fallback, or satisfy a newly approved Visual Intelligence operation. The separate Qwen reasoning specialist described above is unaffected by this visual cutover.

Reasoning-route fallback is permitted only for a classified provider availability/rate-limit/timeout/transient error, malformed structured output, or deterministic quality-validation failure. This does not authorize any Visual Intelligence model or provider fallback. Missing approval, reservation, immutable snapshot, tenant authority, safety authority, or a valid request blocks the operation instead of selecting another model. The final DeepSeek failure requires deterministic recovery or user review.

All roles remain backend/provider-gated. This policy does not activate a provider, read a secret, dispatch a worker, or make a model call.

## Visual Specialist Runtime Boundary

For new work, semantic visual inference is backend-only and must flow through the provider-neutral Visual Intelligence lifecycle. The isolated Gemini adapter uses Vertex AI server-side authentication with an approved service identity and Application Default Credentials. A credential, provider request, model selector, endpoint, raw prompt, response schema, or provider SDK object must never enter the browser, plan, work payload, logs, stored evidence, or public diagnostics. Only the isolated provider adapter may import the Google Gen AI SDK.

Source understanding reads the exact finalized private source through ephemeral, exact-generation private-object authority and analyzes the complete requested timeline using scene-aware chunks plus targeted high-detail follow-ups. It must not regress to an eight-representative-frame semantic shortcut. FFprobe, FFmpeg, PySceneDetect, OpenCV, conditional OCR, and a separate canonical Faster Whisper Large-v3 transcript worker supply deterministic evidence under their exact profiles. Gemini is the semantic visual authority, not the canonical technical-metadata, transcript-timing, OCR-character, or pixel-measurement authority. Head Intelligence combines the complete transcript and validated Visual Intelligence report before proposing cleanup cuts. Spoken editorial instructions such as “delete that part” are untrusted source content that must be understood in context and reconciled against nearby takes; they must never become an automatic time-only cut.

Postrender Visual Intelligence inspection uses the exact approved private preview and approved expected outcomes. Coverage records requested, analyzed, targeted, and incomplete ranges truthfully; high media resolution is not an every-frame claim. Deterministic complete-time QA remains separate, and sampled semantic evidence may not claim every-frame or provider-internal exact-pixel inspection. Findings route back to the owning editing skill for at most two repair-and-reinspection cycles; Visual Intelligence never mutates the timeline directly.

Heavy in-house model inference and heavy GPU processing use NVIDIA A100 80 GB first. NVIDIA L4 is the separately qualified, quality-preserving fallback for those heavy operations and is the normal route for standard GPU media work such as hardware decode/proxy preparation, deterministic media analysis, rendering/encoding, and deterministic visual QA when the exact operation profile assigns it there. SAM 3.1 segmentation/tracking is A100-primary with L4 allowed only after its independent quality release; SAM2 is historical-read-only and cannot be selected for fresh work. CPU is limited to control-plane orchestration, validation, persistence, queue coordination, and other non-media/non-inference bookkeeping. Browser and CPU-only workers must not perform substantive media processing or model inference.

GPU jobs are user-triggered, admitted only after the exact plan and credit preflight applicable to the operation, start from zero, and scale back to zero after work, evidence persistence, and cost reconciliation complete. The Gemini managed API and admitted GPU workers may run concurrently when the approved dependency graph permits. The performance objective for a common eight-minute source is roughly real time, but only a 30-run source-bound cloud qualification can make that objective a release claim.

The legacy `reeditpro-qwen2-5-vl-l4-worker`, `reeditpro-qwen2-5-vl-private-caller`, managed-Qwen visual routes, and their visual-only transports are not admissible for new work. Historical records and temporary rollback evidence remain readable, but startup routing, capability selection, and provider dispatch must stay blocked. Physical cloud-resource deletion is a separately authorized operational cleanup after the Visual Intelligence release and observation evidence are accepted; it is not a hidden fallback.

## Reasoning Cost Boundary

Every attempted reasoning route, including a failed attempt that triggers fallback, must retain provisional internal provider-cost evidence bound to the exact approved snapshot, reservation, idempotency key, request hash, response-usage hash, route ordinal, outcome, and rate-card version.

- Kimi, GPT-5.6 Terra, and DeepSeek rates are recorded in their native USD pricing boundary.
- GPT-5.6 Terra standard pricing is $2.50 per million uncached input tokens, $0.25 per million cached input tokens, and $15 per million output tokens. Cache writes are $3.125 per million tokens. Requests above 272,000 input tokens apply the published 2x input and 1.5x output multipliers to the whole request.
- Historical Qwen visual attempt records retain their original cost evidence and exact route identity. WeEditPro must not relabel that spend as Gemini, Terra, or a new operation version.
- Visual Intelligence Gemini usage is provider cost and must retain the exact request identity, validated provider usage receipt, account-effective immutable rate authority, attempt outcome, and source/output scope. NVIDIA A100 80 GB and NVIDIA L4 work retain exact accelerator, cold-start, active-runtime, storage, network, and attempt-cost evidence as infrastructure cost. Neither provider nor infrastructure cost may self-authorize billing or silently charge an unapproved overage.
- Internal production cost is separate from customer price, customer credits, wallet mutation, and the WeEditPro service fee.

## Launch Router

WeEditPro's launch router separates still/keyframe generation from animation/video generation.

- Image, still, keyframe, graphic, and frame model: GPT-Image-2.
- Animation stack: Wan primary, Hailuo fallback, Veo 3.1 Lite Premium-only final fallback.
- Seedance 1.5 Pro is not part of the launch router.
- Veo must never be the default primary model.
- Basic must never use Veo.
- Pro must never use Veo.
- Premium may use Veo 3.1 Lite only as final fallback/rescue after Wan and Hailuo are unsuitable, fail QA, or the scene is marked critical.

## Resolution Defaults

Default generated video output should be 720P-class. WeEditPro should never default generated AI video to 1080P.

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
