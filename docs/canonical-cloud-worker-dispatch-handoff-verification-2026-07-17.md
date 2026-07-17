# Canonical Cloud Worker Dispatch Handoff Verification — 2026-07-17

Status: `verified_contract_live_cloud_blocked`

## Outcome

ReEditPro now has one deterministic, fail-closed contract between the durable
approved-package queue and future regional Google Cloud execution. It binds all
50 proven tool identities to exact CPU-analysis, GPU, or render Cloud Run Job
targets and defines the control-plane handoff for tool-free API, QA, and tool
readiness jobs.

This milestone does not create or call Cloud Tasks, Cloud Run, IAM, GCS,
Secret Manager, Supabase, a provider, billing, rendering, or deployment. It is
the server-owned authority needed before those live systems can be connected.

## Exact Handoff

```text
immutable approved execution package
  -> durable package queue entry and approved attempt
  -> region authority derived by the server
  -> regional Cloud Tasks queue
  -> short private dispatch controller
  -> OAuth Cloud Run Jobs run request
  -> one exact worker job
```

The two queues are regional and purpose-specific:

- `reeditpro-worker-dispatch` for CPU, GPU, QA, and tool-readiness handoffs;
- `reeditpro-render-dispatch` for render handoffs.

The API-service control entry stays in the backend control plane and does not
create a Cloud Task or Cloud Run Job request.

## Frozen Tool Targets

The catalog derives from the previously proven placement authority and covers:

- 28 CPU-analysis tools;
- 3 GPU tools;
- 19 render tools; and
- 50 unique canonical tool identities in total.

Each entry freezes canonical tool ID, runner family, worker type, resource
class, accelerator, target name, target service account, timeout, task count,
parallelism, and internal retry count. Target existence and IAM verification
are explicitly false until live evidence exists.

## Opaque Task And Attempt Safety

The Cloud Tasks body is capped by ReEditPro at 8 KiB, below the platform's 1
MiB task ceiling. The six-job smoke produces a 688-byte body containing only:

- schema/purpose;
- opaque dispatch-intent ID;
- package job ID and delivery attempt; and
- manifest, entry, queue, region, and dispatch-binding hashes.

It contains no media, prompt, path, signed URL, secret, credential, or worker
command. Task names are content-derived and deterministic for the exact
approved attempt. Redelivery of that same task is not permission for another
execution attempt.

The private controller request is capped at 60 seconds and exists only to
revalidate authority and call the Cloud Run Jobs `run` API. The media workload
runs in the job. Job overrides keep `taskCount=1`, `parallelism=1`, and
`taskMaxRetries=0`; the package queue remains the only approved retry owner.

## Region And Duration Safety

The runtime region is server-selected and must agree with every required
source-object region before a region-bound claim can pass. Browser-selected
regions, mixed-region source claims, queue tampering, target tampering, and
attempt overflow fail closed.

The contract caps GPU attempts at 3,600 seconds and CPU attempts at 604,800
seconds. A workload that cannot fit must be split into approved,
content-addressed, independently recoverable jobs. This is especially
important for multi-hour, multicamera, high-resolution footage: completed
analysis/render shards must survive retries rather than restarting the whole
edit.

## Verified Evidence

The following passed on the exact implementation:

- `npm run typecheck:server`
- `npm run smoke:canonical-cloud-dispatch-handoff`
- `npm run smoke:gcp-foundation`
- `npm run smoke:canonical-private-package-work-queue`
- `npm run qa:canonical-private-pipeline`
- `npm run smoke:offline-media-binary-execution`
- `npm run smoke:editor-full-stack-private-review`
- `npm run qa:internal-pipeline`

The focused handoff smoke verifies:

- all 50 exact target mappings and the 28/3/19 distribution;
- deterministic US and Europe regional manifests;
- worker-versus-render queue routing;
- a 688-byte allowlisted task body;
- a one-task, one-parallelism, zero-hidden-retry Cloud Run request;
- deterministic replay and distinct bounded-attempt identities;
- GPU timeout enforcement; and
- region, queue, target, and attempt tamper rejection.

`cloudtasks.googleapis.com` and `iamcredentials.googleapis.com` are now listed
in the gated configuration/templates. No script was executed. Every Cloud Run
Job deploy template sets `--max-retries=0`.

The older foundation templates still have a `us-central1` default and coarse
worker identities, while the canonical regional resource map uses `us-east1`
and `europe-west1` plus a more detailed identity catalog. The contract does
not pretend those are deployed or reconciled: region/resource/service-identity
reconciliation is an explicit blocker before any human may run the templates.

The exact canonical pipeline passed all 23 of 23 stages with exit code 0 from
`2026-07-17T01:57:51.390Z` through `2026-07-17T02:21:26.822Z` in
`1,415,432 ms`. The new cloud handoff stage passed in `468 ms` inside the same
run as immutable approval/package authority, real three-source composition,
private streaming media/audio, professional color, UHD Remotion, the browser
journey, and proven-tool identity evidence. The three-source proof took
`568,576 ms`, professional color took `691,826 ms`, UHD Remotion took
`114,108 ms`, and the browser journey passed 11 of 11 tests in its `19,028 ms`
stage. All live-cloud and product-release boundaries remained false.

The first post-integration full internal run then failed safely at the
three-source stage because the older structured Python Docker runner exceeded
its fixed 30-second local command ceiling under back-to-back regression load.
No result committed, and the approved package retained one bounded retry. The
runner ceiling was aligned to the 120-second bound already used by newer
confined runtime families; this remains a fixed fail-closed local test bound,
not a cloud timeout or an authorization for unbounded work.

The next 29-stage run passed stages 1 through 28 and then failed closed in the
signed-in maximum-eight-source regression after 16 of 27 jobs. Durable evidence
showed two FFmpeg jobs exhausted their approved two attempts with
`runtime_unavailable`; two other FFmpeg jobs failed once and recovered. The
same final regression passed unchanged in isolation, proving that its media,
snapshot, dependency, QA, and review logic was valid and that the failure was
load-sensitive. The older media-binary runtime still used a 30-second Docker
control baseline while running concurrent FFmpeg jobs after the multi-source,
professional-color, and UHD Remotion stages. That control baseline was raised
to the same fixed 120-second local bound. Network-none, read-only, non-root,
CPU, memory, PID, output-size, streaming, cleanup, approved-attempt, and
10-minute maximum media-execution bounds were not relaxed.

The final exact-code full internal regression passed all 29 of 29 stages with
exit code 0 from `2026-07-17T03:51:31.349Z` through
`2026-07-17T04:34:42.335Z` in `2,590,986 ms`. The cloud handoff stage passed in
`817 ms`; three-source execution passed in `1,040,427 ms`; professional color
passed in `848,428 ms`; UHD Remotion passed in `116,791 ms`; and the named-edit
browser journey passed 11 of 11 tests in `19,071 ms`. The loaded final
maximum-eight-source regression passed in `529,043 ms`, completed all 27
server-derived jobs, and accepted a 1,086,192-byte, 3840x2160, 16-second private
review with all eight source-bound audio identities preserved in approved
order. Provider activation, billing/wallet mutation, remote Supabase, public
delivery, deployment, external-beta readiness, and paid-production readiness
remained false throughout.

## Performance Meaning

This contract enables later parallel execution; it does not prove speed. A
straightforward 30-minute source workload may use 10–20 minutes as a target on
warm, adequately provisioned cloud capacity. It is not a required minimum and
not yet an SLA. A light edit can be faster. Multicam, hours of 4K footage,
heavy denoise/stabilization, semantic analysis, generated assets, complex
composition, multiple variants, or strict QA can take substantially longer.

A reliable ETA requires deployed representative benchmarks and critical-path
telemetry. At minimum, the release gate must measure queue delay, cold starts,
per-stage throughput, source-minutes per worker-minute, GPU utilization,
render real-time factor, QA time, recovery time, and capacity saturation across
30-minute, multi-hour, multicam, and 4K/2K/1080p workload classes.

## Honest Remaining Gates

These remain false:

- distributed package-queue/outbox transaction;
- live Cloud Tasks queue and OIDC token configuration;
- controller Invoker and Jobs Developer IAM;
- deployed regional controller and Cloud Run Jobs;
- reconciliation of the legacy foundation defaults with the canonical
  regional resource and service-identity map;
- user-managed service identities and private GCS object permissions;
- worker-side authority reload and completion reconciliation;
- dead-letter/recovery operations and production observability;
- deployed concurrency, quota, autoscaling, and kill-switch evidence;
- representative latency/cost benchmarks and calibrated ETA model;
- provider activation, customer billing/wallet mutation, public delivery,
  external beta, and paid production.

The bounded private outbox plus controller/worker receiver contract is now
implemented and verified by
`docs/canonical-cloud-dispatch-outbox-receiver-verification-2026-07-17.md`.
It proves checksum-protected single-host durability, restart recovery,
idempotent redelivery, and exact identity/attempt contracts without live Google
verification or cloud calls. The queue claim and outbox insert now additionally
share one package-scoped cross-process write-ahead commit with real
process-exit recovery; see
`docs/canonical-private-package-state-transaction-verification-2026-07-17.md`.
A follow-up cryptographic verifier proves
RS256, bounded JWKS, issuer, audience, principal, timing, and process-only trust
handoff with a local signed fixture; see
`docs/canonical-service-identity-verifier-verification-2026-07-17.md`. The
remaining gate is the actual distributed package-queue/outbox transaction plus
the live Google auth-library/key-rotation adapter, followed only with explicit
authorization by staging deployment and the representative benchmark program.
