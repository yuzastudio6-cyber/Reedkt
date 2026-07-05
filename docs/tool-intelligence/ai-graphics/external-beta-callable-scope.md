# AI Graphics External Beta Callable Scope

Decision: `ai_graphics_external_beta_callable_scope_prepared_with_runtime_blocks`

Status: `external_beta_callable_scope_candidate_recorded_runtime_still_blocked`

This packet consolidates the external-beta launch go/no-go, live-enqueue authorization, and worker-dispatch smoke proof into one fail-closed callable-candidate scope for the AI graphics lane. It records that all 21 tools can be represented as external-beta callable candidates with provided evidence, while keeping actual tool execution and runtime unlocks blocked.

## Source Evidence

- External-beta launch go/no-go: `ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks`
- Live-enqueue authorization: `ai_graphics_external_beta_live_enqueue_authorization_prepared_with_runtime_blocks`
- Worker-dispatch smoke proof: `ai_graphics_external_beta_worker_dispatch_smoke_proof_prepared_with_runtime_blocks`
- Runtime queue service proof bridge: required
- Service-role queue-smoke authorization: required

The callable scope rejects source packets that strip launch approval, live-enqueue authorization, worker-dispatch smoke proof, runtime queue service bridge evidence, or service-role queue-smoke authorization evidence.

## Tool Coverage

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU runtime-targeted tools: `8`
- Heavy tools incorrectly targeting CPU: `0`
- External-beta callable candidate tools with provided evidence: `21`
- External-beta callable now tools: `0`
- External-beta ready now tools: `0`
- Production ready now tools: `0`

The eight GPU/model tools remain targeted to native GPU runtimes and stay on demand only:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

## Runtime Boundary

Allowed now:

- Read accepted external-beta launch go/no-go evidence.
- Read accepted live-enqueue authorization metadata without writing queue rows.
- Read accepted worker-dispatch smoke proof without dispatching workers.
- Record all 21 AI graphics tools as external-beta callable candidates with provided evidence.
- Preserve GPU startup as on-demand only for future accepted worker/tool jobs.

Blocked now:

- Agent/tool execution
- Tool Route execution
- Live queue writes
- Worker queue enqueue
- Worker execution
- Provider/model execution
- Browser/WebGL/canvas runtime execution
- GPU/model runtime execution now
- Model weight download or load
- Media processing
- Supabase/GCS mutation
- Signed URL creation
- Public artifact creation
- External beta traffic enablement
- Production unlock

## Required Booleans

- `externalBetaCallableScopePrepared=true`
- `sourceExternalBetaLaunchGoNoGoAccepted=true`
- `sourceExternalBetaLiveEnqueueAuthorizationAccepted=true`
- `sourceExternalBetaWorkerDispatchSmokeProofAccepted=true`
- `sourceServiceRoleQueueSmokeAuthorizationAccepted=true`
- `all21ExternalBetaCallableCandidatesWithProvidedEvidence=true`
- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `externalBetaCallableNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`
- `gpuRuntimeShouldStartNow=false`

## Next Milestones

1. Bind this callable scope to a real external-beta tool-call API admission layer with approved plan snapshot and credit reservation checks.
2. Run private non-production end-to-end queue, worker claim, and worker dispatch proof for the callable scope before enabling user traffic.
3. Keep GPU workers cold until an accepted GPU/model job is claimed by a worker, then release GPU resources after completion.
4. Require separate production launch approval after external-beta soak, support, incident, rollback, and cost evidence exists.
