# AI Graphics External Beta Service-Role Queue Smoke Proof

Decision: `ai_graphics_external_beta_service_role_queue_smoke_proof_prepared_with_runtime_blocks`

This is the proof validator for the future non-production external-beta service-role queue/claim smoke. It validates saved smoke output only. It does not write to Supabase, claim workers, dispatch workers, execute tools, start GPU runtime, create artifacts, unlock external beta, or unlock production.

## Input

```bash
npm run --silent ai-graphics:external-beta-service-role-queue-smoke-proof -- \
  --external-beta-service-role-queue-smoke-readiness-packet <readiness-packet.json> \
  --external-beta-service-role-queue-smoke-result <saved-smoke-result.json> \
  --external-beta-service-role-queue-smoke-evidence-ref private://ai-graphics/external-beta/service-role-queue-smoke/evidence.json \
  --external-beta-service-role-queue-smoke-telemetry-ref private://ai-graphics/external-beta/service-role-queue-smoke/telemetry.json \
  --external-beta-service-role-queue-smoke-cleanup-proof-ref private://ai-graphics/external-beta/service-role-queue-smoke/cleanup.json
```

The saved result must come from `ai-graphics:external-beta-service-role-queue-smoke` after an explicitly confirmed non-production run. Service-role credentials remain server-only and must not be committed.

## Acceptance Criteria

- Tools submitted: 21
- Submitted tool IDs cover all 21 AI graphics tools
- Queue job IDs returned: 21
- Worker claim rows returned: 21
- Service-role queue smoke authorization ref is present
- Source service-role queue smoke authorization accepted: true
- Source service-role queue smoke authorization accepted with provided evidence: 21
- GPU/model tools preserved: 8
- Runtime queue service proof bridge accepted with provided evidence: 21
- Source gateway runtime-admission modes accepted with provided evidence: 21
- CPU/static first-cohort tools accepted with provided evidence: 1 (`d3`)
- Source queue writes accepted with provided evidence: 21
- Source worker claims accepted with provided evidence: 21
- Worker dispatches accepted with provided evidence: 0
- Tool executions accepted with provided evidence: 0
- Cleanup leaves persisted fixture rows: 0
- GPU runtime starts now: false
- External beta ready now: 0
- Production ready now: 0

## Current Boundary

The validator can accept proof that the queue/claim path worked and cleaned itself up. It still keeps these gates false:

The accepted proof also carries the source runtime queue service proof bridge and the source gateway runtime-admission map. Today that map marks `d3` as `sourceGatewayRuntimeAdmissionMode=cpu_static_first_cohort` and keeps the remaining accepted tools on the all-tools external-beta path. Worker-dispatch readiness uses those markers to avoid accepting disconnected smoke results or confusing CPU/static first-cohort jobs with GPU/model jobs.

- `agentCanExecuteToolsNow`
- `routeExecutionApprovedNow`
- `workerExecutionApprovedNow`
- `workerQueueApprovedNow`
- `serviceRoleQueueSmokeApprovedNow`
- `toolExecutionApprovedNow`
- `browserWebglCanvasRuntimeApprovedNow`
- `gpuRuntimeApprovedNow`
- `runtimeReadyNow`
- `internalBetaReadyNow`
- `externalBetaReadyNow`
- `productionReadyNow`

## Next External Beta Gap

After this proof is collected, the next useful gate is worker lease and dispatch readiness for external beta. That gate must still keep actual tool execution and GPU startup limited to accepted job paths and must not start idle GPU runtime.
