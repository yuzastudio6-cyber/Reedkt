# Canonical Long-Form Chunk/Merge Verification — 2026-07-15

Status: `verified_local_private_bounded_long_form`

Historical profile note: this document remains the evidence record for the
source-boundary v1 profile. The additive single-source slice v2 profile and its
new readiness limits are verified in
`docs/canonical-source-slice-long-form-verification-2026-07-16.md`. Statements
below that v1 cannot slice a source describe the v1 contract, not the current
combined capability set.

## Scope

This backend slice adds the first snapshot-bound long-form bridge above the
existing direct-composition ceiling. The versioned profile is
`canonical_private_4k_chunk_merge_1920_frames_v1`.

The exact current limits are:

- 481 through 1,920 approved timeline frames;
- two through eight ordered approved source ranges;
- no source operation above the existing 240-frame ceiling;
- two through eight composition chunks;
- 24 through 480 frames per chunk; and
- chunk boundaries only at already-approved source boundaries.

The direct profiles remain unchanged: one source is limited to 240 frames and
one direct ordered source sequence is limited to 480 frames. The long-form
profile does not use its larger total to hide an oversized source operation.
It also fails closed when the timeline would require slicing one approved
source range.

These are private evidence limits, not ReEditPro product-duration limits.
At 30 fps, the current 1,920-frame ceiling is 64 seconds. It is not evidence
that multi-hour raw footage or a 30-minute finished edit is production-ready.

## Connected Canonical Workflow

The browser still supplies only signed-in workflow identity and approved user
choices. The backend derives the exact plan, work graph, tool operations,
payloads, dependencies, leases, dispatch grants, storage lineage, and QA
authority from the immutable approved snapshot.

For this profile, the connected flow is:

1. preserve ordered private source authority, exact source cleanup decisions,
   confirmed output frame, timing, captions, voice, color, and hard cuts;
2. publish the server-owned canonical plan and calculate one 4K UHD estimate;
3. approve the exact plan/estimate and create the existing private-test credit
   reservation before execution;
4. compile source-bound caption, voice, and professional-color work plus exact
   `render_approved_4k_composition_chunk` work items;
5. render every chunk through the pinned confined Remotion runtime;
6. stream each chunk into create-only private persistence, independently probe
   it with the pinned FFprobe runtime, commit QA and reconciliation evidence,
   and prove exact replay;
7. allow `merge_approved_4k_composition_chunks` to read only the lease-selected,
   QA-passed chunk streams in exact contiguous order;
8. render and privately persist the one final 4K H.264/AAC delivery master;
9. independently probe final frame count, dimensions, frame rate, duration,
   codecs, audio, pixel format, and color metadata;
10. reconcile and replay the final artifact; and
11. reopen it through the authenticated private-download boundary and verify
    the exact recorded hash and FFprobe result.

The merge cannot read source objects, caption artifacts, voice artifacts, or
color intermediates directly. Its only media inputs are the exact processed
chunk outputs frozen into the approved work graph.

## Estimate And Cost Boundary

The original approved edit estimate continues to use the universal 4K UHD
cost basis. The chunk and merge jobs reuse the same approved estimate and
reservation. Export does not show or create a second credit estimate, and this
slice adds no export-time credit charge.

Internal production cost remains separate from future customer price,
customer credits, service fee, margin, and settlement. This proof performs no
customer charging, wallet mutation, live billing, or settlement.

## Fresh Actual Evidence

`./node_modules/.bin/tsx server/smoke/canonical-private-long-form-execution-smoke.ts`
passed with exit code 0 after the direct-composition regression fix and global
eight-source defense-in-depth hardening. The fresh signed-in private run proved:

- eight distinct private sources at three seconds each;
- 720 approved frames at 30 fps, or exactly 24 seconds;
- 29 approved work items and 29 completed canonical jobs;
- chunk 1: 19,471,128 bytes, SHA-256
  `41847f5d67ddd056af72cd84328a92a7b2ea76213b834f29be7c666eabb4d107`;
- chunk 2: 11,814,161 bytes, SHA-256
  `d61314ca08c8bb7814c3a166967b673cc66c9167205e951a01270dea299e0332`;
- final master: 30,694,935 bytes, 3840x2160, 30 fps, exactly 720
  frames, H.264 video and AAC audio, SHA-256
  `2087c31c42abb2f60039b8f7bc186e2edbc2eec7eebd3cd2180756dddb7f6be6`;
- independent per-chunk and final FFprobe QA;
- create-only private persistence and reconciliation;
- content-stable chunk and final adapter replay;
- authenticated private-download hash and FFprobe equality; and
- provider, billing, public-delivery, settlement, external-beta, and
  production authority remained false.

The run also proves the mode-specific professional-color reference rule. A
direct composition uses the first source in that exact direct work item. A
later long-form chunk uses the first source in the complete approved sequence,
even when that reference source belongs to an earlier chunk.

## Regression Evidence

The post-change checks passed with exit code 0:

- `npm run typecheck:server`;
- `npm run lint`;
- `npm run check:frontend-boundary`;
- `npm run check:secrets`;
- `node --check docker/prod/offline-remotion-render-execution/runner.mjs`;
- `./node_modules/.bin/tsx server/smoke/canonical-private-long-form-chunk-merge-smoke.ts`;
- `npm run smoke:canonical-planning-publication-client`;
- `npm run smoke:canonical-private-tool-dispatch`;
- `npm run smoke:offline-remotion-render-execution`;
- `npm run smoke:runtime-api-security`;
- `npm run smoke:edit-execution-security-boundary`;
- `npm run smoke:prod-security-privacy`; and
- `npm run qa:internal-pipeline`.

The full internal pipeline regression passed all 27 of 27 stages in 1,760,479
ms. It included the signed-in eight-source private-review journey, real 4K
ingest/proxy evidence, multi-source professional color/voice execution,
large streamed media and audio outputs, UHD Remotion output, browser journey
coverage, and the versioned tool-identity report.

The report still contains 72 registry profiles, 61 callable candidates, 53
confined-runner-verified identities, and exactly 50 private canonical E2E plus
50 canonical job-adapter verified identities. Those 50 are evidence-backed
private/internal tool identities; they are not 50 product-, beta-, cloud-, or
production-ready tools.

## Performance Target Versus Proven Performance

A reasonable provisional engineering target for an already-analyzed,
approved, mostly deterministic 30-minute edit on a warm parallel Google Cloud
fleet is a 10-to-20-minute median edit-plus-finalization time. That is a target
to benchmark, not a current SLA and not a promise for every project.

Output duration alone is not enough to estimate end-to-end time. A 30-minute
finished program may be selected from many hours of multicamera footage. Its
user-visible time has at least three separate clocks:

1. upload, verification, proxy creation, transcript, scene, audio, and visual
   analysis across all raw source hours;
2. planning, user review, estimate approval, and any requested revisions; and
3. approved edit execution, final 4K assembly, QA, and private delivery.

The 10-to-20-minute target applies only to the third clock for a warm,
deterministic workload class. Heavy generative video, restoration, denoise,
optical flow, complex masks, or extensive fallback work may take longer and
must receive a separate pre-execution ETA derived from the approved work graph.

This local proof is deliberately not used as a throughput claim. It renders
only 24 seconds of synthetic media, runs chunks serially, and spends material
time in isolated high-quality 4K encoding and verification. It proves
correctness and exposes the critical path; it does not predict cloud speed.

## Required Google Cloud Architecture And Benchmarks

Before ReEditPro can claim professional multi-hour scale or the provisional
30-minute performance target, the deployed system still needs evidence for:

- resumable multipart upload of genuinely large masters into private object
  storage, with generation, ETag, checksum, lifecycle, CORS, IAM, retention,
  deletion, and interrupted-session recovery;
- immutable masters plus analysis proxies, with proxies never promoted into
  final-render authority;
- streaming metadata, transcript, scene, audio, and visual analysis over hours
  of source media without whole-file memory loading;
- professional multicamera timecode/waveform synchronization and drift QA;
- selects, retake choice, source cleanup, meaning preservation, and user-review
  gates across hundreds or thousands of clips;
- a durable distributed work graph with service identity, leases, heartbeats,
  idempotency, bounded retries, cancellation, host-loss recovery, dependency
  readiness, artifact reconciliation, and replay;
- operation-aware CPU, GPU, memory, disk, and codec routing instead of sending
  every tool to a GPU;
- data-local workers, bounded fan-out, autoscaling, prewarmed images/models,
  quota admission, and reserved finalization capacity;
- safe frame/keyframe-aware slicing of a single long source, cross-chunk audio
  continuity, exact global timing, and distributed object merge;
- an approved visually lossless mezzanine or codec-compatible segment strategy,
  generation-loss QA, and a final concat/mux or distributed encode path that
  does not serially decode and re-encode the complete program after its chunks
  have already been rendered;
- stage-level progress and ETA confidence for queued, transferring, analyzing,
  executing, probing, QA, reconciling, and retry states;
- cost and utilization telemetry that keeps internal production cost separate
  from future customer price and credits; and
- representative cold and warm benchmarks for 30-minute, one-hour, and
  multi-hour raw inputs; 30-minute and longer outputs; 1080p, 2K, and 4K;
  common camera codecs, long-GOP, VFR, ProRes, multichannel audio, timecode,
  HDR/wide gamut, damaged files, and failure recovery, with p50 and p95 results.

## Honest Readiness Boundary

This slice does not implement or claim:

- a timeline above 1,920 frames;
- more than eight sources or chunks;
- mid-source slicing;
- parallel or distributed chunk execution;
- a production mezzanine/master strategy or proof against quality loss from
  the current bounded H.264 chunk encode plus H.264 final re-encode;
- deployed GCS storage, Google Cloud worker identity, autoscaling, monitoring,
  or a measured cloud SLO;
- hours of raw media, a 30-minute output, huge-file ceilings, multicamera sync,
  HDR/color-managed delivery, or a broad real-footage corpus;
- provider activation, live Supabase, live billing, wallet mutation, customer
  charging, settlement, public delivery, deployment, external beta, or
  production rendering;
- Motion Studio or MS-001; or
- Edit Reference/Edit Preferences implementation owned by the separate
  coordinated task.

The next long-form milestone must extend capacity through a new versioned
profile and new evidence. It must not silently raise these limits or infer
production readiness from this bounded local proof.
