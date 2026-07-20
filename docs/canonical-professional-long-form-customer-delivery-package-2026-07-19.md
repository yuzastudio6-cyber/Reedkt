# Canonical professional long-form customer-delivery review and private download

Date: 2026-07-19

Status: `private_local_nine_job_delivery_executed_product_and_cloud_blocked`

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
the exact persisted MP4.

Both objective QA jobs honestly return `needs_user_review` for this synthetic
fixture. The retained smoke therefore exercises an exact immutable authenticated
quality-decision record before it authorizes the ninth job. An accepted decision
binds the exact private master checksum, both decoded-QA evidence hashes, the
known review items, approved intent, and the no-speech disposition. That decision
then authorizes one separately leased, one-use private-download reconciliation
attempt. The completed artifact can be reopened only through the authenticated
workspace boundary and supports verified whole-file and byte-range streaming.
All nine delivery jobs and their exact evidence survive a fresh process-state
replay without a second execution.

This is 9/9 completed jobs for the separate two-chunk customer-delivery graph.
It does not complete the 255-job six-hour capacity graph and it is not a human
review of representative footage. The smoke-owned media workspace is deleted in
a `finally` cleanup, so this proof intentionally leaves no viewable demo file.
Google Cloud dispatch, durable distributed persistence, browser integration,
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
- chunk QA: 2 vCPU, 4 GiB;
- decoded full-master video and audio/sync QA: 2 vCPU, 2 GiB;
- render and long decoded-QA attempts: at most 21,600 seconds; and
- no GPU or provider call.

These remain private single-host runner authorities, not live Cloud Run
configuration. Each of the nine completed delivery attempts retains its own
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
- the immutable review packet exposed decoded-video integrity,
  decoded-audio/sync quality, and speech-intelligibility review items without
  pretending speech analysis ran;
- a wrong expected master checksum failed closed before decision persistence;
- one synthetic authenticated acceptance bound the exact review packet, master,
  decoded-video evidence, decoded-audio evidence, approved intent, and explicit
  no-speech disposition;
- the ninth private-download reconciliation completed through its own
  authorization, lease, one-use attempt, internal-cost evidence, artifact,
  reconciliation, and terminal record;
- authenticated whole-file and first-32-byte range reads matched the exact
  private MP4, while another workspace user was denied;
- delivery queue reached 9 completed, 0 leased, and 0 queued;
- process-state restart returned the exact immutable package, H.264/QA
  completions, mux artifact, both decoded-QA artifacts, both distinct raw-blob
  and runtime-result identities, quality decision, private-download artifact,
  cost evidence, terminal evidence, and service evidence hash without rerunning
  media work;
- customer-delivery master created: true;
- decoded video QA completed: true (`needs_user_review`);
- decoded audio/sync QA completed: true (`needs_user_review`);
- decoded-QA quality disposition: `user_review_required`;
- decoded-QA exact restart replay: true;
- private download reconciled: true;
- authenticated private byte stream verified: true;
- private-download exact restart replay: true;
- final delivery queue complete: 9/9;
- export execution authorized: false;
- product ready: false; and
- production ready: false.

The retained private-review-master SHA-256 was
`3e7d1707b4b9f0442ad92524f033fa7cecb20f73ba3393f31fd17d491db61e82`.
This is local retained evidence, not a deployed object identity.

The retained delivery identities after private mux completion were:

- package hash:
  `5eab8014c6e728df188403763910f7ae477de057b3d1f629b8ccae84c283195e`;
- work-graph hash:
  `c4eaa3af44bb8206dc0090405d235cd0b54edd5b50ce01e3cc29adb32db686df`;
- final queue-aggregate hash:
  `5be85b0b8e099144ae37be2ba98f565c8485c87699bf23836c0e088217f52d2d`;
  and
- private H.264/AAC master SHA-256:
  `dbb8329f33fc78e208f390262b6551388deaa887d9343b32ef43608f841897e3`.

The retained mux internal-cost evidence hash was
`270a9b3cd6a064fd589d3e00e1ba023401c423155a5464dcf104e97745e30627`.
The decoded-video and decoded-audio internal-cost evidence hashes were,
respectively,
`b9ff00e4f065038e3bb7f3754de37b7bf59d6f01e62c07b9b5c2b9772350627e`
and
`c092fbf37b00f8efc328bf9db40aad8321d44d0f57bc653f489668360f1f3fa4`.
The quality-review packet, synthetic acceptance, private-download cost, and
final delivery queue hashes were, respectively,
`2fc9f1af86eb93493ba21febc5f458cde1906790030d1c68811cad8f2afb6108`,
`496832ee427654f2857e61786f17cbdbb3c46ee218dbb17253e2ef697001035a`,
`8569a880d1b0b54f03262d89c4559ec262649ee72be6048c3a1982c265cd92ca`,
and `5be85b0b8e099144ae37be2ba98f565c8485c87699bf23836c0e088217f52d2d`.
These hashes bind the retained local proof only. They do not grant cloud,
commercial, public-delivery, product, or production authority.

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
- independent human quality judgment on representative customer footage; the
  retained acceptance is a deterministic synthetic-test attestation and does
  not change either objective `needs_user_review` outcome;
- a retained demo object or website playback; the smoke deletes its private
  fixture workspace after assertions complete;
- HTTP/browser integration coverage for the new quality-review,
  quality-decision, and authenticated range-download routes;
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

Connect the frozen review/decision/download contract to the canonical signed-in
browser client and prove the HTTP route boundary without changing the product
UI owned elsewhere. The later deployed journey must replace private local files
with tenant-scoped durable Supabase/GCS authority, distributed queue/lease
execution, Cloud Run dispatch, and real cross-instance recovery. It must keep
the original approved 4K estimate/reservation, never introduce a second export
credit prompt or charge, and leave public delivery, billing, and production
closed until their separate evidence passes.
