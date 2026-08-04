# Large Media Ingestion And Proxy Readiness — 2026-07-13

Status: `source_hardened_resumable_sized_4k_ingestion_and_canonical_private_execution_verified_live_cloud_long_duration_and_huge_scale_unverified`

This slice makes ReEditPro's upload contract suitable for professional-size
source footage without claiming that a deployed environment has processed a
terabyte file. The immutable original remains the render master. A private
proxy is a working/analysis derivative only.

The 2026-07-15 follow-up additionally executes one real 3840x2160 lossless
source above the resumable threshold through interrupted chunk recovery,
stored-byte verification, generation-bound private finalization, FFprobe,
durable replay, exact-source verification, and checksum-bound proxy creation.
See `docs/large-media-private-4k-pipeline-verification-2026-07-15.md`. This is a
short 27 MB fixture, not a long-duration or maximum-size claim.

A second 2026-07-15 proof connects a valid 18,874,505-byte 3840x2160 MP4
through the same resumable/background-finalization boundary and then through
canonical planning, approval, reservation, source-bound voice and color,
private 4K composition, final QA, replay, and download. See
`docs/canonical-large-source-streaming-verification-2026-07-15.md`. That closes
the former over-16-MiB canonical source-input disconnect for one short MP4; it
does not close the long-duration/output-buffer or live-cloud gates.

## Product limits

| Purpose | Current product ceiling | Evidence level |
| --- | ---: | --- |
| Source video | 1 TiB per object | Browser/backend validation and fake-provider contract |
| Reference video | 250 GiB per object | Browser/backend validation |
| Local Express raw-body compatibility route | 16 MiB | Executable local security smoke |
| Google Cloud Storage provider hard maximum | 5 TiB | Provider documentation; not the product limit |

The 1 TiB source ceiling leaves operating headroom below the storage-provider
maximum. It is not a storage entitlement and does not replace future workspace,
project, concurrency, duration, retention, or cost quotas.
The expanded ceilings and professional acquisition containers are scoped to
source/reference ingestion; generated assets, previews, QA artifacts, and
exports retain their existing narrower type and size boundaries.

The upload validator recognizes MP4, QuickTime/MOV, WebM, M4V, Matroska/MKV,
AVI, MPEG transport streams, and MXF source containers. Container acceptance
does not guarantee codec decode support; FFprobe/FFmpeg readiness and the
isolated media worker must still validate the exact streams after upload.

The 2026-07-20 signed-in staging contract keeps these ceilings fail-closed:
GCS is configured only for bounded source/reference transport and
`REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE=disabled`. A hosted object above
16 MiB is rejected before a storage target or resumable credential is issued.
The additive database-neutral pre-plan ingest contract freezes the future
distributed transaction, lease, checkpoint/resume, cancellation, terminal,
and internal-cost semantics, but has no durable database adapter, cloud
dispatch, or live GCS worker. The resumable behavior below is executable
private/fake-provider architecture, not an active hosted entitlement, until
those distributed runtime gates pass.

## Large upload transport

When a GCS upload is larger than 16 MiB, the backend now creates a create-only
resumable session instead of a one-shot signed PUT. The browser:

1. keeps the session URI in memory only;
2. uploads 32 MiB chunks aligned to GCS's 256 KiB requirement;
3. sends an exact `Content-Range` for every chunk;
4. reads the provider's committed `Range` response;
5. queries the persisted offset after a network or retryable server failure;
6. resumes from the provider-confirmed next byte; and
7. never forwards the ReEditPro bearer token to the object-storage origin.

Source and reference upload intents require the file's exact positive byte
size before a target is issued. Finalization requires the stored object to
match that declared size; the browser cannot silently omit the ceiling check.
The committed-offset query has its own bounded retry loop so an interruption
while recovering does not force a huge upload to restart from byte zero.

The source browser path no longer calls `file.arrayBuffer()` merely to compute
an optional SHA-256 before upload. Final authority still comes from the
backend's server-computed hash of the actual stored generation. Temporary
session URIs remain credentials and are never canonical storage truth.

## Restart-safe finalization authority

Large resumable objects no longer enter the ordinary synchronous browser
finalization path. That route fails closed before it reads provider metadata or
bytes. The browser instead:

1. creates a checksum-protected private finalization job with a stable
   idempotency key;
2. receives only a safe job id/status view;
3. polls the authenticated workspace-scoped status route;
4. never receives or calls the internal worker-run route; and
5. after completion, reads the already-committed canonical upload result
   through the idempotent finalization route.

The current private/internal authority persists under the backend storage root
with create-only scope identity, atomic `0600` records, `0700` directories, a
record checksum, hashed idempotency keys, and no session URI, local path, object
path, or lease credential in the public view. One worker owns an opaque hashed
lease at a time. Heartbeats, bounded attempt deadlines, three-attempt retry
authority, expired-lease reclamation, terminal failure, and completed-result
replay survive fresh service instances.

The focused background-finalization smoke proves the control plane with
synthetic completion evidence. The separate 27 MB ingestion/proxy and 18.9 MB
canonical executions traverse real local-backed stored bytes. All remain a
single-process/single-host private testing boundary, not a deployed queue. The
current worker implementation still performs full stored-byte hashing and then
privately stages the exact generation for FFprobe; an interrupted attempt
restarts that bounded traversal. A distributed dispatcher, representative
huge-object runs, single-pass/range-aware optimization, durable byte-level
progress, and deployed worker capacity remain required.

Before a queued or retryable job claims a lease, the worker now inspects the
filesystem that owns the private staging root. The current
`large_media_worker_capacity_v1` policy requires one complete source-sized
staging copy plus the larger of 8 GiB or 10% source-size safety headroom. An
unavailable or insufficient capacity reading leaves the job queued, reads zero
object bytes, and consumes zero attempts. This prevents a 100 GiB, 1 TiB, or
other huge source from entering the current full-stage implementation on an
undersized worker. A process-local reservation also prevents concurrent jobs on
that worker from each spending the same observed free bytes; it is released
after the leased attempt ends. The fixed 8 GiB minimum is one shared filesystem
safety floor, not a separate 8 GiB allocation per attempt: concurrent attempts
accumulate their exact staging-copy bytes, and every new admission still must
leave its own full source copy plus the shared floor after existing staging
reservations. This is admission safety, not proof that a distributed deployment
has shared capacity reservations, the advertised disk, I/O throughput, quota,
or lifecycle behavior.

Cloud Storage documents that resumable chunks must be multiples of 256 KiB,
recommends at least 8 MiB, returns `308 Resume Incomplete` with a committed
range, and limits a resumable session to seven days:

- <https://cloud.google.com/storage/docs/performing-resumable-uploads>
- <https://cloud.google.com/storage/docs/resumable-uploads>
- <https://cloud.google.com/storage/quotas#objects>

## Quality-preserving proxy policy

`professional_1080p_analysis_proxy_v2` creates a private browser-compatible
working proxy with:

- a 1920x1080 bounding box with no upscaling;
- H.264 High Profile, CRF 18, `fast` preset, `yuv420p`, and bounded 20 Mbit/s
  maximum rate with a 40 Mbit buffer;
- AAC 48 kHz at 192 kbit/s when audio exists;
- variable-frame-rate timestamps passed through instead of forcing a new FPS;
- source aspect ratio preserved and dimensions kept even;
- source metadata, chapters, subtitle streams, and data streams omitted from
  the proxy to reduce private-metadata leakage; and
- explicit Rec.709 primaries, transfer, matrix, and limited-range output tags;
  and
- fast-start MP4 layout.

The original object is immutable and remains the intended final-render source.
Proxy creation never authorizes source deletion or replacement. FFprobe source
metadata now preserves pixel format, matrix, transfer, primaries, range, and
bit depth into private source authority and analysis reports. PQ/HLG HDR,
BT.2020, and Display-P3/DCI-P3 declarations cannot silently enter the ordinary
Rec.709 SDR proxy path: that path returns an explicit color-managed tone-map or
wide-gamut-transform requirement while retaining the original. Untagged SDR
may use a visible/reviewable Rec.709 working assumption; it is not rewritten as
source color truth.

Media command safety budgets now scale from source size and probed duration.
Probe, proxy, audio, and frame extraction no longer inherit one fixed 30-second
default. Long FFmpeg jobs suppress periodic console statistics and emit errors
only so multi-hour progress output cannot exhaust Node's bounded command
buffer. The derived timeout remains a command ceiling; it does not replace a
worker lease, heartbeat, progress checkpoint, cancellation, or retry policy.

## Verification

Run:

```sh
npm run smoke:large-media-ingest-readiness
npm run smoke:large-media-background-finalization
npm run smoke:canonical-distributed-media-ingest-state-port
npm run smoke:large-media-private-4k-pipeline
npm run smoke:canonical-private-color-execution
npm run smoke:source-upload-planning-backend
npm run smoke:upload
npm run smoke:upload-boundary-security
npm run smoke:gcs-upload-integrity-security
npm run smoke:prod-media-foundation
```

The focused large-media smoke proves high-ceiling validation, create-only
resumable-session options, exact offset recovery after a simulated lost
response, recovery when the offset query is itself interrupted, no
cross-origin auth leakage, no browser whole-file hash, v2 proxy settings,
explicit HDR/wide-gamut refusal from the SDR path, full-stage-plus-headroom
capacity math, adaptive task budgets, and the unchanged 16 MiB local raw
boundary. The media-foundation smoke also executes a real local SDR fixture and
independently probes the resulting bounded Rec.709 proxy.
It allocates only a small synthetic file and does not contact GCS.
The 2026-07-20 regression additionally proves that cloud-run/GCS mode with a
disabled distributed finalizer rejects a large upload intent without calling
the storage adapter to issue any target.

The 2026-07-17 capacity regression adds a deterministic shared-floor boundary:
with 9 GiB available, sixteen 64 MiB staging reservations are admitted while a
seventeenth is refused because it would consume the remaining 8 GiB floor. The
same exact code then completed the signed-in maximum-eight-source private graph
at `27/27` jobs and the full v9 internal aggregate at `32/32`. This corrects
artificial per-attempt multiplication of the safety floor; it does not weaken
the one-full-source-copy-plus-headroom requirement or prove distributed disk
admission.

The background-finalization smoke additionally proves authenticated enqueue and
poll routes, durable domain idempotency/conflict behavior, fresh-instance
readback, one active lease, no duplicate execution, bounded retry, expired-lease
reclamation, private file permissions, safe browser enqueue/poll/final-read
routing, and zero live provider/storage-byte execution. Its synthetic executor
does not prove that a real 50 GiB or larger object was processed.

The private 4K pipeline smoke closes the earlier zero-byte lifecycle gap for a
bounded representative object: it processes a real 27,109,799-byte 3840x2160
source, recovers after a committed-chunk response loss, hashes and stages the
stored bytes, probes the exact generation, survives process-state clearing,
creates a checksum-bound 1920x1080 Rec.709 analysis proxy, and re-verifies that
the immutable source checksum did not change. It intentionally keeps real
50 GiB, 250 GiB, ceiling-boundary, long-duration, and live-cloud claims false.

The post-change focused large-media smokes, upload and persistence security
checks, production build, scoped lint, server typecheck, and full internal
aggregate passed. On 2026-07-15, `npm run qa:internal-pipeline` completed all 24
phases in 1,075,984 ms with exit code 0. The run included the 27,109,799-byte
ingestion/proxy lifecycle, the separate 18,874,505-byte canonical source
lifecycle, the three-source continuity composition, the 50-tool identity
report, 11 named-edit browser tests, and the maximum eight-source signed-in
private-review regression. These results prove only the local/private and
fake-provider boundaries described here; they do not promote live-cloud,
external-beta, public-delivery, or production readiness.

## Remaining gates

ReEditPro must not claim production large-video support until all of these pass:

- live GCS CORS accepts `Content-Type` and `Content-Range` and exposes `Range`;
- the confirmation-gated same-SHA storage activation workflow runs and its
  immutable configuration evidence is consumed by the gateway activation;
- deployed IAM, create-only preconditions, session cancellation, and bucket
  lifecycle rules pass real integration tests;
- upload session state can recover safely across browser reload without storing
  a bearer session URI in browser persistence or canonical records;
- the source-verified pre-plan ingest port is implemented by a reviewed durable
  Postgres transaction adapter, and an authenticated distributed dispatcher
  claims queued jobs, reclaims abandoned work, and resumes safely after
  process/host loss without relying on a browser request or one long-lived
  internal HTTP request;
- hashing/probing gains durable byte-level progress or an approved
  generation-bound single-pass/range-aware design instead of restarting a full
  traversal after every interrupted attempt;
- malware/content scanning, parser isolation, hostile-media resource controls,
  and decompression-bomb defenses pass;
- worker disk/stream capacity, sustained I/O throughput, heartbeats, cancellation, retry,
  orphan cleanup, and observability pass with long-duration and broader representative 4K/8K, ProRes, long-GOP, VFR,
  multi-channel audio, timecode, HDR, and damaged inputs;
- a color-managed HDR/wide-gamut transform runtime, objective/visual QA, and
  metadata/timecode sidecars are verified; current source detection blocks the
  unsafe SDR proxy route but does not yet perform the transform;
- real 50 GiB, 250 GiB, and ceiling-boundary uploads pass interrupted/resumed
  tests without API memory growth;
- canonical source-bound execution accepts the other admitted professional
  containers, removes the current short-duration profile ceiling, and streams
  large intermediates/final composition without the current bounded in-memory
  dependency, request, and output contracts; and
- workspace/project storage quotas, retention, privacy deletion, and cost
  controls are deployed.

No live GCS object, IAM policy, Supabase row, provider, worker deployment,
billing state, public/production render, public export, or package lock was
changed by this slice. Private local 4K render and QA execution occurred only
inside the explicit internal-test boundary.
