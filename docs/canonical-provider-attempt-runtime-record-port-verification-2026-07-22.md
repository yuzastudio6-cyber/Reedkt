# Canonical provider-attempt runtime record port verification

Date: 2026-07-22

## Verdict

`CANONICAL_PROVIDER_ATTEMPT_RUNTIME_RECORD_PORT_SOURCE_CONTRACT_ACCEPTED_RELEASE_BLOCKED`

This slice defines one provider-neutral, server-only lookup and projection for
canonical provider attempt state. It does not add a provider transport,
repository, queue, lease, dispatch, output store, checkback engine, cost engine,
database migration, or browser authority.

The port can project the existing canonical package, queue, lease, one-use
dispatch, provider lifecycle, private output, and internal-cost evidence for:

- `provider.lyria.generate_music_candidate.v1`
- `provider.elevenlabs.generate_storytelling_speech_candidate.v1`
- `provider.fal.generate_synchronized_foley_candidate.v1`
- `provider.google.generate_visual_calibration_candidate.v1`

The bounded projection is suitable for future Edit Reference and Motion Studio
consumers. It contains safe identities, hashes, output metadata, attempt outcome,
and separated internal-cost state. It contains no credential, prompt, request
body, provider URL, local path, customer price, credits, service fee, wallet, or
billing authority.

## Attempt outcomes

The source contract distinguishes:

1. `never_submitted`
2. `completed`
3. `failed`
4. `cancelled`
5. `unknown_reconciliation_required`
6. `unknown_reconciled_completed`
7. `unknown_reconciled_failed`

Failed, cancelled, and unknown attempts retain their available provider and
worker cost evidence. They expose neither fallback nor rerun authority. A new
submission remains blocked until the canonical lifecycle/checkback authority
permits it and, where required by policy, issues a fresh approved package and
attempt.

The current canonical consumer receipt V2 has no terminal cancellation state.
Accordingly, cancellation may be represented only by the separate bounded
lifecycle projection and always carries
`canonical_cancellation_receipt_schema_gap`. It cannot be promoted to verified
runtime until the upstream canonical terminal receipt is extended and reviewed.

## Release admission and current-release identity

Caller-shaped release booleans are not qualification authority.

The module exposes a future construction boundary that requires a
non-serializable process capability bound by object identity to both:

- the exact released provider-attempt repository adapter; and
- the server-owned current-release identity reader.

This source version deliberately exposes no capability issuer. A controlled
fixture, a cast object, JSON, browser input, header, request body, environment
assertion, or structurally all-green evidence packet cannot enter the private
qualification registry.

Release evidence is separately compared with the server-owned current release:
source commit, source tree, deployment revision, immutable image digest, queue
runtime evidence, lease runtime evidence, private-output repository evidence,
provider-rate authority, and worker-cost authority. A valid packet from a stale
deployment remains blocked.

## Cost truth

Provider usage/cost and worker infrastructure cost are separate components.

The existing canonical receipt V2 fixes:

- `placeholderInfrastructureRate = true`
- `infrastructureInvoiceReconciled = false`

Therefore this slice reports worker resource usage as observed but the worker
infrastructure rate/cost as provisional. It does not call the combined internal
production cost reconciled and cannot use that receipt for release promotion.
Provider cost for completed/failed attempts and unknown-cost uncertainty remain
visible as internal evidence without becoming customer price, credits, or a
service fee.

## Adversarial proof

The focused smoke proves:

- all seven attempt outcomes;
- exact replay and immutable record digest;
- wrong-tenant denial;
- locator, receipt, output-set, release-evidence, route, model, lease, output,
  and cost-evidence failure or blocking;
- stale current-release identity blocking;
- missing current-release identity blocking;
- forged capability, forged live port, controlled-fixture hosted use, and
  all-green controlled evidence rejection;
- failed/unknown cost retention and zero fallback/rerun authority;
- credential-free and customer-commercial-free projection.

Verification commands:

```text
npm run smoke:canonical-provider-attempt-runtime-record
npm run smoke:canonical-private-provider-work-lifecycle
npm run smoke:canonical-private-multi-output-provider-work-lifecycle
npm run smoke:canonical-private-synchronized-foley-provider-lifecycle
npm run smoke:canonical-private-visual-calibration-provider-lifecycle
npm run smoke:private-worker-resource-usage-cost-evidence
npm run typecheck:server
npm run lint
npm run build
npm run check:frontend-boundary
node database/canonical-v3-local/verify.mjs
git diff --check
```

No provider request, Secret Manager read, cloud mutation, Supabase mutation, SQL
migration, billing operation, deployment, public delivery, or push is part of
this proof.

## Exact remaining release evidence

Verified runtime remains unavailable until a later reviewed release supplies,
on the same protected source/build identity:

1. a durable released repository adapter for the canonical attempt stores;
2. a server-owned current-release identity authority and private capability
   admission in this module;
3. multi-replica queue, lease, idempotency, one-use dispatch, checkback, and
   unknown-outcome recovery evidence;
4. actual private provider transport qualification for the exact operation,
   route, immutable model revision, account, funds/quota, and data policy;
5. numeric-version-pinned Google Secret Manager bindings resolved by the least-
   privilege workload identity;
6. create-only private output checksum/readback evidence;
7. reconciled provider usage/rate evidence and non-placeholder worker
   infrastructure rate/cost settlement evidence;
8. same-SHA protected staging acceptance, restart/replay, rollback, and retained
   release evidence.

Until all of those exist, absence remains fail-closed and
`productionReady=false`.
