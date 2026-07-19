# Canonical professional long-form customer-delivery package and decoded QA

Date: 2026-07-19

Status: `private_local_delivery_and_decoded_qa_executed_quality_review_and_download_blocked`

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
result with FFprobe, records attempt-level internal production cost, and then
runs separately leased full decoded-video and decoded-audio/sync QA jobs against
the exact persisted MP4. All eight completed delivery jobs survive a fresh
process-state replay without a second execution.

This is eight completed jobs out of the separate nine-job delivery graph. Both
objective QA jobs honestly returned `needs_user_review` for this synthetic
fixture, so the ninth private-download reconciliation job remains queued and
unattempted. This does not complete the 255-job six-hour capacity graph. Quality
review/reconciliation, private download, Google Cloud dispatch, public delivery,
billing, and production remain blocked.

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
- chunk QA: 2 vCPU, 4 GiB;
- decoded full-master video and audio/sync QA: 2 vCPU, 2 GiB;
- render and long decoded-QA attempts: at most 21,600 seconds; and
- no GPU or provider call.

These remain private single-host runner authorities, not live Cloud Run
configuration. Each of the eight completed delivery attempts retains its own
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
- the independent technical probe counted all 3,870 frames and bound nominal
  30 fps plus exact video/audio stream durations instead of trusting the
  unreliable non-seekable fragmented-container duration alone;
- decoded-video checksum timestamps were normalized to exact frame ordinals
  while original timestamps remained independently probed; all 3,870 decoded
  frames were accounted for without trim, drop, or duplication;
- decoded-audio checksum timestamps were normalized to exact integer sample
  ordinals under the verified 1/48,000 time base; retained AAC padding was
  measured within the approved two-frame A/V bound rather than removed or
  hidden;
- delivery queue reached 8 completed, 0 leased, and 1 still queued;
- process-state restart returned the exact immutable package, H.264/QA
  completions, mux artifact, both decoded-QA artifacts, both distinct raw-blob
  and runtime-result identities, cost evidence, terminal evidence, and service
  evidence hash without rerunning media work;
- customer-delivery master created: true;
- decoded video QA completed: true (`needs_user_review`);
- decoded audio/sync QA completed: true (`needs_user_review`);
- decoded-QA quality disposition: `user_review_required`;
- decoded-QA exact restart replay: true;
- private download reconciled: false;
- export execution authorized: false;
- product ready: false; and
- production ready: false.

The retained private-review-master SHA-256 was
`3e7d1707b4b9f0442ad92524f033fa7cecb20f73ba3393f31fd17d491db61e82`.
This is local retained evidence, not a deployed object identity.

The retained delivery identities after private mux completion were:

- package hash:
  `e3cd05818d8f3cf94d0c0037807009b79808339111eb785f01941aa0a5a953a8`;
- work-graph hash:
  `b3cd84be397f48255e8ec5c9f023f08c404d29669b66c474a7a35735955e9e47`;
- queue-aggregate hash:
  `e56d4281d568d505415491e99c2a381d3b6f9ecf6be59dd4972949cd73534f28`;
  and
- private H.264/AAC master SHA-256:
  `dbb8329f33fc78e208f390262b6551388deaa887d9343b32ef43608f841897e3`.

The retained mux internal-cost evidence hash was
`93e2583a9e8f49cc4719bc44a78dcffc2bdd1679aa3839205fa87f1da5b8c178`.
The decoded-video and decoded-audio internal-cost evidence hashes were,
respectively,
`1f3ccb715b24406e04a98bd9af3b70336721e29cdba10235491a7f61035795eb`
and
`25045b68642b7c9b39fc13c30d4131ff6467ae2fe20f9c989ea5254b5c9d2855`.
These hashes bind the retained local proof only. They do not grant quality
acceptance, cloud, download, commercial, public-delivery, or production
authority.

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
- objective quality acceptance or resolution of either retained
  `needs_user_review` outcome;
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

Reconcile both immutable decoded-QA `needs_user_review` outcomes with the exact
approved intent, upstream semantic/technical evidence, and an authenticated
review decision. Only an accepted, immutable quality reconciliation may
authorize the separately leased private-download job. Reuse the original
approved 4K estimate/reservation without a second credit prompt or charge. Keep
cloud, billing, public delivery, and production gates closed until their own
evidence passes.
