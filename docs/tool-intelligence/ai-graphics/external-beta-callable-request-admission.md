# AI Graphics External-Beta Callable Request Admission

Decision: `ai_graphics_external_beta_callable_request_admission_prepared_with_runtime_blocks`

Status: `external_beta_callable_request_admission_ready_runtime_still_blocked`

This packet bridges the all-21 external-beta callable scope to one request-level Tool Call Gateway packet. It fails closed unless the callable scope accepts all 21 AI graphics tools and the gateway accepts the specific request with approved plan snapshot, credit reservation, private artifact manifest, runtime proof, rollout, rate-limit, cost, audit, trace, and idempotency evidence.

## Scope

- AI graphics tools covered by source callable scope: `21`
- Product-facing capabilities covered by source callable scope: `12`
- GPU/model runtime tools targeted to native GPU: `8`
- External-beta callable request-admission candidates with provided evidence: `1`
- External-beta callable-now tools: `0`
- External-beta-ready-now tools: `0`
- Production-ready-now tools: `0`

## Request Admission Requirements

1. Accepted external-beta callable scope for all 21 tools.
2. Accepted request-level external-beta Tool Call Gateway.
3. Requested tool exists in the callable scope.
4. Requested capability exists in the callable scope.
5. Approved plan snapshot and credit reservation are present in the gateway candidate.
6. Private artifact manifest remains private-scoped.
7. Gateway feature flag, rollout, rate-limit, cost-ceiling, audit, trace, and idempotency controls are accepted.
8. Runtime proof refs are accepted through runtime admission.
9. GPU runtime remains on-demand only and can start only for a later accepted worker/tool job.

## Preserved Blocks

- No agent/tool execution.
- No Tool Route execution.
- No live queue write.
- No Worker queue enqueue.
- No Worker execution or production worker dispatch.
- No provider/model execution.
- No browser/WebGL/canvas runtime.
- No GPU/model runtime execution now.
- No idle or always-on GPU runtime.
- No model weight download/load.
- No media processing.
- No Supabase/GCS mutation.
- No signed URL or public artifact.
- No external beta traffic enablement.
- No production unlock.

## Result

This is a request-admission candidate only. It moves the lane closer to external beta by tying the 21-tool callable scope to request-level approved-plan and credit-reservation controls, but it still does not make any tool callable now.

## Next Milestone

Bind this request-admission candidate to a real external-beta API route handler, then prove private non-production queue insertion, worker claim, and worker dispatch from the request-admission candidate before user traffic is enabled.
