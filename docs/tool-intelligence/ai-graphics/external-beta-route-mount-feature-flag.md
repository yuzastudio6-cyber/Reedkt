# AI Graphics External-Beta Route Mount Feature Flag

Decision: `ai_graphics_external_beta_route_mount_feature_flag_prepared_closed_by_default`

Status: `route_mount_feature_flag_defined_route_unmounted_runtime_blocked`

This packet defines the off-by-default runtime env flag for the future AI graphics external-beta tool-call route mount:

`AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED`

The flag is parsed into `RuntimeEnv.aiGraphicsExternalBetaToolCallRouteMountEnabled` and exposed in the safe runtime summary. The current app route remains unmounted.

## Scope

- AI graphics tools covered: `21`
- Product-facing capabilities covered: `12`
- Route-mount feature flag defined tools: `21`
- API-route-mounted-now tools: `0`
- Route executions approved now: `0`
- Worker enqueues approved now: `0`
- Tool executions approved now: `0`

## Boundary

This packet does not mount `createAiGraphicsExternalBetaToolCallRoutes()` in `server/app.ts`. It prepares the explicit switch a later route-mount review can use after the route mount, worker handoff, private queue, and runtime approvals are accepted.

## Required Booleans

- `routeMountFeatureFlagPrepared=true`
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

The next route-mount step now has a named, default-closed runtime flag to bind to. No route, worker, provider, browser/WebGL/canvas, GPU/model, media, Supabase/GCS, signed URL, public artifact, beta, or production execution is unlocked.
