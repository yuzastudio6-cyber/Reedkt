# Canonical Professional Long-Form First Object-Chunk Execution — 2026-07-18

Status: `first_real_4k_object_chunk_and_independent_qa_completed_remaining_250_children_blocked`

## Outcome

The specialized 255-job professional long-form queue now completes its first
media pair after the three prerequisite validation children:

1. `long-form-object-chunk-1-render`; and
2. `long-form-object-chunk-1-qa`.

The server, not the caller, selects the first topologically ready chunk. It
reopens the approved snapshot, reservation, exact source authority, Master
Timing, child package, placement, and queue definitions; stages only the
immutable source objects used by that chunk; grants one render lease and one
QA lease; consumes each dispatch once; persists the output and evidence in
private create-only storage; reconciles the downstream dependencies; and
commits exactly two terminal queue completions. Restart returns the exact
stored result without another runner invocation or cost event.

The canonical six-hour/512-range fixture therefore ends with exactly five of
255 jobs completed and 250 jobs still queued and capability-blocked. This is
one representative real 4K object chunk, not a completed six-hour edit.

## Fixed Media Operation

The render operation is intentionally narrow:

- fixed tool: FFmpeg;
- fixed operation:
  `tool.ffmpeg.execute_approved_media_recipe.v1`;
- fixed recipe:
  `approved_4k_object_mezzanine_chunk_stream_copy_v1`;
- fixed output: one video-only H.264 Matroska object mezzanine;
- first chunk only, 30 fps, two through eight MP4 sources, and two through 16
  source slices that each begin at source frame zero;
- exact frame-derived source slices and approved hard-cut boundaries;
- exact approved `3840x2160`, frame rate, BT.709, pixel format, codec, source
  checksum, byte length, object generation, and chunk authority;
- mutually compatible H.264 codec/extradata/time-base inputs, independent first
  frames, and no B-frames;
- fixed MP4 slice extraction and concat into Matroska by H.264 stream copy,
  without decode or re-encode;
- timestamps normalized from zero; and
- program audio intentionally excluded because it is a separate downstream
  continuous-audio job.

Caller-selected chunks, source paths, commands, codecs, recipes, artifacts,
output paths, tool IDs, and operation IDs are rejected. The current runner is
explicitly labeled `private_first_chunk_stream_copy_only`; it does not grant a
generic render class.

The isolated runner smoke uses two checksum-distinct real 4K MP4 sources and
produces one 1,350-frame, 53,708-byte Matroska chunk with SHA-256
`9f7ad74ae05a8c9adab67f4713c518da6dccfd421a038c5ace65667b2078c89e`.
Same-input execution produces byte-identical output twice inside one process,
and two fresh smoke processes produced that same byte length and hash. The
canonical lifecycle uses the server-selected first chunk from the six-hour
fixture and produces a 5,226-frame, 174.2-second, 220,341-byte Matroska object
from exactly five approved slices across five of that fixture's eight
checksum-distinct approved 4K source objects.

Both fixtures are synthetic. The isolated inputs are constant-color 4K files;
the canonical fixture's eight objects are metadata-distinct MP4 remuxes of one
synthetic constant-color 4K master, and the first chunk stages only the source
subset named by its approved slices. They prove real media-container execution,
immutable object identity, multi-object staging, frame conservation, and
lifecycle authority. They do not prove different camera angles, visually
diverse raw footage, representative source byte volume, editorial judgment, or
production throughput.

## Private Artifact And Lineage

The output is stored as a create-only private media object with:

- `assetRole = processed`;
- `objectVersion = 1`;
- no signed URL as canonical truth;
- no final-output placeholder permission;
- exact approved snapshot, work item, chunk, attempt, operation, and object
  authority identity;
- source-slice, source-checksum, timing, frame, renderer-layer, and QA lineage;
  and
- independently reopened byte length and SHA-256 verification.

The persisted object is not a public deliverable and is not final export
authority.

## Independent QA

The paired QA job has its own queue authorization, lease, one-use dispatch,
attempt identity, private artifact, cost record, reconciliation, and terminal
completion. It invokes FFprobe separately against the persisted Matroska bytes
and verifies:

- exactly one H.264 video stream and zero audio streams;
- exact `3840x2160` dimensions;
- exact rational frame rate and frame count;
- duration and zero-based start timestamps;
- `yuv420p` and BT.709 color space, transfer, and primaries; and
- exact render-object checksum and byte length.

QA failure or evidence mismatch blocks reconciliation. The render completion
does not self-authorize its QA dependent, and QA completion does not authorize
finalization.

## Attempt Cost Boundary

The render and QA attempts each record versioned, create-only, provisional
local internal production-cost evidence:

- FFmpeg profile:
  `ffmpeg_4k_object_mezzanine_chunk_cpu_2vcpu_4gib_v1`;
- FFprobe profile:
  `ffprobe_4k_object_mezzanine_chunk_qa_cpu_2vcpu_4gib_v1`;
- fixed 2-vCPU, 4-GiB, CPU-only resource envelopes; and
- actual measured attempt wall time, billable time, output bytes, and integer
  micro-dollar cost under the versioned rate card.

These records are internal production cost only. They contain no customer
price, customer credits, ReEditPro service fee, wallet mutation, billing
authority, or settlement instruction. The operation reuses the original
approved 4K estimate and reservation; it creates no second export estimate or
charge.

## Adversarial Evidence

Focused coverage proves:

- caller-selected execution material fails schema validation;
- an exact queue definition and completed prerequisites are required;
- only the server-selected first ready render and paired QA can run;
- immutable source checksums, sizes, object generations, ordering, slices, and
  timing must match;
- only one lease, attempt, and dispatch is consumed per job;
- output persistence is create-only and checksum-bound;
- render and QA attempt costs remain distinct and noncommercial;
- byte tampering fails closed after process-state reset;
- exact restored bytes replay without redispatch or duplicate cost; and
- provider activation, billing, wallet mutation, remote Supabase, live Google
  Cloud, public delivery, product readiness, and production readiness remain
  false.

## Verification

The exact working tree passes:

- `npm run typecheck:server`;
- `npm run smoke:private-internal-attempt-cost-evidence` — including separate
  FFmpeg-render and FFprobe-QA profiles;
- `npm run smoke:professional-long-form-object-plan` — 27 checks;
- `npm run smoke:offline-media-binary-execution`;
- `npm run smoke:offline-media-binary-object-chunk` — real 4K, 1,350 frames,
  same-input/fresh-process byte determinism, and separate FFprobe QA; and
- `npm run smoke:canonical-professional-long-form-post-approval` — 88 checks.

The pinned image rebuild and confined runtime smoke passed as
`reeditpro/ffmpeg-lgpl-internal:8.1.2-object-chunk-v3-local`, image ID
`sha256:262a1f6de8ae1c50f2acfe88917cc57befffabd36e7d92eaa64587894083f7e0`.

The final exact-code `npm run qa:internal-pipeline` v23 aggregate passed all
`38/38` stages with exit code `0`. It started at
`2026-07-18T15:34:20.145Z`, finished at `2026-07-18T16:14:33.676Z`, and
completed in `2,413,531 ms`. The isolated deterministic object-chunk stage
passed in `21,735 ms`, and the 88-check canonical long-form stage passed in
`85,596 ms`. The final canonical attempt recorded `16,192` internal
micro-dollars for the render and `3,696` for QA; these are measured internal
attempt costs, not customer price or credits. The aggregate also reverified
exactly 50 canonical E2E tool identities, 50 job adapters, all 11 named-edit
browser tests, and the accepted signed-in maximum-eight-source private review.
Every provider, remote Supabase, live cloud, billing, public-delivery,
external-beta, and production boundary remained false.

## Readiness Truth

Verified local/private for this bounded pair:

- approved-snapshot, reservation, source, timing, package, placement, and queue
  authority;
- exact first-chunk server selection and immutable source staging;
- one-use FFmpeg execution and create-only private persistence;
- separate FFprobe QA execution;
- attempt-level internal cost for both operations;
- reconciliation, terminal queue completion, byte-tamper refusal, and exact
  restart replay; and
- five completed canonical jobs with 250 still blocked.

Still false:

- arbitrary professional source formats and camera originals, including
  ProRes/HEVC/HDR, variable-frame-rate media, B-frame inputs, mismatched codec
  parameters, and approved slices that begin after source frame zero;
- execution of the other 123 chunk renders and 123 paired QA jobs;
- continuous program-audio execution and sync validation;
- cross-chunk color-continuity QA;
- private finalization, full-program final QA, and authenticated final review;
- representative many-angle 30-minute corpus execution and quality judgment;
- active lease heartbeat/renewal for a slow render or QA attempt;
- first-object failed-attempt terminalization/retry and post-run or post-cost
  pre-queue-commit orphan reconciliation;
- distributed database transaction authority and durable multi-host recovery;
- live Google Cloud dispatch, workers, object storage, observability, p50/p95,
  cancellation, and orphan cleanup;
- provider activation, customer billing, wallet mutation, or public delivery;
- external-beta readiness; and
- production readiness.

## Next Evidence Gate

The next dependency-safe slice must not simply duplicate this first chunk. It
should either prove the separate continuous program-audio lifecycle or execute
a bounded multi-chunk set that can establish cross-chunk video continuity. It
must preserve the approved snapshot and reservation, exact object/source/timing
lineage, independent QA, attempt-level internal cost, one-use dispatch,
private create-only persistence, reconciliation, and fail-closed replay rules.
Finalization remains blocked until every required chunk, QA, audio, and color
dependency passes.
