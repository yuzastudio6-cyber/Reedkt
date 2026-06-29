# AI Graphics External-Beta Service-Role Queue Smoke Authorization

Decision: `ai_graphics_external_beta_service_role_queue_smoke_authorization_prepared_with_runtime_blocks`

This packet authorizes preparation for the next non-production service-role queue smoke across all 21 AI graphics tools. It consumes live-enqueue authorization, service-role queue smoke readiness, and service-role queue smoke preflight evidence.

This does not execute the smoke. It does not write to Supabase, insert queue rows, claim workers, create leases, dispatch workers, execute tools, start GPU runtime, process media, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json`
- `docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.json`

## Tools Covered

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

The eight heavy/model tools remain GPU-targeted: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background`. GPU startup remains on-demand only and is allowed only for a future accepted worker or tool job. `gpuRuntimeShouldStartNow` remains `false`.

## Authorization Scope

- Operator role: `AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR`
- Non-production external-beta environment required
- Queue write window required
- Cleanup plan required
- Rollback plan required
- Telemetry reference required
- Cost ceiling reference required
- Service-role queue smoke now: `false`
- Live queue write now: `false`
- Worker dispatch now: `false`
- Tool execution now: `false`
- Runtime now: `false`

## Counts

- Total tools: `21`
- Product-facing capabilities: `12`
- Source live-enqueue authorization scopes recorded with provided evidence: `21`
- Service-role smoke readiness accepted evidence requests: `1`
- Service-role smoke preflight ready evidence requests: `1`
- Service-role queue smoke authorization candidates: `21`
- Service-role queue smoke authorization scopes recorded: `21`
- GPU runtime targeted tools: `8`
- GPU runtime start allowed for future accepted external-beta job tools: `8`
- Service-role queue smoke approved now: `0`
- Live queue writes approved now: `0`
- Live queue writes performed now: `0`
- Worker dispatch approved now: `0`
- Tool execution approved now: `0`
- External beta ready now: `0`
- Production ready now: `0`

## Allowed Actions

- Accept all-21 live-enqueue authorization evidence.
- Accept side-effect-free service-role queue smoke readiness evidence.
- Accept side-effect-free service-role queue smoke preflight evidence.
- Record non-production service-role queue smoke authorization metadata.
- Keep live Supabase queue writes and worker dispatch blocked in this evaluator.

## Blocked Actions

Service-role queue smoke execution now, live Supabase queue writes, job inserts, worker claim row inserts, worker lease creation, worker dispatch, tool execution, Tool Route execution, provider/model execution, browser/WebGL/canvas runtime, GPU/model runtime now, always-on GPU runtime, model weight loading, media processing, GCS mutation, signed URL creation, public artifact creation, external beta traffic enablement, and production unlock remain blocked.

## Interfaces

- Server module: `server/tool-registry/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts`
- CLI: `server/cli/ai-graphics-external-beta-service-role-queue-smoke-authorization.ts`
- Package script: `ai-graphics:external-beta-service-role-queue-smoke-authorization`
- Diagnostic: `ai-graphics:external-beta-service-role-queue-smoke-authorization:diagnostics`

## Next Gap

Run the explicitly confirmed non-production service-role queue smoke with server-only credentials, save a sanitized result, and validate it with `ai-graphics:external-beta-service-role-queue-smoke-proof` before worker dispatch or tool execution is considered.
