# AI Graphics External-Beta Live-Enqueue Authorization

Decision: `ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks`

This packet prepares the live-enqueue authorization record for the 21 AI graphics tools. It accepts the controlled runtime execution approval packet and the runtime queue service bridge evidence, then records all 21 enqueue authorization scopes as ready for a future non-production external-beta queue-write smoke.

This does not perform a queue write, worker dispatch, tool call, model/provider call, browser/WebGL/canvas runtime, GPU startup, storage mutation, signed URL creation, public artifact creation, beta unlock, or production unlock.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-controlled-runtime-execution-approval.json`
- `docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.json`
- `docs/tool-intelligence/ai-graphics/external-beta-local-queue-storage.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-transaction.json`
- `docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json`
- `docs/tool-intelligence/ai-graphics/external-beta-worker-enqueue-adapter.json`
- `docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json`

## Tools Covered

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

The eight heavy/model tools remain GPU-targeted: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background`. GPU startup remains on-demand only and is allowed only for a future accepted worker or tool job. `gpuRuntimeShouldStartNow` remains `false`.

## Authorization Scope

- Operator role: `AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_OPERATOR`
- Non-production external-beta environment reference required
- Queue write window reference required
- Cleanup plan reference required
- Rollback plan reference required
- Cost ceiling reference required
- Live queue write now: `false`
- Worker dispatch now: `false`
- Tool execution now: `false`
- Runtime now: `false`

## Counts

- Total tools: `21`
- Product-facing capabilities: `12`
- Controlled runtime execution approved scopes with provided evidence: `21`
- Runtime queue service bridge accepted evidence requests: `1`
- Live-enqueue authorization candidates with provided evidence: `21`
- Live-enqueue authorization scopes recorded with provided evidence: `21`
- GPU runtime targeted tools: `8`
- GPU runtime start allowed for future accepted external-beta job tools: `8`
- Live queue writes approved now: `0`
- Live queue writes performed now: `0`
- Worker dispatch approved now: `0`
- Tool execution approved now: `0`
- External beta ready now: `0`
- Production ready now: `0`

## Allowed Actions

- Accept all-21 controlled runtime execution approval evidence.
- Accept side-effect-free runtime queue service bridge evidence.
- Record non-production external-beta live-enqueue authorization metadata.
- Prepare all 21 enqueue authorization scopes without writing queue rows.
- Keep GPU startup bound to future accepted worker/tool jobs only.

## Blocked Actions

Live Supabase queue writes, job inserts, worker lease creation, worker dispatch, tool execution, Tool Route execution, provider/model execution, browser/WebGL/canvas runtime, GPU/model runtime now, always-on GPU runtime, model weight loading, media processing, GCS mutation, signed URL creation, public artifact creation, external-beta traffic enablement, and production unlock remain blocked.

## Interfaces

- Server module: `server/tool-registry/ai-graphics-external-beta-live-enqueue-authorization.ts`
- CLI: `server/cli/ai-graphics-external-beta-live-enqueue-authorization.ts`
- Package script: `ai-graphics:external-beta-live-enqueue-authorization`
- Diagnostic: `ai-graphics:external-beta-live-enqueue-authorization:diagnostics`

## Next Gap

Bind this packet to a non-production service-role queue write smoke. That next step must still require approved plan snapshots, credit reservations, private artifact refs, worker claim controls, dispatch controls, per-tool runtime proof, and explicit operator scope before any real external-beta traffic.
