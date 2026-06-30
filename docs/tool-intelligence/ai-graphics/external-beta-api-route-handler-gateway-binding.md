# AI Graphics External-Beta API Route Handler Gateway Binding

Decision: `ai_graphics_external_beta_api_route_handler_gateway_binding_prepared_with_runtime_blocks`

Status: `api_route_handler_gateway_binding_ready_runtime_still_blocked`

This packet binds the source-controlled external-beta API route-handler contract to the existing external-beta tool-call gateway contract. It proves the future route-handler ingress shape can map into the gateway candidate shape without mounting the route or executing anything.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json`
- `docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json`
- `docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json`
- `docs/tool-intelligence/ai-graphics/external-beta-cpu-static-runtime-admission.json`
- `docs/tool-intelligence/ai-graphics/external-beta-controlled-on-demand-status-bridge.json`

## Coverage

- Total AI graphics tools: `21`
- Product-facing capabilities: `12`
- GPU/model runtime targeted tools: `8`
- Route-handler request shapes accepted: `21`
- Gateway contract covered tools: `21`
- Gateway worker enqueue candidate examples accepted: `3`
- Full per-tool gateway binding proof tools now: `0`

The `0` full per-tool proof count is intentional. This packet is the binding contract between route-handler and gateway metadata. It does not claim every tool has had a dedicated route-handler-to-gateway runtime-admission proof yet.

## Binding Continuity

The binding preserves these fields as contract metadata:

- canonical tool id
- accepted capability id
- approved plan snapshot id
- credit reservation id
- private artifact manifest ref
- request id
- trace id
- idempotency key
- feature flag evaluation ref
- rollout assignment ref
- rate-limit decision ref
- cost-ceiling decision ref
- audit ref
- worker enqueue candidate ref

## Allowed Actions

- Read accepted external-beta API route-handler contract metadata.
- Read accepted external-beta tool-call gateway contract metadata.
- Validate route-handler request ingress can map to gateway candidate egress.
- Preserve approved snapshot, credit reservation, private artifact, trace, and idempotency continuity.
- Record that full per-tool gateway binding proof remains deferred before route mounting.

## Blocked Actions

- Mounted API route creation.
- API route execution.
- Direct agent/tool execution.
- Tool Route execution.
- Live queue write.
- Worker queue enqueue.
- Worker execution.
- Production worker dispatch.
- Provider/model execution.
- Browser/WebGL/canvas runtime execution.
- GPU/model runtime execution now.
- Idle or always-on GPU runtime.
- Model weight download or load.
- Media processing.
- Supabase/GCS mutation.
- Signed URL creation.
- Public artifact creation.
- External beta traffic enablement.
- Production unlock.

## Required Booleans

- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteToolsNow`: `false`
- `apiRouteMountedNow`: `false`
- `routeExecutionApprovedNow`: `false`
- `workerExecutionApprovedNow`: `false`
- `workerQueueApprovedNow`: `false`
- `toolExecutionApprovedNow`: `false`
- `gpuRuntimeApprovedNow`: `false`
- `gpuRuntimeShouldStartNow`: `false`
- `runtimeReadyNow`: `false`
- `externalBetaReadyNow`: `false`
- `productionReadyNow`: `false`
- `packageLockMutationPerformed`: `false`

## Next Gap

Run a full 21-tool route-handler-to-gateway binding proof with accepted runtime admission packets for every tool before mounting the external-beta API route.
