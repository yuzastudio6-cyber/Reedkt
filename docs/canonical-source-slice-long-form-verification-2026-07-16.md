# Canonical Source-Slice Long-Form Verification — 2026-07-16

Status: `verified_local_private_bounded_source_slice_v2`

## Outcome

ReEditPro now has a second, additive private long-form capacity profile for one
approved source range that is too long for the existing direct 240-frame
composition. The profile is:

`canonical_private_4k_source_slice_chunk_merge_3840_frames_v2`

It does not replace or weaken the existing source-boundary v1 profile. The v1
path still accepts 481–1,920 frames across two through eight distinct approved
sources and creates chunks only at approved source boundaries.

The exact v2 planning limits are:

- exactly one immutable approved source and one approved cleanup range;
- 241 through 3,840 approved frames in the complete timeline;
- two through sixteen balanced technical render chunks;
- 24 through 240 frames in every chunk;
- exact, gap-free, overlap-free source-frame and global-frame conservation;
- source-slice identities ordered as `source-slice-N-of-M`; and
- continuous source boundaries only, with no invented cuts or transitions.

At 30 fps, the maximum planning ceiling is 128 seconds. This is an evidence
ceiling, not a product duration limit and not proof of a 30-minute or multi-hour
professional workload.

## Authority Flow

The v2 path preserves the existing canonical lifecycle:

1. authenticated private upload and backend probe;
2. exact current-edit preference and frame evidence already required by the
   canonical planning handoff;
3. server-owned canonical publication with one universal 4K estimate;
4. exact plan/estimate approval and the existing private-test reservation;
5. immutable approved snapshot and execution package;
6. server-derived resource-aware work graph;
7. one signed chunk work item for each exact source range;
8. lease, one-use dispatch, private source/dependency reads, confined Remotion
   execution, create-only private persistence, independent FFprobe QA,
   reconciliation, and content-stable replay per chunk;
9. final merge reading only the lease-selected, QA-passed chunk streams;
10. final 4K persistence, independent QA, reconciliation, replay, and
    authenticated private download.

Every v2 chunk carries the same exact lineage through planning, chunk
authority, dispatch validation, execution, merge planning, container
validation, and persisted response evidence:

- capacity profile;
- chunk index/count and output key;
- global start/end/duration frames;
- source-slice key; and
- source start/end frames.

The final merge also carries one continuity record per technical boundary. It
binds the source and cleanup identities, global boundary frame, previous source
end, next source start, and the ordered from/to slice keys. Validators reject
missing or extra records, gaps, overlaps, reordered identities, substituted
source or cleanup authority, invented hard cuts, and duration drift.

## Audio And Color Boundary

This first source-slice execution profile preserves the approved source audio
and source color as-is. If the approved plan contains source-bound voice
replacement or professional-color preprocessing, publication fails closed.
Applying those operations independently to short slices could create loudness,
phase, denoise, grade, or reference-match seams; they need their own
cross-slice processing and continuity evidence before activation.

This is deliberate capability truth, not silent simplification. Existing
direct and source-boundary profiles retain their previously proven voice and
color behavior.

## Fresh Actual Evidence

The following command passed with exit code 0:

```text
REEDITPRO_SOURCE_SLICE_LONG_FORM_PROOF=1 \
  ./node_modules/.bin/tsx \
  server/smoke/canonical-private-long-form-execution-smoke.ts
```

The signed-in local/private run proved:

- one finalized 22-second, audio-bearing private MP4 source;
- 660 approved frames at 30 fps, above the prior 240-frame single-source
  execution ceiling;
- exact chunk ranges `0–220`, `220–440`, and `440–660` in both source and
  global timing authority;
- one immutable approved 4K estimate, reservation, snapshot, and package;
- eight approved work items and eight completed canonical jobs;
- three private 3840x2160 chunks, each independently persisted, probed,
  QA-passed, reconciled, and replayable;
- a retryable local runtime failure isolated to one chunk, followed by a new
  graph pass that reused the five completed jobs and executed only unresolved
  work inside the same operation's approved attempt ceiling;
- a final 32,450,267-byte master with SHA-256
  `3e36fb74df4fabb61690c88b45beb42ccbb2021019c5cf8e46890fd0e1238927`;
- 3840x2160 H.264, `yuv420p`, BT.709, 30 fps, and exactly 660 video frames;
- 48 kHz stereo AAC audio;
- authenticated private-download bytes matching the recorded hash and final
  FFprobe authority; and
- provider, customer-credit mutation, billing, wallet, settlement, public
  delivery, deployment, external-beta, and production authority all remained
  false.

The final decoded PCM contained 1,058,816 samples. At the two technical source
boundaries:

| Boundary | Sample | Adjacent delta | RMS before | RMS after |
| ---: | ---: | ---: | ---: | ---: |
| frame 220 | 352,000 | 0.005438 | 0.088282 | 0.067357 |
| frame 440 | 704,000 | 0.006515 | 0.088352 | 0.066138 |

Both boundaries stayed below the bounded 0.02 adjacent-sample discontinuity
threshold and above the 0.03 before/after RMS floor. This proves that the
exercised continuous tone did not acquire a click-sized jump or silent gap at
either technical chunk boundary. It is not a broad music, dialogue, surround,
timecode, or drift corpus.

## Performance Evidence

The resource-aware graph took 1,188,692 ms, or 19.81 minutes, on the local
single-host Docker proof environment. It included isolated container startup,
one bounded chunk recovery pass, three high-quality 4K chunk renders, a full
660-frame 4K merge render/encode, independent probes, persistence, QA,
reconciliation, replay, and private download.

This is correctness and recovery evidence, not a benchmark-qualified result,
cloud throughput result, ETA model, or customer SLA. The current final merge
serially renders and encodes the full program after its chunks are already
encoded. Production-scale performance requires a distributed, data-local
mezzanine/concat or equivalent finalization strategy and representative warm
and cold cloud benchmarks.

## Focused Validation

The following checks passed with exit code 0:

- `npm run typecheck:server`;
- `node --check docker/prod/offline-remotion-render-execution/runner.mjs`;
- `./node_modules/.bin/tsx server/smoke/canonical-private-source-slice-chunk-plan-smoke.ts`;
- `./node_modules/.bin/tsx server/smoke/canonical-private-source-slice-compilation-smoke.ts`;
- `./node_modules/.bin/tsx server/smoke/canonical-private-long-form-chunk-merge-smoke.ts`; and
- the signed-in actual command above.

The focused planners additionally prove the exact 241-frame minimum, an
uneven 541-frame split, and the 3,840-frame/16-chunk planning maximum. Mutation
checks reject under/over-capacity ranges, multiple sources, incomplete timeline
coverage, source-frame gaps, incorrect slice identity, invented hard cuts, and
continuity-record substitution. The unchanged v1 source-boundary regression
continues to pass.

The broader `npm run qa:internal-pipeline` regression also passed all 27 of 27
stages with exit code 0 in 1,720,287 ms (28 minutes 40.287 seconds). That run
revalidated the signed-in maximum-eight-source private-review journey, the
27-item canonical work graph, 4K estimate/approval authority, authenticated
private playback and download, large streamed media/audio artifacts,
professional color execution, Remotion output streaming, named-edit journey
states, proven tool identities, and the fail-closed security boundaries. This
is regression evidence for the surrounding canonical pipeline; it does not
raise the source-slice v2 duration or workload claims above the fresh actual
22-second proof documented here.

## Honest Readiness Boundary

This slice does not prove or activate:

- an actual 3,840-frame render, a 30-minute output, or multi-hour raw footage;
- more than one source in v2 or more than eight sources in v1;
- slice-aware voice cleanup, denoise, loudness, music, SFX, ducking, or
  professional color processing;
- a visually lossless intermediate, generation-loss threshold, HDR/wide-gamut
  path, timecode, VFR, long-GOP, multichannel, or damaged-media corpus;
- distributed object/mezzanine merge, physical worker-process concurrency,
  Cloud Run/GPU workers, autoscaling, service identity, host-loss recovery,
  observability, or p50/p95 benchmarks;
- provider execution, live Supabase, live GCS, live billing, customer charging,
  wallet mutation, settlement, public delivery, deployment, external beta, or
  production rendering;
- Motion Studio/MS-001; or
- Edit Reference/Edit Preferences implementation owned by the coordinated
  task.

The next dependency-safe long-form milestone should add a versioned
distributed mezzanine/object finalization profile, then separately prove
cross-slice professional audio/color processing and representative large-media
cloud benchmarks. Limits must not be raised silently from this local proof.
