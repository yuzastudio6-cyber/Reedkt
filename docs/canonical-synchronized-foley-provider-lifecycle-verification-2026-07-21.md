# Canonical synchronized-Foley provider lifecycle verification

Date: 2026-07-21

## Verdict

`CANONICAL_SYNCHRONIZED_FOLEY_PRIVATE_LIFECYCLE_ACCEPTED_PROVIDER_PRODUCTION_BLOCKED`

The canonical provider spine now admits one forward-only, private-injected
synchronized-Foley lifecycle without changing the executable professional-tool
count. This is a provider operation, not a 51st tool. It reuses the existing
approved package, queue, claim/lease, sibling one-use provider dispatch,
private candidate persistence, attempt-cost evidence, worker-resource evidence,
terminal reconciliation, and consumer-receipt authorities.

The proof performs no Fal request, Secret Manager payload read, cloud mutation,
Supabase mutation, customer charge, timeline mutation, render, export,
deployment, or public delivery. It is non-promotable evidence and does not make
the operation product-ready or production-ready.

## Frozen identity

- Operation: `provider.fal.generate_synchronized_foley_candidate.v1`
- Boundary: `fal_ai_mmaudio_v2_provider_boundary`
- Route: `fal_ai_mmaudio_v2`
- Model: `fal-ai/mmaudio-v2`
- Work item: `generate_synchronized_foley_candidate`
- Worker class: `provider_worker`
- Output: `provider_synchronized_audio_mp4`, `video/mp4`, maximum 67,108,864 bytes
- Downstream operation: `tool.ffmpeg.execute_approved_media_recipe.v1`
- Downstream profile: `approved_synchronized_foley_candidate_normalization_v1`

The provider MP4 and normalized private WAV are separate attempts with separate
lineage, QA, and infrastructure-cost evidence. Admission does not select a
candidate, write a timeline, mix audio, render, export, or deliver anything.

## Request and retry policy

One provider attempt is bounded to:

- one private input upload;
- one generation submission;
- twelve status reads;
- one result read;
- one binary download;
- one cancellation;
- seventeen total lifecycle HTTP requests.

Status, result, download, and cancellation are continuations of the same paid
generation attempt. Retry, fallback, redirect, proxy/PAC, address fallback, and
resubmission are disallowed. An unknown outcome must be reconciled before a new
submission; a new submission requires a fresh approved package and attempt.

## Source-verified consumer receipt

The compact V2 consumer receipt is projected only after re-reading and binding:

- approved snapshot/package/work-item/job identity;
- queue claim, lease aliases, delivery attempt, and terminal completion;
- one-use provider dispatch and terminal/reconciliation lineage;
- exact operation, route, model, lifecycle policy, and request ceilings;
- private create-only MP4 identity, checksum readback, MIME, size, and output-set
  digest;
- provider attempt usage/rate-card evidence;
- observed provider-worker resource evidence and infrastructure rate card;
- failed/unknown attempt cost retention;
- explicit no-secret, no-request-body, no-provider-URL, no-browser-authority,
  and no-commercial-authority boundaries.

The forward-compatible output authority is
`forward_single_output_same_attempt_source`. Historical V1 Lyria and V2
Storytelling Speech receipts and hashes remain readable and unchanged.

## Cost truth

The retained attempt evidence keeps these concepts separate:

1. provider internal production cost;
2. worker infrastructure internal production cost;
3. future customer price, credits, service fee, wallet, and billing.

The private fixture records zero provider cost because no provider request is
made. Provisional infrastructure cost is retained separately and is replaced in
a future release only by qualified observed Cloud worker evidence. Failed and
unknown attempts retain their cost evidence.

## Adversarial proof

`npm run smoke:canonical-private-synchronized-foley-provider-lifecycle` proves:

- private success and exact completed replay;
- failure with sanitized code and retained attempt cost;
- unknown outcome followed by one fenced successful reconciliation;
- no second generation submission during reconciliation;
- worker-resource evidence is required before receipt projection;
- private MP4 create-only persistence and checksum readback;
- malformed MP4 rejection;
- caller-selected provider route rejection;
- typed 17-request async lifecycle ceilings;
- no provider, secret, cloud, Supabase, billing, selection, timeline, render, or
  public-delivery side effect.

## Closed production gates

The following remain explicitly false or unresolved:

- immutable Fal provider revision qualification;
- exact production rate authority and provider usage reconciliation;
- account/model/funds/quota entitlement;
- live server-only Secret Manager binding and provider transport;
- distributed queue/persistence and multi-replica reconciliation;
- qualified Cloud worker runtime and invoice reconciliation;
- objective candidate QA, human review, and selection;
- deployed Auth/RLS/private storage and same-release acceptance;
- billing, customer credits, render/export, deployment, and public delivery.

No source in this slice can promote private-injected evidence to canonical
backend verified runtime or production readiness.

## Canonical aggregate and runtime hardening

The final authoritative command was:

`npm run qa:canonical-private-pipeline`

It passed all 44 retained stages with exit code 0. The aggregate includes the
72 registered tool-operation contracts, the three admitted provider-operation
contracts, 50 canonical end-to-end tool lifecycles, 50 canonical job adapters,
the synchronized-Foley receipt, large-media and UHD streaming proof, retained
professional color and multi-source composition, and the mounted named-edit
browser journey. Provider activation, remote Supabase, customer commerce,
deployment, and public delivery remained false.

The aggregate exposed and verified two shared media-runtime corrections:

- runtime-observer authority is now scoped deterministically to the exact
  checkout/release source instead of one process-global `/tmp` path, preventing
  another concurrent checkout from replacing this checkout's authority file;
- every output stream opened by the media sink is explicitly closed on success,
  rejection, and early return, preventing Node file-handle garbage-collection
  failures after otherwise successful execution.

`npm run smoke:offline-media-binary-execution` passed after both corrections.
The exact previously interrupted long-form color stage also passed independently
before the full aggregate was rerun and completed.
