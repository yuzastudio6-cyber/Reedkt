# Canonical professional long-form customer-delivery package and private mux

Date: 2026-07-19

Status: `private_local_h264_aac_delivery_mux_proven_decoded_qa_and_download_blocked`

## Outcome

The canonical professional long-form pipeline can promote one fully passed
private VP9/FLAC review master into a separate immutable H.264/AAC
customer-delivery package. The package, placement manifest, and package-scoped
queue are stored create-only/content-addressed and reopen with exact replay.

For the retained two-chunk fixture, the backend now also completes the delivery
root, both bounded 4K H.264 encodes, both independent per-chunk QA jobs, and one
private H.264/AAC master mux. The mux stream-copies the ordered compatible H.264
video, encodes the exact continuous FLAC program track to AAC-LC once, streams
the result into create-only private persistence, independently probes the
result with FFprobe, records attempt-level internal production cost, and
survives a fresh process-state replay without a second execution.

This is six completed jobs out of the separate nine-job delivery graph. It does
not complete the 255-job six-hour review graph. Decoded full-master video QA,
decoded audio/sync QA, private-download reconciliation, Google Cloud dispatch,
public delivery, billing, and production remain blocked.

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

- MP4 with front-loaded fragmented initialization metadata (`ftyp` and `moov`
  before media payload);
- H.264 High profile, CRF 18 / medium policy, `yuv420p`;
- limited-range BT.709 color space, transfer, and primaries;
- AAC, 48 kHz, stereo;
- ordered compatible H.264 chunk stream copy during the final mux;
- one audio encode from the continuous lossless FLAC program track; and
- no full-program video re-encode during the final mux.

H.264 chunk encoding is deliberately assigned to the pinned private Remotion
runtime boundary. The project FFmpeg image remains LGPL-scoped and is not
silently broadened into an H.264 encoder. The fixed private FFmpeg mux recipe
performs stream copy plus the single AAC encode; it does not encode H.264.

## Placement and cost boundaries

The placement contract freezes these resource shapes:

- control-plane validation/download reconciliation: 1 vCPU, 1 GiB;
- H.264 chunk encode and final mux: 4 vCPU, 8 GiB;
- chunk and decoded-media QA: 2 vCPU, 4 GiB;
- render and long decoded-QA attempts: at most 21,600 seconds; and
- no GPU or provider call.

These remain private single-host runner authorities, not live Cloud Run
configuration. Each of the six completed delivery attempts retains its own
versioned internal infrastructure/tool-cost evidence. Failed attempts are also
retained by that cost boundary. Customer price, credits, and ReEditPro fee or
margin are not written into those tool-cost records.

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
- delivery root completed once;
- 2 H.264 High-profile video-only chunks completed with exact frame/color
  lineage and private create-only persistence;
- 2 independent FFprobe chunk-QA jobs completed;
- all mux dependencies satisfied before authorization;
- 1 private MP4 master completed through ordered H.264 stream copy plus one
  192 kbps, 48 kHz, stereo AAC-LC encode;
- delivery queue reached 6 completed, 0 leased, and 3 still queued;
- process-state restart returned the exact immutable package, H.264/QA
  completions, mux artifact, cost evidence, terminal evidence, and service
  evidence hash without rerunning media work;
- customer-delivery master created: true;
- decoded video QA completed: false;
- decoded audio QA completed: false;
- private download reconciled: false;
- export execution authorized: false;
- product ready: false; and
- production ready: false.

The retained private-review-master SHA-256 was
`3e7d1707b4b9f0442ad92524f033fa7cecb20f73ba3393f31fd17d491db61e82`.
This is local retained evidence, not a deployed object identity.

The retained delivery identities after private mux completion were:

- package hash:
  `2b12662c817f45f915bad511b638534894b9fec2f8132e2631598bfebfc59003`;
- work-graph hash:
  `c6870be744b8216d57c1e59f9829a8bca4537749020c6a622655a009b10eca45`;
- queue-aggregate hash:
  `41f36e4f73597b17a524b410c48c7c047806a3a5fa4b71c716117cb201b387e9`;
  and
- private H.264/AAC master SHA-256:
  `dbb8329f33fc78e208f390262b6551388deaa887d9343b32ef43608f841897e3`.

The retained mux internal-cost evidence hash was
`429244872cbbc25ca8d148c3957046c2e946b06fc12cea7c78e155d28d879329`.
These hashes bind the retained local proof only. They do not grant decoded-QA,
cloud, download, commercial, public-delivery, or production authority.

The bounded capacity proof also completed with exit code 0:

```text
npm run smoke:professional-long-form-customer-delivery-graph
```

It verified both 2 chunks / 9 jobs and 124 chunks / 253 jobs, unique identities,
canonical ordering, the maximum mux dependency set, exact tool intent, blocked
execution, and malformed chunk-order rejection.

## Closed gates

This slice does not prove or authorize:

- more than the retained 129-second/two-chunk synthetic SDR delivery fixture;
- representative multi-camera production footage, diverse codecs, HDR, VFR,
  surround audio, damaged media, multi-hour delivery throughput, or 124-chunk
  runtime execution;
- failure/retry exhaustion, lease-loss reclaim, worker termination, or
  host-loss recovery for the delivery mux;
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

Implement the two separately leased decoded-master QA jobs against the exact
persisted MP4: one full decoded-video objective pass and one decoded-audio
quality/sync pass. Only after both immutable QA completions reconcile may the
separate private-download job be considered. Keep cloud, billing, public
delivery, and production gates closed until their own evidence passes.
