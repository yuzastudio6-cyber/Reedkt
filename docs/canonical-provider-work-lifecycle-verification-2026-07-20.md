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

### Forward-only Speech V2 addendum — 2026-07-21

The historical Lyria V1 authority and hashes remain unchanged. A forward-only
V2 profile now admits the exact bounded Storytelling Speech operation
`provider.elevenlabs.generate_storytelling_speech_candidate.v1` to the same
canonical package queue, claim/lease, sibling one-use provider-dispatch,
private candidate, internal-cost, worker-resource, and compact-receipt
authorities. One private injected attempt owns exactly two ordered outputs:
bounded `audio/mpeg` and bounded private `application/json` alignment. The
verdict is
`CANONICAL_STORYTELLING_SPEECH_MULTI_OUTPUT_PRIVATE_INJECTED_ACCEPTED_TRANSPORT_BLOCKED`.
No ElevenLabs request, secret payload read, cloud mutation, production rate
claim, customer-commercial mutation, or production promotion is enabled.

The source-verified consumer projection added by the follow-up increment has
the secondary verdict
`CANONICAL_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_PRIVATE_INJECTED_ACCEPTED_RUNTIME_BLOCKED`.
It does not promote the injected lifecycle into backend-verified runtime
evidence.

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

## Source-Verified Consumer Receipt

`server/services/canonical-private-provider-attempt-consumer-receipt-service.ts`
is a server-only read projection. It accepts no caller-authored outcome, cost,
request count, output, or readiness fields. Before returning one compact V2
receipt, it reopens and verifies:

- the exact approved package, work item, snapshot, queue definition, queue
  entry, claim/lease, and provider execution fence;
- the one-use provider-dispatch grant, consumed attempt, terminal history, and
  unknown-outcome reconciliation state;
- the create-only provider-attempt cost record;
- the separately create-only worker CPU/memory/resource-cost record; and
- successful private output bytes plus metadata, checksum, artifact lineage,
  and create-only readback evidence.

The receipt contains hashes and bounded identities only. It excludes raw
credentials, prompts/request bodies, provider URLs, local paths, browser
authority, and customer-commercial authority. Private injected evidence is
always classified `non_promotable_private_injected`. Missing or mismatched
worker-resource evidence, cost evidence, output bytes, or queue/dispatch
lineage fails closed.

The compact projection also carries the exact source-derived attempt start and
completion times; queue-attempt and lease aliases with their explicit
claim-is-attempt-and-lease semantics; retry/fallback counts and the sanitized
terminal failure code; and a source-verified consumer-context digest derived
from the exact tenant, edit, snapshot, package, work item, job, operation, and
output. It accepts no caller-asserted Motion production identity. A Motion-owned
production must bind its own durable identity to that exact edit and context
digest.

Provider usage evidence, provider rate-card, legacy provisional
infrastructure rate-card, worker-resource evidence, and selected worker
infrastructure rate-card digests remain separately visible. Successful output
projection includes the private object identity hash and explicit
`providerUrlPersisted = false` / `localPathProjected = false` assertions. The
receipt also attests the already-enforced canonical boundaries that credential
values are not logged, request bodies are not persisted in the queue, and
callers cannot select an executable or provider route.

The receipt uses a bounded private-output set plus a legacy primary-output
alias. Historical V1 source authority still admits zero or one output and
reports `multiOutputProviderOperationAdmitted = false`. The forward-only V2
Speech projection reads and verifies the exact ordered MP3 plus alignment JSON
set and reports `multiOutputProviderOperationAdmitted = true`. Both evidence
classes remain private injected and non-promotable; V2 does not reinterpret a
V1 record or authorize provider transport.

The frozen Lyria V1 request policy admits one generation submission, zero
retries, zero fallbacks, zero redirects, and no automatic resubmission. Its
historical `providerRequestCount` and `maximumProviderRequests` fields mean
generation-submission count, not total lifecycle HTTP requests. The V2
consumer receipt preserves that history and exposes a typed request breakdown.
A failed or unknown attempt cannot silently create a second submission. Any
later submission requires a fresh approved package/snapshot and attempt.

The forward-only synchronized-Foley lifecycle identity is now frozen as:

- operation: `provider.fal.generate_synchronized_foley_candidate.v1`;
- provider boundary: `fal_ai_mmaudio_v2_provider_boundary`;
- route: `fal_ai_mmaudio_v2`;
- provider model family: `fal-ai/mmaudio-v2`;
- work item: `generate_synchronized_foley_candidate`;
- worker class: `provider_worker`;
- private raw output: one `video/mp4` object no larger than `67,108,864` bytes;
- separate downstream normalization:
  `tool.ffmpeg.execute_approved_media_recipe.v1` /
  `approved_synchronized_foley_candidate_normalization_v1`.

Its exact lifecycle ceiling is one private input upload, one generation
submission, 12 status reads, one result read, one binary download, and one
cancellation: 17 total HTTP requests, but still only one generation
submission. Status/result/cancel operations continue the same attempt. There
are no retries, fallbacks, redirects, proxy/PAC use, address fallback, or
resubmission. Unknown outcome must reconcile before a new approved attempt.

Foley remains outside the executable V1 provider-operation registry. Its
immutable provider revision and immutable provider rate/cost authority are not
qualified, so canonical authorization issuance, dispatch, transport, and
production readiness all remain false. This preserves Lyria V1 hashes and
history instead of silently changing their semantics.

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
- source-verified consumer receipts for success, failure, unknown, reconciled
  success, and reconciled failure;
- source-derived consumer context, attempt timing, queue/lease aliases,
  terminal retry/fallback/safe-failure state, private-object identity, and
  closed credential/request/executable/route assertions;
- mandatory observed worker CPU/memory evidence and separate provider versus
  worker-infrastructure cost components and rate-card/evidence digests without
  double counting the older provisional infrastructure component;
- a set-shaped output projection while current multi-output provider admission
  stays false;
- non-promotable injected classification and sensitive-field exclusion;
- preserved V1 generation-submission semantics and the blocked Foley V2
  17-request lifecycle breakdown;
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

The final exact-code `npm run qa:canonical-private-pipeline` run passed all
`39/39` phases with exit code `0`. Its final tool report was generated at
`2026-07-20T16:50:29.095Z`; the provider receipt phase completed in `1,382 ms`,
all 11 mounted named-edit browser tests passed, and the current report scope is
reconciled to 50 registered profiles, all 50 with confined-runner, canonical
private lifecycle, and job-adapter evidence. Provider activation, verified runtime, live cloud,
remote Supabase, billing, deployment, public delivery, external beta, and paid
production all remained false.

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
- `server/services/canonical-private-provider-attempt-consumer-receipt-service.ts`
- `server/tool-cost-metering/private-provider-attempt-cost-evidence.ts`
- `server/tool-cost-metering/private-worker-resource-usage-cost-evidence.ts`
- `server/edit-architecture/canonical-provider-lifecycle-policy.ts`
- `server/validation/canonical-provider-attempt-consumer-receipt-schemas.ts`
- `server/validation/canonical-private-provider-dispatch-schemas.ts`
- `server/validation/canonical-private-package-work-queue-schemas.ts`

The current executable lifecycle entry point is intentionally named
`executePrivateInjectedProviderWorkLifecycle`. It accepts injected test bytes
and cannot call Lyria. `canonical_backend_verified_runtime` authorization fails
closed while provider transport is inactive. Motion must not convert the
private injected evidence into `canonical_backend_verified_runtime` or its
canonical receipt.

Motion can consume the compact source-verified receipt without importing the
long-form pipeline or creating a second queue, registry, lease, provider
dispatch, storage, or cost engine. The synchronized-Foley identity is frozen
only in the V2 lifecycle-policy catalog. It is deliberately not admitted to
V1 authorization or execution until immutable revision and cost qualification
exist. Its deterministic FFmpeg normalization remains a separate canonical
attempt.

Motion's separately frozen
`provider.elevenlabs.generate_storytelling_speech_candidate.v1` requirement is
now admitted only to the private injected V2 lifecycle and source-verified
compact receipt. It preserves one synchronous generation-submission ceiling,
two private create-only outputs under one attempt, and the separate canonical
`approved_storytelling_speech_take_normalization_v1` FFmpeg attempt. The
Speech route cannot execute a real request: immutable provider revision,
production rate authority, zero-retention/account qualification, canonical
runtime release, Secret Manager payload access, and transport all remain
blocked.

## Closed Gates

The following remain false or blocked:

- real Lyria transport and provider request;
- real ElevenLabs Speech transport and provider request;
- provider account access, funds/quota, and generation eligibility;
- Google Secret Manager payload read;
- canonical Motion Studio runtime receipt;
- deployed per-attempt Cloud CPU/memory/GPU metering and invoice reconciliation
  (private injected observed-resource evidence is present but non-promotable);
- distributed database transaction/durability and cross-instance recovery;
- canonical Supabase persistence, Auth/RLS/Storage, and remote migrations;
- provider activation, Google Cloud deployment, production rendering, public
  delivery, billing, wallet mutation, or customer charging;
- candidate objective QA, human selection, timeline placement, mix, render, and
  export.

No SQL, migration, package-lock, secret, or local runtime configuration was
added by this slice.
