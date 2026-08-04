# Canonical provider-attempt runtime consumer verification

Date: 2026-07-22

## Verdict

`CANONICAL_PROVIDER_ATTEMPT_RUNTIME_CONSUMER_SEAM_ACCEPTED_RELEASE_BLOCKED`

This slice mounts the existing canonical provider-attempt runtime source port in
the server runtime and service context, then adds one server-only consumer
boundary. It does not add a browser route, provider transport, repository,
queue, lease, dispatcher, artifact store, cost engine, database migration, or
production qualifier.

The consumer can read only the four operations already admitted by the frozen
provider-attempt locator:

- `provider.lyria.generate_music_candidate.v1`
- `provider.elevenlabs.generate_storytelling_speech_candidate.v1`
- `provider.fal.generate_synchronized_foley_candidate.v1`
- `provider.google.generate_visual_calibration_candidate.v1`

Motion Studio audio consumers are restricted to Lyria, ElevenLabs Speech, and
FAL synchronized Foley. Motion visual-calibration consumers are restricted to
Google visual calibration. Edit Reference may consume the four-operation seam
only for exact supported downstream media or calibration work.

## Reasoning-authority separation

This port is not the authority for Edit Reference Study Chat or long-form
reasoning. The existing V6 durable Study Chat multi-attempt
Kimi K3 -> Qwen 3.7 -> DeepSeek V4 Pro receipt/checkback/cost authority and the
long-form semantic reasoning-route authority remain separate. Qwen2.5-VL also
remains a visual-understanding specialist outside this media-provider receipt.

A server context may carry both dependencies, but neither can substitute for
the other. Unsupported Kimi, Qwen, DeepSeek, and Qwen2.5-VL operation IDs fail
both locator schema validation and the consumer's runtime operation allowlist
before the source port is read. Browser query/body/header input cannot choose a
provider operation or source port.

## Authority and projection

The boundary requires:

- authenticated actor identity matching the server locator owner;
- an already-authorized exact workspace/project/edit scope matching the
  locator;
- an operation admitted for the exact consumer class; and
- the single server-injected canonical source port.

It then delegates to the frozen runtime-record verifier. The returned bounded
projection keeps the exact package/job/attempt/lease/dispatch/route/model/
output/cost lineage and seven outcome states while excluding credentials, raw
prompts and provider bodies, provider URLs, local paths, signed URLs, customer
price, credits, service fee, wallet, and billing authority.

Controlled ports remain usable only for local proof. Hosted mode requires the
future privately qualified released repository adapter and same-release
evidence; this source version exposes no live qualifier, so hosted absence or a
controlled port fails closed.

## Adversarial proof

The focused smoke proves:

- app options -> runtime state -> service context propagation;
- Edit Reference supported downstream and Motion audio consumers read the same
  source port;
- Study Chat and long-form reasoning ports are neither supplied nor
  substituted;
- wrong actor and wrong exact scope fail before a source read;
- a consumer/operation mismatch fails before a source read;
- unsupported Kimi, Qwen, DeepSeek, and Qwen2.5-VL operations fail before a
  source read, even under an internal type-forgery attempt;
- browser-selected operation input has no authority;
- missing or hosted-unqualified ports fail closed; and
- the projection contains no credential, provider URL, local path, or customer
  commercial authority.

Verification commands:

```text
npm run smoke:canonical-provider-attempt-runtime-consumer
npm run smoke:canonical-provider-attempt-runtime-record
npm run smoke:canonical-private-provider-work-lifecycle
npm run smoke:canonical-private-multi-output-provider-work-lifecycle
npm run smoke:canonical-private-synchronized-foley-provider-lifecycle
npm run smoke:canonical-private-visual-calibration-provider-lifecycle
npm run typecheck:server
npm run lint
npm run build
npm run check:frontend-boundary
npm run check:secrets
node database/canonical-v3-local/verify.mjs
git diff --check
```

No provider request, Secret Manager payload read, remote Supabase or cloud
mutation, SQL migration, customer-commercial action, billing, deployment,
public delivery, or push is part of this slice.

## Remaining live gates

`productionReady` remains false until a reviewed same-release deployment
provides the released repository adapter and private qualification capability,
current-release identity, durable multi-replica queue/lease/idempotency and
unknown-outcome recovery evidence, exact provider/model/account/data-policy
qualification, pinned Secret Manager versions under least-privilege workload
identity, create-only private-output readback, reconciled provider and worker
internal-cost evidence, and protected staging/restart/rollback acceptance.

Study Chat, long-form reasoning, and Qwen2.5-VL require their own existing or
future source-verified runtime adapters and cannot use this seam as promotion
evidence.
