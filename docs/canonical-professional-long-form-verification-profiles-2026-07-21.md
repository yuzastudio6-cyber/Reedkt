# Canonical Professional Long-Form Verification Profiles — 2026-07-21

Status: `two_hour_representative_and_full_graph_verified_six_hour_release_stress_retained`

## Decision

The routine professional long-form break/fix verification now uses a real
two-hour, 200-range, 4K authority fixture. The six-hour fixture remains an
explicit release-grade stress profile.

This changes test cadence, not product capability. ReEditPro still admits the
reviewed six-hour professional long-form ceiling, 4K output frame, 512 source
ranges, source-led timing, lossless continuous program audio, per-chunk render
and independent QA, cross-chunk color continuity, private finalization, and
attempt-level internal production-cost evidence.

## Exact Profiles

| Profile | Command | Duration | Source ranges | Object chunks | Child jobs | Completed proof | Remaining |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Routine representative | `npm run smoke:canonical-professional-long-form-post-approval` | 7,200 s | 200 | 60 | 127 | 8 | 119 |
| Full destructive two-hour | `npm run smoke:canonical-professional-long-form-post-approval:full-two-hour` | 7,200 s | 200 | 60 | 127 | 127 | 0 |
| Release stress | `npm run smoke:canonical-professional-long-form-post-approval:release-six-hour` | 21,600 s | 512 | 124 | 255 | 8 | 247 |

The child graph is derived from two jobs per object chunk plus seven global
jobs. The routine graph therefore contains `2 × 60 + 7 = 127` jobs. The
release graph reaches the existing bounded maximum of 255 jobs.

The routine fixture uses at most four approved source ranges per target 120-second
chunk. An initial 512-range/two-hour trial correctly exposed that nine 4K
slice branches could exhaust the current 4 GiB private VP9 worker. The routine
profile therefore exercises 200 substantial range decisions instead of using
an unrealistically dense stress shape. Its range geometry intentionally makes
the second chunk begin at a nonzero source frame, retaining the technical-split
execution proof. The six-hour release fixture continues
to exercise the full 512-range ceiling at its proven bounded density. Dense
short-program range admission remains a separate capacity-policy/runtime
hardening gate; it is not silently labeled ready.

## Routine Representative Result

The exact routine representative command passes 112/112 checks with:

- profile `routine_two_hour`;
- 7,200 seconds and 216,000 frames at 30 fps;
- 200 source ranges across eight immutable private source assets;
- 60 object chunks and 127 canonical child jobs;
- eight completed jobs and 119 correctly queued jobs;
- two real independently probed 4K VP9 Matroska chunks;
- one 382,958,982-byte, 48 kHz, 24-bit stereo FLAC covering exactly
  345,600,000 samples;
- one failed attempt-1 timeout with retained internal cost;
- one approved attempt-2 completion proposal reconciled after simulated worker
  exit without rerender, retry, or second cost; and
- a nonzero source-frame technical split on the second representative chunk.

The run also found and corrected a maximum-capacity assumption in the first
object-chunk service: remaining-graph validation now derives the exact job
count from the approved package, placement, manifest, queue definition, and
queue entries. It accepts the 127-job routine graph and still requires exact
255-job agreement for the release profile.

Both profiles prove the same eight representative completions:

1. approved-snapshot root validation;
2. exact source authority;
3. Master Timing validation;
4. first 4K object-chunk render;
5. first independent chunk QA;
6. continuous lossless program audio;
7. later 4K object-chunk render after timeout/retry and success-crash recovery;
8. later independent chunk QA.

The routine profile proves two of 60 chunk pairs and leaves 58 honestly
unexecuted. The release profile proves two of 124 and leaves 122 honestly
unexecuted. Neither result implies full media execution, Google Cloud worker
completion, customer delivery, external-beta readiness, or production
readiness.

## Full Two-Hour Destructive Result

The explicit full command passes 120/120 checks and executes the complete
two-hour graph rather than sampling it:

- all 127 canonical child jobs complete and zero remain queued or leased;
- 128 delivery attempts are retained: 127 successful attempts plus the one
  intentional expired-attempt failure and its internal cost;
- all 60 private 4K VP9 object chunks and all 60 independent chunk-QA jobs
  complete in canonical order;
- all 59 adjacent color boundaries pass before finalization;
- one 393,016,049-byte private master is assembled with SHA-256
  `29307761055ab1270705208a3f34da861a3649314904f0d1ebf2c2a5994dedc8`;
- independent private-master QA emits digest
  `9b0b802f93a5d08fc5f52fa10eecf7f192e3ca50248939376c325b0333b0b75a`;
- an isolated copied-state fork proves that middle-chunk byte tampering fails
  closed, is classified as a non-retryable validation failure, and requires
  user review without contaminating the genuine graph; and
- restart replay after 127/127 completion creates no additional job, lease,
  artifact, attempt, or internal cost.

The run exposed and corrected two real orchestration defects. First, an
approved execution reservation inherited the preapproval estimate's one-hour
quote-validity timestamp and expired during valid long-running work. Approval
now creates a separate bounded 24-hour internal-test execution hold; live
credit-ledger renewal remains a closed production policy. Second, the initial
tamper test tried to retry checksum-corrupted media under the same approved
authority. The corrected proof uses an isolated state fork and verifies the
existing policy: media-integrity failure is non-retryable and requires review
or a new approval.

## Why This Is Faster Without Lowering Quality

Representative execution writes and independently decodes two hours of 48 kHz,
24-bit, stereo FLAC instead of six hours and materializes a 127-job queue
instead of a 255-job queue. That reduces local CPU time, disk I/O, temporary
storage, hashing, and reconciliation work while preserving every authority,
quality, security, idempotency, recovery, cost-separation, and 4K check.

The full two-hour command intentionally pays the larger local engineering cost
when destructive acceptance is needed. It remains materially cheaper and
faster than executing the six-hour/255-job ceiling on every iteration.

“Six-hour cost” here means engineering test cost on the development machine:
elapsed time, CPU, memory, storage, and developer feedback latency. It does not
mean a customer charge, credit debit, provider bill, wallet mutation, or
ReEditPro service fee. Those commercial authorities remain separate and
closed.

## Release Evidence

Commit `170ee673a75e7ac375013f6d55ff588bf19b258c` retains the prior successful
111/111 six-hour execution proof, including the real 1,144,083,803-byte FLAC,
the 124-chunk/255-job graph, attempt-2 4K render completion proposal, restart
reconciliation, and no rerender or second cost. The release command keeps this
proof reproducible without forcing it into every routine iteration.

## Smoke Teardown

The cross-chunk/private-master smoke had one success-only Node 26/tsx teardown
hang after its HTTP server was closed, its private fixture directory was
deleted, and no FFmpeg/FFprobe or network child remained. It now exits
explicitly only after the successful `try/finally` cleanup completes. A thrown
assertion or cleanup error skips that success exit, so failures cannot be
masked.

The full regression was then rerun without interruption. It completed with
exit code 0, removed both delivery-render and decoded-QA containers, removed
its private fixture directory, and left no npm, tsx, Node, Docker-client,
FFmpeg, FFprobe, or Remotion child process. The retained result proves 11/11
core/private-master jobs and 9/9 customer-delivery jobs, two independently QA'd
H.264 chunks, final private delivery mux, decoded video/audio QA, exact replay,
authenticated range delivery, durable watch evidence, cross-user denial, and
no second estimate or credit prompt. Its objective decoded-media disposition
remains honestly `user_review_required`; a successful systems regression does
not silently convert that content-review gate into acceptance.

## Closed Gates

This profile split authorizes no provider/model call, Secret Manager payload
read, remote Supabase action, Google Cloud mutation, billing, customer credit
settlement, deployment, public delivery, or push. Product maximums and quality
requirements remain unchanged.
