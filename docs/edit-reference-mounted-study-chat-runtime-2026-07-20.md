# Edit Reference mounted Study Chat runtime — 2026-07-20

## Outcome

The existing mounted route
`POST /v1/edit-reference-studies/:studyId/messages` now has one
server-only Study Chat runtime seam. It does not add a second route, message
store, evidence store, preference authority, or browser-side model client.

The route delegates to `appendMountedEditReferenceStudyChatMessage`. The
runtime is injected through the existing API application and service context.
The supplied canonical `EditReferenceService` remains the only authority for:

- the exact user message and manual evidence;
- reasoning attempt reservation and execution authority;
- provider request, checkback, and workflow state;
- internal provider/infrastructure cost evidence;
- terminal assistant-message settlement;
- browser-safe status projection.

## Saved-before-call transaction boundary

One reservation transaction saves the exact user direction as both the Study
Chat user message and reviewable manual evidence before any provider call can
be authorized. It invalidates only unapproved DNA candidates, advances the
study revision once, and preserves approved/history records.

The reasoning attempt records the saved evidence identity and the bounded
pre-mutation context state. Execution reconstructs the exact prepared context
while excluding the just-saved message/evidence. This prevents the evidence
save from changing the context digest between reservation and execution while
still ensuring the direction survives provider failure, timeout, or restart.

Corrections remain explicit evidence versions through
`findingCorrectionEvidenceId`; they never overwrite prior evidence.

## Model route

The runtime contract requires the shared route contract
`reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek` in this exact order:

1. Kimi K3 primary;
2. Qwen 3.7 only after an allowed terminal Kimi failure;
3. DeepSeek V4 Pro only after an allowed terminal Qwen failure.

Qwen2.5-VL remains the visual-understanding specialist and cannot satisfy this
reasoning route. The runtime seam does not mint route authorization or create a
provider client. A future live adapter must consume the shared backend's exact
request-bound route, rate-card, budget, usage, and fallback evidence.

## Runtime behavior

### Local/private mode

When no runtime port is injected, the existing deterministic evidence-saving
acknowledgement remains available for protected local testing. It is not a
production model-response claim.

A controlled fixture can exercise the mounted reasoning lifecycle, but it is
non-promotable and cannot claim production authority.

### Hosted/production mode

Hosted mode fails before message/evidence mutation when the source-verified
runtime is absent. A mounted runtime must identify itself as
`canonical_backend_verified_runtime`, retain the canonical repository and cost
authorities, use persistence contract
`edit-reference-production-persistence-contract-v6`, and attest the exact
Kimi-first route contract. The V2 runtime seam additionally requires the live
repository/RPC, durable multi-attempt run, multi-replica checkback, provider
dispatch, usage/cost settlement, and same-release evidence gates. A private
qualification set has no source-contract insertion path, so caller-asserted
booleans or browser fields cannot self-promote this version.

## Browser projection

`EditReferenceDetail.studyChatReasoning` exposes only:

- the attempt and linked user/assistant message identities;
- queued, thinking, waiting, answered, needs-review, failed, or cancelled;
- concise next-state copy;
- whether retry is available;
- whether a provider call may have occurred;
- created/updated timestamps.

Provider request IDs, route/model internals, prompts, hidden reasoning, lease
tokens, credentials, raw payloads, and internal cost values remain private.
The Study Chat UI polls only while an attempt is active and shows the status
under the exact saved user message. A committed response can be reconciled by
either the source-verified assistant message or the durable reasoning status.

## Verification

The focused mounted-route smoke proves:

- the exact message and evidence are committed once;
- a blocked reasoning result leaves the direction saved and retryable;
- exact replay returns the same result;
- changed content under the same identity conflicts;
- restart readback preserves evidence and terminal status;
- private aggregate output excludes credential/raw-provider fields;
- hosted mode without a verified port fails before authority access;
- a controlled fixture cannot self-promote;
- a forged canonical port with every live boolean set still cannot enter the
  private production qualification set;
- no provider, customer price, customer credit, or service-fee action occurs.

Surrounding regression coverage also proves the existing Study Session
foundation, Kimi-first route order/cost policy, long-form semantic route, and a
real six-hour whole-source admission path.

Mounted browser verification passed the complete canonical Edit Reference
journey (11/11 Chromium cases), including the new exact-message reasoning
status, create/archive/evidence/upload/study/DNA/approval recovery, and exact
target apply/replace/reload/remove behavior. The progressive long-form review
suite passed 2/2 after proving that an older detail payload without the new
status projection remains safe during a rolling update. Server typecheck,
full lint/build, frontend-boundary, canonical-UI readiness, secret scan, and
diff checks also passed.

## Remaining production gates

`productionReady` remains `false`. This slice does not provide or activate:

- the live Kimi/Qwen/DeepSeek provider adapter and shared route coordinator;
- deployed durable attempt/provider/checkback/workflow/cost persistence;
- remote Supabase/Auth/RLS tenant-isolation evidence;
- deployed large-media storage/finalization or worker execution;
- same-SHA staging/browser recovery evidence;
- billing, customer credits, deployment, or public delivery.

Those gates must be integrated through the backend's existing canonical
authorities; they must not be reimplemented inside Edit Reference.
