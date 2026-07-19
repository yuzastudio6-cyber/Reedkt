# Canonical professional long-form customer-delivery package

Date: 2026-07-19

Status: `private_local_delivery_authority_and_queue_proven_media_execution_blocked`

## Outcome

The canonical professional long-form pipeline can now promote one fully passed
private VP9/FLAC review master into a separate immutable H.264/AAC
customer-delivery package. The package and its placement manifest are stored
create-only and content-addressed, and one package-scoped queue is atomically
created and reopened with exact replay.

This slice prepares authority only. It does not encode H.264, mux AAC, unlock a
download, dispatch Google Cloud work, publish media, or mutate billing or
credits.

## Why delivery is a separate package

The completed review graph is immutable and remains 11/11. Customer delivery
therefore cannot append jobs to it or reinterpret its approved snapshot. The
delivery package consumes the exact passed `qa_private_4k_master` completion as
one promotion-satisfied external dependency and creates a new package record,
work graph, placement manifest, and queue under the same approved snapshot.

That separation proves all of the following:

- review completion cannot silently authorize export execution;
- delivery cannot mutate or reopen the approved review graph;
- every delivery attempt remains bound to the original approved snapshot;
- the original approved 4K estimate and funded reservation are reused;
- no second export estimate, reservation, credit prompt, or charge is created;
- internal production cost remains separate from customer price, customer
  credits, service fee, wallet mutation, settlement, and billing; and
- orphan package or placement blobs cannot grant execution authority.

## Fixed delivery graph

For `N` independently QA-passed review chunks, the server derives exactly
`2N + 5` required jobs:

1. validate the exact passed private-review-master QA lineage;
2. encode each VP9 video-only chunk to one bounded H.264 chunk;
3. independently inspect each H.264 chunk;
4. stream-concatenate the compatible H.264 chunks and encode the exact
   continuous FLAC program audio to AAC once;
5. run a full decoded-video objective QA pass;
6. run a full decoded-audio quality and sync QA pass; and
7. reconcile one private download authority record.

The retained two-chunk package has 9 jobs. The maximum 124-chunk package has
253 jobs, a final canonical order of 252, and a 124-dependency mux job. It fits
inside the existing 256-job and 128-dependency queue ceilings without reducing
the already supported six-hour review capacity.

All jobs are CPU-only and are initially `privateExecutionReady = false` under
the gate
`canonical_professional_long_form_customer_delivery_exact_runner_cost_qa_authority`.
The graph does not claim that a planned Cloud Run target is an active cloud
deployment.

## Frozen output contract

The package preserves the exact approved output frame and 30 fps frame timing.
Its delivery target is:

- MP4 with fast-start metadata;
- H.264 High profile, CRF 18 / medium policy, `yuv420p`;
- limited-range BT.709 color space, transfer, and primaries;
- AAC, 48 kHz, stereo;
- ordered compatible H.264 chunk stream copy during the final mux;
- one audio encode from the continuous lossless FLAC program track; and
- no full-program video re-encode during the final mux.

H.264 chunk encoding is deliberately assigned to the pinned private Remotion
runtime boundary. The project FFmpeg image remains LGPL-scoped and is not
silently broadened into an H.264 encoder. The exact long-form Remotion profile,
larger bounded streaming limits, rate card, attempt-cost records, runner
authority, and legal/release evidence remain required before execution.

## Placement and cost boundaries

The blocked placement contract freezes these intended resource shapes:

- control-plane validation/download reconciliation: 1 vCPU, 1 GiB;
- H.264 chunk encode and final mux: 4 vCPU, 8 GiB;
- chunk and decoded-media QA: 2 vCPU, 4 GiB;
- render and long decoded-QA attempts: at most 21,600 seconds; and
- no GPU or provider call.

These are bounded planning authorities, not live Cloud Run configuration.
Every eventual attempt must retain actual internal infrastructure/tool cost,
including failed attempts, under the versioned cost boundary before its job is
made claimable. Customer price, credits, and ReEditPro fee or margin must not be
written into those tool-cost records.

## Retained real-media proof

The full retained command completed with exit code 0:

```text
npm run smoke:canonical-professional-long-form-customer-delivery-package
```

The run rebuilt and verified the real private chain before package promotion:

- 3,870 frames / 129 seconds at 30 fps;
- 2 VP9 object chunks and 1 cross-chunk boundary;
- 48 kHz stereo continuous FLAC program audio;
- private VP9/FLAC Matroska review master;
- independent full-input review-master QA;
- review queue complete at 11/11;
- customer-delivery package graph prepared at 9 jobs;
- delivery queue reopened at 9 queued, 0 leased, 0 completed;
- process-state restart returned the exact same package and queue aggregate;
- customer-delivery master created: false;
- export execution authorized: false;
- product ready: false; and
- production ready: false.

The retained private-review-master SHA-256 was
`3e7d1707b4b9f0442ad92524f033fa7cecb20f73ba3393f31fd17d491db61e82`.
This is local retained evidence, not a deployed object identity.

The retained delivery authority identities were:

- package hash:
  `5547917f27b3c8a5b257d96bf412c49e4a4f7faf513962f74e799fe7847e2e08`;
- work-graph hash:
  `f84247859780da3da16733bfe0ad288dc01294a31aa7a4d732b345cc6e2627de`;
  and
- queue-aggregate hash:
  `d4d066203f3f0eb1ae4c03494bb6d6abb77d1f66827e299435f8b14335dad085`.

These hashes bind the retained local proof only. They do not grant execution,
cloud, download, commercial, or production authority.

The bounded capacity proof also completed with exit code 0:

```text
npm run smoke:professional-long-form-customer-delivery-graph
```

It verified both 2 chunks / 9 jobs and 124 chunks / 253 jobs, unique identities,
canonical ordering, the maximum mux dependency set, exact tool intent, blocked
execution, and malformed chunk-order rejection.

## Closed gates

This slice does not prove or authorize:

- the long-form H.264 Remotion chunk profile or its larger streaming runtime;
- H.264 chunk encoding or independent chunk QA;
- H.264 stream-copy plus FLAC-to-AAC final mux execution;
- attempt-level internal-cost evidence for the new delivery operations;
- queue authorization, lease, heartbeat, one-use dispatch, retry, timeout, or
  restart recovery for delivery jobs;
- decoded video/audio final-master QA execution;
- private download creation or browser delivery;
- distributed database-backed package, queue, outbox, or completion authority;
- GCS persistence, Cloud Run dispatch, IAM/service identity, or live Google
  Cloud cost reconciliation;
- Supabase mutation or migration;
- provider activation;
- billing, wallet mutation, settlement, customer charging, or a second export
  estimate;
- public delivery, deployment, Gmail website acceptance, external beta, or
  production readiness.

## Next dependency-safe capability

Implement and prove the bounded VP9-object-chunk to H.264 private Remotion
runner with its exact long-form input/output limits, immutable authorization,
one-use queue attempt, independent FFprobe QA, and attempt-level internal-cost
evidence. Keep every downstream mux, download, cloud, billing, and public gate
closed until its own evidence passes.
