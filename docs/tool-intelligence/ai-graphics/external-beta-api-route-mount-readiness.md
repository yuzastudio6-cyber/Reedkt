# AI Graphics External-Beta API Route Mount Readiness

Decision: `ai_graphics_external_beta_api_route_mount_readiness_prepared_with_runtime_blocks`

Status: `api_route_mount_ready_with_provided_evidence_runtime_still_blocked`

This packet records source-controlled route mount readiness for the future `POST /api/ai-graphics/external-beta/tool-call` endpoint. It consumes the accepted full 21-tool route-handler gateway proof, including route-bound service-role queue smoke operator-preflight evidence for all 21 tools, and verifies private/backend refs for the route policy, schema, authorization middleware, request validation, approved snapshot resolver, credit reservation resolver, private artifact policy, asset manifest binding, dependency readiness, async checkback, queue submission authorization, service-role boundary, rate limit, cost guardrail, idempotency, audit, telemetry, rollback, incident response, kill switch, and private network controls.

## Result

- Total AI graphics tools: `21`
- Product-facing capabilities: `12`
- GPU runtime targeted tools: `8`
- API route mount ready with provided evidence: `21`
- Route-handler gateway full proof tools with provided evidence: `21`
- Route-bound service-role queue smoke operator-preflight accepted: `21`
- Runtime admissions accepted with provided evidence: `21`
- Gateway worker-enqueue candidates ready with provided evidence: `21`
- Route-handler-to-gateway continuity accepted: `21`
- GPU start allowed only for accepted external-beta jobs: `8`
- GPU runtime should start now: `0`
- API route mounted now: `0`
- Route executions approved now: `0`
- Worker enqueue approved now: `0`
- Tool executions approved now: `0`
- External beta ready now: `0`
- Production ready now: `0`

## Route Mount Candidate

| Field | Value |
| --- | --- |
| Route id | `ai_graphics_external_beta_tool_call` |
| Method | `POST` |
| Path | `/api/ai-graphics/external-beta/tool-call` |
| Source-controlled mount only | `true` |
| Express route mounted now | `false` |
| Validates all 21 tool requests | `true` |
| Approved snapshot resolver required | `true` |
| Credit reservation resolver required | `true` |
| Private artifact policy required | `true` |
| Asset manifest binding required | `true` |
| Dependency readiness policy required | `true` |
| Async checkback policy required | `true` |
| Queue submission authorization required | `true` |
| GPU mode | on-demand only |

## Controls

The readiness packet accepts only private/backend-scoped refs for route mount policy, route schema, route authorization middleware, request validation, approved snapshot resolver, credit reservation resolver, private artifact policy, asset manifest binding, dependency readiness policy, async checkback policy, queue submission authorization, service-role boundary, rate-limit policy, cost guardrail, idempotency store, audit log, telemetry, rollback plan, incident response, kill switch, and private network controls.

## Runtime Boundary

This packet blocks: mounted API route creation, API route execution, agent/tool execution, Tool Route execution, live queue write, backend queue submission, service-role transaction, Worker queue enqueue, Worker lease creation, Worker execution, production worker dispatch, provider/model execution, browser/WebGL/canvas runtime execution, GPU/model runtime execution now, idle or always-on GPU runtime, model weight download or load, media processing, Supabase/GCS mutation, signed URL creation, public artifact creation, external beta traffic enablement, and production unlock.

GPU remains on-demand only. The eight GPU/model tools may start GPU runtime only after a later accepted worker/tool-call job is claimed. `gpuRuntimeShouldStartNow=false` remains enforced.

## Next Gap

Create the source-controlled route mount implementation behind this readiness contract, then run route mount QA before any route execution or live queue write.
