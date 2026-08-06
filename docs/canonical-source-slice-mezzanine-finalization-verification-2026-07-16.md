# Canonical Source-Slice Mezzanine Finalization Verification — 2026-07-16

Status: `verified_local_private_bounded_source_slice_mezzanine_v3`

## Outcome

ReEditPro now has a third additive private long-form profile:

`canonical_private_4k_source_slice_mezzanine_finalize_3840_frames_v3`

V3 keeps the exact one-source, 241–3,840-frame, two-through-sixteen-chunk
planning limits from source-slice v2. It replaces v2's serial full-program
Remotion re-render with an exact server-owned FFmpeg finalization operation:

- preflight every chunk for H.264 codec/profile, dimensions, pixel format,
  BT.709 matrix/transfer/primaries, limited range, time base, extradata,
  frame count, keyframe, range, and ordering compatibility;
- write only the approved frame-derived concat durations;
- stream-copy the compatible H.264 video instead of decoding and re-encoding
  the complete program;
- ignore chunk audio during finalization; and
- trim and encode the one approved source-audio range to 48 kHz stereo AAC
  exactly once before the private MP4 mux.

This is a bounded private/local readiness result. It does not promote the
profile to product, external beta, distributed cloud, public delivery, or
production readiness.

## Canonical Authority And Credit Boundary

The complete V3 path requires the original canonical lifecycle:

1. signed-in workspace/project/edit authority and verified private source;
2. confirmed output frame, exact source cleanup, timing, and one server-owned
   canonical plan;
3. the initial universal 4K UHD estimate and exact funded private-test
   reservation;
4. immutable approved snapshot, package, and dependency graph;
5. one lease and single-use dispatch per exact operation;
6. create-only private persistence, independent FFprobe QA, reconciliation,
   bounded retry, adapter replay, and downstream byte verification; and
7. final private review assembly and authenticated private download.

The finalizer reuses the original approved estimate and reservation. It creates
no second export estimate, reservation, credit deduction, wallet mutation,
service fee, settlement, or billing event.

## Attempt-Level Internal Production Cost

V3 adds create-only attempt evidence for these exact workload profiles:

- `remotion_4k_source_slice_chunk_cpu_2vcpu_4gib_v1`; and
- `ffmpeg_4k_mezzanine_finalization_cpu_2vcpu_4gib_v1`.

Each record binds workspace, project, edit session, approved snapshot, work
item, job, execution attempt, retry number, tool, operation, fixed CPU/RAM/GPU
envelope, measured wall time, output size when present, outcome, and canonical
outcome hash. Cost math uses integer micros and rate card
`rp-ratecard-01-mock-safe`.

Failed started attempts retain their internal cost and are classified as
ReEditPro-absorbed failures. Terminal private review verifies every successful
required profile plus every failed started retry and commits all evidence
hashes into the private review manifest. The records contain no customer price,
customer credits, service fee, margin, wallet, settlement, or charging
authority.

## Fresh Signed-In Evidence

This exact command passed with exit code 0:

```text
REEDITPRO_SOURCE_SLICE_LONG_FORM_PROOF=1 \
  npx tsx server/smoke/canonical-private-long-form-execution-smoke.ts
```

The clean run proved:

- one finalized private 22-second audio-bearing source;
- 660 approved frames at 30 fps;
- exact source/global ranges `0–220`, `220–440`, and `440–660`;
- eight approved work items and eight completed canonical jobs;
- three independently persisted, probed, QA-passed, reconciled, and replayable
  3840x2160 H.264 chunks;
- one bounded failed chunk attempt followed by same-operation attempt-two
  recovery without replacing completed independent work;
- final artifact `artifact_result_aa93cc5a9e4f8489462e4d374f6b95fba68afefe`;
- final SHA-256
  `741c80b1578e6c7166d77bd8dcba8278e89a048cb54b57752c51371df4605239`;
- 31,931,596 final bytes, 3840x2160, 30 fps, and exactly 660 frames;
- H.264 `yuv420p` with BT.709 matrix, transfer, and primaries plus limited
  (`tv`) range;
- 48 kHz stereo AAC from the one continuous approved source range;
- authenticated private download, exact checksum, independent final QA,
  final-master verifier, terminal review assembly, and idempotent manifest
  replay; and
- provider, customer-price, customer-credit, service-fee, wallet, settlement,
  billing, public-delivery, deployment, external-beta, and production authority
  all remained false.

The final decoded audio contained 1,056,768 samples over 22.016 seconds. The
technical boundaries passed the exercised continuity checks:

| Boundary | Sample | Adjacent delta | RMS before | RMS after |
| ---: | ---: | ---: | ---: | ---: |
| frame 220 | 352,000 | 0.003778 | 0.088366 | 0.088319 |
| frame 440 | 704,000 | 0.003423 | 0.088281 | 0.088326 |

Four completed attempt-cost records and one failed-attempt record were
preserved. Their total provisional internal production cost was 186,956 micros.
That number is internal evidence only; it is not a customer price, credit
charge, service fee, or settlement amount.

## Performance Evidence

The resource-aware local graph completed in 379,285 ms, or 6.32 minutes,
including local container startup, one bounded retry, three 4K chunk renders,
stream-copy finalization, one source-audio encode, probes, persistence, QA,
reconciliation, replay, review assembly, and private download.

The older v2 proof took 19.81 local minutes and performed a full-program final
Remotion render/encode. V3 removes that known serial re-encode. The two runs are
correctness evidence, not a controlled benchmark comparison, Google Cloud
result, p50/p95 measurement, customer ETA, or SLA.

## Validation Packet

The bounded slice passed:

- `npm run typecheck:server`;
- `npm run smoke:private-internal-attempt-cost-evidence`;
- `npm run smoke:edit-planning-authority`;
- `npm run smoke:canonical-private-tool-dispatch`, including all 50 exact
  canonical tool identities;
- `npm run smoke:offline-media-binary-execution`;
- `npx tsx server/smoke/offline-remotion-streaming-output-smoke.ts`; and
- the fresh signed-in V3 command above.

The post-fix aggregate command also passed all 27/27 phases with exit code 0:

```text
npm run qa:internal-pipeline
```

That fresh run completed in 1,985,135 ms. Its terminal signed-in regression
completed in 425,312 ms and independently proved eight ordered private sources,
27/27 jobs, a 16-second 3840x2160 private review, all eight source-bound tones,
authenticated playback/download, and persisted acceptance. The preparation
coordinator required three server-owned graph passes: the first two preserved
only exact `failed_retry_available` attempt-one outcomes and replayed completed
siblings; the third completed all 27 jobs. No job exceeded its immutable
two-attempt allowance, no user-review failure was bypassed, and final export
and final QA remained dependency-locked until all required work completed.

The aggregate boundaries remained explicit: local/private evidence only;
provider activation, live billing or wallet mutation, remote Supabase, public
delivery, deployment, external beta, and paid production all remained false.

Mutation coverage rejects wrong workload profiles, wrong CPU envelopes,
commercial fields, cross-profile attempt replay, incompatible chunk metadata,
wrong final artifact class/runner/tool tuples, missing dependency-stream
evidence, and missing or inconsistent terminal-review cost evidence.

## Honest Readiness Boundary

V3 does not prove or activate:

- a rendered 3,840-frame maximum, 30-minute output, hours of raw footage, or
  multi-camera synchronization;
- representative camera codecs, long-GOP/VFR/timecode, multichannel audio,
  damaged media, HDR/wide gamut, or a visually lossless professional
  mezzanine corpus;
- slice-aware voice cleanup, denoise, loudness, music, SFX, ducking, or
  professional color processing;
- distributed object storage finalization, physical worker-process or cloud
  concurrency, Google Cloud identity, autoscaling, quota admission,
  observability, host-loss recovery, or benchmarked p50/p95 performance;
- provider activation, remote Supabase, live GCS, customer billing/charging,
  wallet mutation, settlement, public delivery, deployment, external beta, or
  production rendering;
- Motion Studio/MS-001; or
- Edit Reference/Edit Preferences work owned by the coordinated task.

The next safe long-form milestone is a new versioned distributed/object-backed
execution profile with representative large-media and cloud evidence. V3's
local 3,840-frame planning ceiling must not be described as professional-scale
or multi-hour readiness.
