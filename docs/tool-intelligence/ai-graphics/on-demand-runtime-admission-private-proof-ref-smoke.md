# AI Graphics On-Demand Runtime Admission Private Proof Ref Smoke

Decision: `ai_graphics_on_demand_runtime_admission_private_proof_ref_smoke_passed`

This executable smoke closes the lower-level runtime admission gap for the eight GPU/model tools. Public, signed, or non-private proof references are rejected. Only `private://` native GPU runtime proof refs, and `private://` model-weight manifest refs where required, can make a future worker-enqueue admission ready.

## Counts

- GPU/model tools covered: `8`
- Public/non-private proof-ref cases rejected: `8`
- Private proof-ref future worker-enqueue admissions: `8`
- GPU runtime started now: `0`
- Agent executable now: `0`

## Tools

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

## Runtime Boundary

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `gpuRuntimePerformed=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

Private proof refs allow only future worker-enqueue admission. They do not start GPU by themselves; GPU remains on demand only and starts only for an accepted worker/tool-call job.
