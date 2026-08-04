# Canonical Storytelling Speech Multi-Output Provider Lifecycle — 2026-07-21

## Verdict

`CANONICAL_STORYTELLING_SPEECH_MULTI_OUTPUT_PRIVATE_INJECTED_ACCEPTED_TRANSPORT_BLOCKED`

ReEditPro now has one forward-only canonical lifecycle contract for Motion
Studio's exact Storytelling Speech provider requirement. It reuses the existing
approved execution package, private package queue, claim/lease, sibling
one-use provider dispatch, private candidate storage, attempt-cost authority,
worker-resource evidence, terminal/replay state, and compact server-only
consumer receipt.

This is private injected proof. It makes zero ElevenLabs requests, reads zero
Secret Manager payloads, performs zero cloud/Supabase/billing mutations, and
cannot be promoted to canonical backend runtime or production readiness.

## Exact operation contract

- operation: `provider.elevenlabs.generate_storytelling_speech_candidate.v1`
- provider boundary:
  `elevenlabs_eleven_v3_storytelling_speech_provider_boundary`
- route: `elevenlabs_eleven_v3_storytelling_speech`
- model family: `eleven_v3`
- work item: `generate_storytelling_speech_candidate`
- worker class: `provider_worker`
- request lifecycle: one synchronous generation submission, one response,
  zero retry, zero fallback, zero redirect, zero resubmission
- output 1: `provider_storytelling_speech_audio_mp3`, `audio/mpeg`, maximum
  16,777,216 bytes
- output 2: `provider_storytelling_speech_alignment_json`,
  `application/json`, maximum 1,048,576 bytes
- downstream attempt: `tool.ffmpeg.execute_approved_media_recipe.v1` with
  `approved_storytelling_speech_take_normalization_v1`

The output order is immutable. Both outputs belong to the same package job,
claim/lease, dispatch attempt, terminal, and output-set digest. The queue's
legacy primary artifact alias points to output 1, while the terminal and
consumer receipt retain both outputs.

## Authority and lifecycle

The V2 authority is forward-only. Historical Lyria V1 authorization, grant,
terminal, private WAV, cost, and request-count records are still parsed and
verified by their original schemas and functions.

The Speech lifecycle requires:

1. one funded canonical execution package and immutable approved snapshot;
2. one exact provider-backed work item with two ordered required outputs;
3. one canonical queue definition and claim/lease;
4. one V2 provider-work authorization whose route, model, request policy,
   output set, cost policy, rate snapshot, reservation, and idempotency hashes
   are derived server-side;
5. one sibling provider-dispatch grant and one consumed attempt;
6. one private create-only candidate set with exact checksum/metadata readback;
7. one provider-attempt internal-cost record and one separately observed worker
   resource/infrastructure-cost record;
8. one terminal record that binds the persisted candidate-set digest; and
9. exact queue completion/release plus idempotent readback/replay.

A success requires both outputs. A failure requires zero outputs and retains
the attempt's internal infrastructure cost. A malformed MP3, malformed JSON,
changed output order, stale package/authorization, missing resource evidence,
changed lease/dispatch lineage, or altered receipt fails closed.

## Compact consumer receipt

`projectCanonicalPrivateProviderAttemptConsumerReceiptV2` reads persisted
canonical sources instead of accepting caller-authored outcome evidence. It
projects:

- exact owner/workspace/project/edit/snapshot/package/work-item/job identity;
- source-derived consumer-context digest with output-set derivation;
- exact attempt start/completion time;
- queue attempt plus explicit claim-is-attempt-and-lease IDs/hashes;
- one-use dispatch, terminal state, retry/fallback counts, and sanitized safe
  failure code;
- both private object identity hashes, checksums, byte lengths, MIME types,
  storage/readback evidence, and explicit `providerUrlPersisted = false` and
  `localPathProjected = false`;
- provider usage/rate-card evidence separately from worker infrastructure
  usage/rate-card evidence; and
- closed security, browser, commercial, transport, distributed-persistence,
  promotion, and production boundaries.

The receipt never includes raw credential material, server-private voice ID,
prompt/request body, raw alignment content, provider URL, local path, customer
price, customer credits, service fee, wallet mutation, or billing authority.
Its evidence class is `private_injected_nonprovider_test`; its promotion class
is `non_promotable_private_injected`.

The projection also revalidates that observed worker infrastructure cost does
not exceed either the immutable attempt's infrastructure ceiling or total
internal-cost ceiling, and that the observed resource interval ends no later
than the source-verified provider terminal.

## Cost boundary

Provider and infrastructure internal production cost remain separate.

- The current provider rate snapshot is an exact private fixture digest, not a
  production ElevenLabs rate or invoice.
- Provider requests and billed usage are zero, so provider internal cost is
  zero.
- The provider-attempt record retains a provisional allocated-wall-time
  infrastructure component.
- The compact receipt selects the separately observed worker-resource cost as
  its infrastructure component and does not double-count the provisional
  component.
- Failed attempts retain infrastructure cost.
- Customer price, credits, ReEditPro service fee, wallet, billing, and charging
  remain outside every record.

## Retained proof

Run:

```bash
npm run smoke:canonical-private-multi-output-provider-work-lifecycle
```

The smoke proves:

- exact Speech identity, lifecycle policy, two-output profile, and blocked
  production qualification;
- successful two-output private ingest and source checksum readback;
- the candidate-store output-set digest is bound into the dispatch terminal;
- exact queue claim/lease and one-use dispatch lineage;
- missing worker-resource evidence blocks receipt projection;
- observed worker CPU/memory and separate internal infrastructure cost;
- source-verified compact receipt mapping without caller invention;
- exact completed replay without another attempt;
- unknown outcome blocks resubmission and reconciles the same attempt to both
  success and failure with prior-terminal/cost lineage;
- failed terminal projection with zero outputs and retained cost;
- malformed MP3/JSON rejection;
- receipt output-order and promotion tamper rejection;
- observed worker infrastructure-cost ceiling rejection;
- no persisted injected dispatch credential;
- no raw alignment content in the receipt; and
- zero provider, secret-payload, cloud, Supabase, billing, public-delivery, or
  production side effects.

Historical regression remains:

```bash
npm run smoke:canonical-private-provider-work-lifecycle
npm run smoke:private-worker-resource-usage-cost-evidence
npm run typecheck:server -- --pretty false
```

The Speech smoke is also a required stage in
`npm run qa:canonical-private-pipeline`.

The retained v32 aggregate passed `43/43` phases with exit code `0`; its final
tool report was generated at `2026-07-21T03:00:20.253Z`, and the Speech phase
completed in `1,507 ms`. The stricter observed-cost/terminal-time guard was
added during the final post-aggregate review and then passed the focused Speech
adversarial smoke, historical Lyria smoke, and server typecheck. It is not
misrepresented as a second full aggregate execution.

## Shared integration contract

Motion Studio should consume these backend-owned exports rather than import the
long-form pipeline or create a second registry, queue, lease, dispatch, storage,
or cost system:

- `executePrivateInjectedMultiOutputProviderWorkLifecycle`
- `projectCanonicalPrivateProviderAttemptConsumerReceiptV2`
- `createCanonicalProviderOperationRegistryV2`
- `resolveCanonicalProviderOperationV2`
- `canonicalProviderWorkAuthorizationV2Schema`
- `canonicalPrivateProviderDispatchGrantV2Schema`
- `canonicalPrivateProviderDispatchTerminalV2Schema`
- `privateProviderAttemptCostEvidenceV2Schema`
- `readVerifiedPrivateCanonicalProviderCandidateSetV2`

The compact receipt is the narrow consumer seam. Motion must map its own
durable production identity to the receipt's exact edit and source-derived
consumer-context digest. It must not map private injected or unreleased
evidence to `canonical_backend_verified_runtime`.

## Closed gates

- immutable ElevenLabs provider revision qualification;
- exact production account rate authority and provider usage reconciliation;
- production zero-retention/account entitlement;
- Google Secret Manager payload access;
- real provider adapter and network transport;
- deployed cross-instance durability and crash recovery for the locally proven
  V2 unknown-outcome reconciliation protocol;
- deployed Cloud Run worker/resource observation and invoice reconciliation;
- canonical Supabase/Auth/RLS/Storage persistence;
- real customer price/credits/service-fee settlement, wallet, or billing;
- timeline mutation, final render/export, public delivery, deployment,
  external beta, and paid production.

Therefore this increment closes the local provider-neutral multi-output
lifecycle and consumer-receipt shape needed by Motion Studio. It does not claim
that ElevenLabs Speech is executable against a live provider or ready for
customers.
