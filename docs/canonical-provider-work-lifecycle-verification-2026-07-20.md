# Canonical Provider Work Lifecycle Verification — 2026-07-20

## Verdict

`CANONICAL_PROVIDER_WORK_LIFECYCLE_PRIVATE_INJECTED_PROOF_ACCEPTED_TRANSPORT_BLOCKED`

This bounded slice freezes one provider-neutral lifecycle and one admitted
provider operation without activating a provider:

- operation: `provider.lyria.generate_music_candidate.v1`
- provider boundary/profile: `lyria_3_pro_provider_boundary`
- model: `lyria-3-pro-preview`
- expected work item: `generate_music_candidate`
- expected private output: one `audio/wav` generated-music candidate

The proof is private, injected, and non-provider. It is not a canonical Motion
Studio runtime receipt, product readiness, or production readiness.

## Canonical Contract

The lifecycle is:

1. derive one immutable provider-work authorization from the exact funded
   approved execution package, snapshot, queue job, placement, work item, and
   expected output;
2. claim that exact provider-backed job through the existing canonical package
   queue while ordinary/tool queue claims remain capability-blocked;
3. issue and consume one sibling provider-dispatch grant with an opaque,
   timing-safe credential and no raw secret in package, queue, logs, or evidence;
4. persist an immutable queue execution fence before any future provider
   request, binding the exact authorization, dispatch grant, dispatch attempt,
   job, claim, lease, and delivery attempt;
5. ingest a successful candidate through bounded private create-only storage
   with checksum readback, without selection, timeline, render, export, or
   public-delivery authority;
6. retain provider and infrastructure internal production cost per attempt,
   including failed and unknown attempts, separately from customer price,
   customer credits, service fee, wallet, and billing;
7. record success, failure, or unknown terminal evidence, and require exact
   unknown-outcome reconciliation before the queue can terminalize;
8. replay exact completed or reconciled attempts without another dispatch or
   provider request.

The frozen Lyria request policy admits one provider request, zero retries, zero
fallbacks, zero redirects, and no automatic resubmission. A failed or unknown
attempt cannot silently create a second request. Any later request requires a
fresh approved package/snapshot.

## Internal Cost Boundary

The accepted bounded policy is:

- provider request ceiling: USD 0.08 (`80,000` USD micros);
- infrastructure ceiling: USD 0.02 (`20,000` USD micros);
- total internal production-cost ceiling: USD 0.10 (`100,000` USD micros);
- provider and infrastructure components remain separate;
- provisional local infrastructure evidence uses allocated wall time until an
  observed CPU/memory/GPU meter is qualified;
- the provider rate evidence expires at `2026-07-25T18:00:00.000Z`; stale
  authorization fails closed and requires refreshed accepted evidence.

No customer price, credits, ReEditPro fee, service fee, wallet mutation,
customer charge, billing settlement, or invoice authority is included.

## Retained Proof

`npm run smoke:canonical-private-provider-work-lifecycle` proves:

- exact package/snapshot/reservation/route/model/output authorization;
- ordinary tool-queue claims remain blocked for the provider job;
- canonical claim, lease, one-use dispatch, and immutable started-attempt fence;
- timing-safe rejection of a changed dispatch credential;
- private create-only WAV persistence and checksum readback;
- success, failure, unknown, reconciled success, and reconciled failure;
- unknown blocks retry until exact reconciliation;
- an expired consumed attempt fails closed instead of being reclaimed;
- exact replay without a second dispatch;
- retained failed/unknown provider and infrastructure cost;
- route, model, output-cardinality, authorization, credential, and stale-rate
  tamper rejection;
- zero provider requests, zero secret payload reads, zero cloud mutations, zero
  Supabase mutations, and zero billing mutations.

Existing regression proof also passed:

- `npm run smoke:canonical-private-package-work-queue`
- `npm run smoke:canonical-private-package-state-transaction`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:rate-card`
- `npm run smoke:tool-cost-metering`
- `npm run smoke:error-provider-confidentiality`
- `npm run smoke:private-local-persistence`
- server TypeScript and focused ESLint checks

The canonical tool-dispatch regression continues to prove all 50 required tool
identities through their existing tool lifecycle. This provider seam does not
add a tool operation, duplicate registry, duplicate queue, or alternate worker.

## Motion Studio Integration Handoff

Motion Studio should consume these shared contracts rather than create a
Motion-owned queue, lease, registry, provider dispatch, storage, or cost engine:

- `server/edit-architecture/canonical-provider-work-authority.ts`
- `server/services/private-canonical-package-work-queue-store.ts`
- `server/services/private-canonical-provider-dispatch-store.ts`
- `server/services/private-canonical-provider-candidate-store.ts`
- `server/services/canonical-private-provider-work-lifecycle-service.ts`
- `server/tool-cost-metering/private-provider-attempt-cost-evidence.ts`
- `server/validation/canonical-private-provider-dispatch-schemas.ts`
- `server/validation/canonical-private-package-work-queue-schemas.ts`

The current executable lifecycle entry point is intentionally named
`executePrivateInjectedProviderWorkLifecycle`. It accepts injected test bytes
and cannot call Lyria. `canonical_backend_verified_runtime` authorization fails
closed while provider transport is inactive. Motion must not convert the
private injected evidence into `canonical_backend_verified_runtime` or its
canonical receipt.

The synchronized-Foley provider identity is not admitted by this slice. Its
existing deterministic FFmpeg normalization remains separate; a final provider
operation/profile/model identity must be frozen before it can use this same
generic lifecycle.

## Closed Gates

The following remain false or blocked:

- real Lyria transport and provider request;
- provider account access, funds/quota, and generation eligibility;
- Google Secret Manager payload read;
- canonical Motion Studio runtime receipt;
- observed per-attempt Cloud CPU/memory/GPU metering and invoice reconciliation;
- distributed database transaction/durability and cross-instance recovery;
- canonical Supabase persistence, Auth/RLS/Storage, and remote migrations;
- provider activation, Google Cloud deployment, production rendering, public
  delivery, billing, wallet mutation, or customer charging;
- candidate objective QA, human selection, timeline placement, mix, render, and
  export.

No SQL, migration, package-lock, secret, or local runtime configuration was
added by this slice.
