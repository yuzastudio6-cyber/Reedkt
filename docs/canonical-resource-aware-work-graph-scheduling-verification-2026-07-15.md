# Canonical Resource-Aware Work-Graph Scheduling Verification — 2026-07-15/16

Status: `verified_local_private_orchestrator_waves_cloud_and_sla_blocked`

## Outcome

The canonical private work-graph orchestrator no longer advances every job
serially. It now derives an exact resource placement for every packaged job and
executes deterministic dependency-ready waves under fixed server-owned limits.

This is a private single-host orchestration result. It does not activate Google
Cloud, providers, billing, public delivery, production rendering, or a product
performance promise.

## Exact Proven-Tool Placement

The placement authority reconciles the existing versioned 50-tool evidence
catalog against the production registry. The current exact split is:

| Registry worker | Proven tool identities | Resource class | Worker cap |
| --- | ---: | --- | ---: |
| CPU analysis | 28 | `cpu_analysis_standard_v1` | 4 |
| GPU AI | 3 | `gpu_l4_standard_v1` | 1 |
| Render | 19 | `render_cpu_high_memory_v1` | 2 |

The three GPU identities are `rembg`, `kornia`, and `deepfilternet`. They map to
the future NVIDIA L4 class. FFmpeg and Remotion map to high-memory CPU render
workers; FFprobe maps to CPU analysis. Tool-free authority and QA jobs use
their server-owned control-plane or QA policy placement.

Every wave is also constrained by the global four-job cap. The broader fixed
policy retains API 20, QA 4, and readiness 1 limits for graphs that contain
those worker types. A caller cannot supply or override any of these values.

## Authority And Fail-Closed Behavior

Placement is derived only after the orchestrator reloads the authenticated
canonical execution package. The derivation revalidates:

- package, snapshot, work-graph, and tool-manifest lineage;
- exact one-tool/one-operation work-item authority;
- operation-binding hashes;
- registry worker type, GPU requirement, and CPU allowance;
- proven runner class, identity hash, and lifecycle proof hash; and
- the fixed worker and global concurrency policy.

The resulting placement manifest is content-addressed and bound to the exact
execution package. Unknown worker classes, changed tool profiles, mismatched
operation bindings, unproven tools, and provider-backed work fail closed or
remain explicitly blocked. Placement is not yet part of the immutable approved
snapshot, so snapshot-level placement authority remains false.

## Wave Semantics

For each wave, the scheduler:

1. scans jobs in canonical package order;
2. selects only jobs whose exact dependency IDs completed;
3. applies the global and worker-lane caps;
4. starts only private-execution-ready entries;
5. waits for every selected sibling to settle;
6. commits completed or scoped-blocker outcomes in stable wave order;
7. persists one monotonic progress checkpoint; and
8. advances descendants only from completed dependency evidence.

An unexpected error is rethrown only after all already-started siblings settle.
This prevents abandoned background promises and preserves idempotent recovery
for siblings that completed before the failure surfaced.

## Focused Evidence

`server/smoke/canonical-private-resource-wave-scheduler-smoke.ts` passed with
exit code 0 and proved:

- exactly 50 placements: 28 CPU-analysis, 19 render, and three GPU;
- exact L4 placement for the three GPU identities;
- catalog, worker, identity, profile-placement, and hash mutation rejection;
- deterministic synthetic wave widths `1, 4, 2, 1, 1` across repeated runs;
- global observed in-process peak four, CPU peak four, and render peak two; and
- a failing sibling does not return control before an independent sibling has
  settled.

## Signed-In Long-Form Evidence

`server/smoke/canonical-private-long-form-execution-smoke.ts` passed with exit
code 0 through the real authenticated private pipeline:

- eight distinct finalized private sources;
- one immutable approved 4K estimate, reservation, snapshot, and package;
- 29 approved jobs and 29 completed adapter results;
- 15 deterministic resource waves;
- 12 waves with overlapping in-process orchestrator execution tasks;
- maximum wave width three and observed peak three;
- observed CPU-analysis task peak one and render task peak two;
- two independently QA-passed 4K chunks, final merge, final QA,
  reconciliation, replay, and authenticated private download; and
- provider, billing, customer-credit mutation, wallet mutation, settlement,
  public delivery, Cloud dispatch, external beta, and production authority all
  remained false.

The concurrency measurement scope is intentionally
`in_process_orchestrator_execution_tasks`. It includes tasks waiting on inner
single-host locks. It does not claim that two OS processes, containers, GPUs,
or Cloud Run jobs were physically executing at the same instant.

## Full Internal Regression Evidence

The final post-change `npm run qa:internal-pipeline` run passed all 27 of 27
stages with exit code 0. It ran from `2026-07-16T13:13:45.747Z` through
`2026-07-16T13:50:12.138Z` and took `2,186,391 ms` locally.

The same run included:

- the three-source private composition lifecycle in `656,545 ms`;
- the deterministic professional-color lifecycle in `766,735 ms`, including a
  `67,338,001`-byte lossless color artifact and a `19,473,909`-byte final
  composition above the exercised 16 MiB streaming boundary;
- the separate bounded UHD Remotion streaming proof in `116,285 ms`;
- all 50 versioned proven-tool identities;
- the active named-edit browser journey; and
- the standalone authenticated maximum-eight-source journey in `600,447 ms`,
  with all 27 server-derived work items completed and the private 4K review
  accepted.

Two full-regression failures were corrected before this clean pass:

1. The signed-in maximum-source smoke now establishes its own reviewed offline
   media-binary, libass, Docker, and Remotion runtime evidence before starting
   the API server. It no longer succeeds or fails based on a prior smoke's
   process-external runtime side effect.
2. The professional-color source fixture now has a fixed noise seed and an
   eight-second duration. This preserves the existing source ceiling while
   keeping the exercised final artifact safely above the streaming boundary,
   instead of allowing random compressibility to move it below the assertion.

This 36-minute local regression is correctness and recovery evidence. It is
not a 30-minute real-program editing benchmark, cloud throughput result, ETA,
or customer SLA.

## Performance Interpretation

This slice improves the scheduler's critical-path architecture, but it does not
prove the provisional 10-to-20-minute target for an approved deterministic
30-minute edit. The fresh local 720-frame proof remained dominated by isolated
4K H.264 chunk/final rendering. The current bounded path still encodes chunks
and re-renders the final master; it is correctness evidence, not a production
mezzanine or throughput design.

Before ReEditPro can publish an ETA or SLA, representative warm and cold cloud
benchmarks must separately measure ingest/proxy/analysis, planning/review,
approved edit execution, finalization, QA, retries, and queue time. Required
corpora include multi-hour raw footage, multicamera material, 30-minute and
longer outputs, 1080p/2K/4K, long-GOP and professional camera codecs, VFR,
timecode, multichannel audio, HDR/wide gamut, and failure recovery. Both p50
and p95 must be reported.

## Remaining Gates

The following remain required before cloud or professional-scale readiness can
be claimed:

- freeze the approved placement policy or an equivalent immutable execution
  profile into snapshot authority without colliding with the coordinated Edit
  Reference/Edit Preferences work;
- replace process-local waves with a durable distributed queue, service
  identity, leases, heartbeats, cancellation, host-loss recovery, and
  reconciliation;
- prove generation, ETag, checksum, IAM, lifecycle, region, and retry behavior
  on private GCS objects;
- deploy and benchmark separate CPU, GPU, render, QA, and readiness worker
  images with bounded autoscaling and quota admission;
- prove actual physical worker concurrency and data-local transfer behavior;
- adopt a professionally reviewed mezzanine/segment and codec-compatible
  concat/mux or distributed final-encode strategy that avoids unnecessary
  whole-program generation loss and serial re-rendering;
- add work-graph-derived ETA confidence and stage progress;
- preserve attempt-level internal production cost separately from future
  customer price, credits, fee, margin, and settlement; and
- retain all provider, Supabase, billing, public delivery, deployment, Motion
  Studio, and production gates until their independent evidence passes.
