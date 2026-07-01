# AI Graphics External-Beta API Route Queue Smoke Authorization

Decision: `ai_graphics_external_beta_api_route_queue_smoke_authorization_prepared_with_runtime_blocks`

Status: `external_beta_api_route_queue_smoke_authorization_recorded_execution_still_blocked`

This packet records private non-production authorization metadata for a future API route queue smoke. It consumes the side-effect-free API-route-to-queue insertion proof and the all-21 service-role queue smoke authorization packet.

This does not execute the smoke. It does not mount or execute an API route, write to Supabase, insert queue rows, claim workers, create leases, dispatch workers, execute tools, start GPU runtime, process media, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-api-route-queue-insertion-proof.json`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-boundary.json`
- `docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json`

## Tools Covered

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

The eight heavy/model tools remain GPU-targeted: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background`. GPU startup remains on-demand only and is allowed only for a future accepted worker or tool job. `gpuRuntimeShouldStartNow` remains `false`.

## Authorization Scope

- Operator role: `AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_OPERATOR`
- Accepted route-to-queue insertion proof required
- Accepted service-role queue smoke authorization required
- Accepted service-role queue smoke preflight evidence required
- Non-production external-beta environment required
- Route execution window required
- Queue write window required
- Cleanup plan required
- Rollback plan required
- Telemetry reference required
- Cost ceiling reference required
- Private network reference required
- Incident response reference required
- API route queue smoke now: `false`
- API route execution now: `false`
- Live queue write now: `false`
- Worker dispatch now: `false`
- Tool execution now: `false`
- Runtime now: `false`

## Counts

- Total tools: `21`
- Product-facing capabilities: `12`
- Source route-to-queue insertion proof requests accepted: `1`
- Source service-role queue smoke authorization scopes recorded: `21`
- Source service-role queue smoke preflight requests accepted: `1`
- API route queue smoke authorization candidate requests: `1`
- API route queue smoke authorization requests recorded: `1`
- GPU runtime targeted tools: `8`
- GPU runtime start allowed for future accepted external-beta job requests: `1`
- API route queue smoke approved now: `0`
- API route executions approved now: `0`
- API route executions performed now: `0`
- Live queue writes approved now: `0`
- Live queue writes performed now: `0`
- Worker dispatch approved now: `0`
- Worker dispatch performed now: `0`
- Tool execution approved now: `0`
- Tool execution performed now: `0`
- External beta ready now: `0`
- Production ready now: `0`

## Allowed Actions

- Accept one side-effect-free API-route-to-queue insertion proof candidate.
- Accept all-21 service-role queue smoke authorization evidence with accepted preflight evidence.
- Record private non-production API route queue smoke authorization metadata.
- Keep API route execution, live queue writes, worker dispatch, tool execution, and GPU startup blocked in this evaluator.

## Blocked Actions

API route queue smoke execution now, mounted API route creation, API route execution, live queue writes, backend queue submission, service-role transaction, service-role queue smoke execution now, job inserts, worker claim row inserts, worker lease creation, worker dispatch, tool execution, Tool Route execution, provider/model execution, browser/WebGL/canvas runtime, GPU/model runtime execution now, always-on GPU runtime, model weight loading, media processing, Supabase/GCS mutation, signed URL creation, public artifact creation, external beta traffic enablement, and production unlock remain blocked.

## Interfaces

- Server module: `server/tool-registry/ai-graphics-external-beta-api-route-queue-smoke-authorization.ts`
- CLI: `server/cli/ai-graphics-external-beta-api-route-queue-smoke-authorization.ts`
- Package script: `ai-graphics:external-beta-api-route-queue-smoke-authorization`
- Diagnostic: `ai-graphics:external-beta-api-route-queue-smoke-authorization:diagnostics`

## Next Gap

Implement and run one explicitly confirmed private non-production API route queue smoke, save sanitized proof, and validate it before any external-beta traffic, worker dispatch, tool execution, or GPU startup is enabled.
