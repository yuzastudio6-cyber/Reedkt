# AI Graphics External-Beta Route Mount Feature Flag

Decision: `ai_graphics_external_beta_route_mount_feature_flag_prepared_closed_by_default`

Status: `route_mount_feature_flag_defined_gated_app_mount_prepared_runtime_blocked`

This packet defines the off-by-default runtime env flag for the future AI graphics external-beta tool-call route mount:

`AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED`

The flag is parsed into `RuntimeEnv.aiGraphicsExternalBetaToolCallRouteMountEnabled` and exposed in the safe runtime summary. `server/app.ts` now has a source-controlled gated mount, but the default flag value keeps the current app route unmounted.

## Scope

- AI graphics tools covered: `21`
- Product-facing capabilities covered: `12`
- Route-mount feature flag defined tools: `21`
- Route-mount code wired tools: `21`
- API-route-mounted-now tools: `0`
- Route executions approved now: `0`
- Worker enqueues approved now: `0`
- Tool executions approved now: `0`

## Boundary

This packet wires `createAiGraphicsExternalBetaToolCallRoutes()` in `server/app.ts` only behind `AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED=true`. Default runtime remains `apiRouteMountedNow=false`. When a later environment explicitly enables the flag, the handler still returns `409 TOOL_NOT_READY` and does not enqueue workers, execute tools, start GPU runtime, or create artifacts.

## Required Booleans

- `routeMountFeatureFlagPrepared=true`
- `routeMountGatedAppMountPrepared=true`
- `routeMountFlagDefaultClosed=true`
- `safeRuntimeSummaryExposesFlag=true`
- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `apiRouteMountedNow=false`
- `apiRouteExecutionApprovedNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `workerEnqueueApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## Result

The route-mount step now has a named, default-closed runtime flag and a gated app mount. No worker, provider, browser/WebGL/canvas, GPU/model, media, Supabase/GCS, signed URL, public artifact, beta, or production execution is unlocked.
