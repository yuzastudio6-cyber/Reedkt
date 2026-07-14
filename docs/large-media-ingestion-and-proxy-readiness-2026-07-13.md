# Large Media Ingestion And Proxy Readiness — 2026-07-13

Status: `source_hardened_private_background_finalization_verified_live_cloud_blocked`

This slice makes ReEditPro's upload contract suitable for professional-size
source footage without claiming that a deployed environment has processed a
terabyte file. The immutable original remains the render master. A private
proxy is a working/analysis derivative only.

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

This proves the control plane with synthetic completion evidence only. It is a
single-process/single-host private testing boundary, not a deployed queue. The
current worker implementation still performs full stored-byte hashing and then
privately stages the exact generation for FFprobe; an interrupted attempt
restarts that bounded traversal. A distributed dispatcher, representative
huge-object runs, single-pass/range-aware optimization, durable byte-level
progress, and deployed worker capacity remain required.

Cloud Storage documents that resumable chunks must be multiples of 256 KiB,
recommends at least 8 MiB, returns `308 Resume Incomplete` with a committed
range, and limits a resumable session to seven days:

- <https://cloud.google.com/storage/docs/performing-resumable-uploads>
- <https://cloud.google.com/storage/docs/resumable-uploads>
- <https://cloud.google.com/storage/quotas#objects>

## Quality-preserving proxy policy

`professional_1080p_analysis_proxy_v1` creates a private browser-compatible
working proxy with:

- a 1920x1080 bounding box with no upscaling;
- H.264 High Profile, CRF 20, `fast` preset, and `yuv420p`;
- AAC 48 kHz at 192 kbit/s when audio exists;
- variable-frame-rate timestamps passed through instead of forcing a new FPS;
- source aspect ratio preserved and dimensions kept even;
- source metadata, chapters, subtitle streams, and data streams omitted from
  the proxy to reduce private-metadata leakage; and
- fast-start MP4 layout.

The original object is immutable and remains the intended final-render source.
Proxy creation never authorizes source deletion or replacement. HDR/wide-gamut
sources require a later color-managed proxy transform before their proxy can be
treated as color-accurate.

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
npm run smoke:source-upload-planning-backend
npm run smoke:upload
npm run smoke:upload-boundary-security
npm run smoke:gcs-upload-integrity-security
npm run smoke:prod-media-foundation
```

The focused large-media smoke proves high-ceiling validation, create-only
resumable-session options, exact offset recovery after a simulated lost
response, recovery when the offset query is itself interrupted, no
cross-origin auth leakage, no browser whole-file hash, proxy settings,
adaptive task budgets, and the unchanged 16 MiB local raw boundary.
It allocates only a small synthetic file and does not contact GCS.

The background-finalization smoke additionally proves authenticated enqueue and
poll routes, durable domain idempotency/conflict behavior, fresh-instance
readback, one active lease, no duplicate execution, bounded retry, expired-lease
reclamation, private file permissions, safe browser enqueue/poll/final-read
routing, and zero live provider/storage-byte execution. Its synthetic executor
does not prove that a real 50 GiB or larger object was processed.

The post-change focused large-media smoke, upload/planning smoke, build, lint,
server typecheck, and completion audit passed. The completion audit covers 19
requirements with 152 named evidence checks. One full aggregate review attempt
reached the existing canonical Docker dispatch stage and hit its fixed command
timeout; the exact canonical 50-tool dispatch stage then passed in isolation.
No post-change all-stage aggregate pass is claimed. These results prove the
local/private and fake-provider boundaries described here; they do not promote
live-cloud readiness.

## Remaining gates

ReEditPro must not claim production large-video support until all of these pass:

- live GCS CORS accepts `Content-Type` and `Content-Range` and exposes `Range`;
- deployed IAM, create-only preconditions, session cancellation, and bucket
  lifecycle rules pass real integration tests;
- upload session state can recover safely across browser reload without storing
  a bearer session URI in browser persistence or canonical records;
- an approved distributed dispatcher claims queued jobs, reclaims abandoned
  work, and resumes safely after process/host loss without relying on a browser
  request or one long-lived internal HTTP request;
- hashing/probing gains durable byte-level progress or an approved
  generation-bound single-pass/range-aware design instead of restarting a full
  traversal after every interrupted attempt;
- malware/content scanning, parser isolation, hostile-media resource controls,
  and decompression-bomb defenses pass;
- worker disk/stream capacity, heartbeats, cancellation, retry, orphan cleanup,
  and observability pass with representative 4K/8K, ProRes, long-GOP, VFR,
  multi-channel audio, timecode, HDR, and damaged inputs;
- a color-managed HDR/wide-gamut proxy policy and metadata/timecode sidecars are
  verified;
- real 50 GiB, 250 GiB, and ceiling-boundary uploads pass interrupted/resumed
  tests without API memory growth; and
- workspace/project storage quotas, retention, privacy deletion, and cost
  controls are deployed.

No live GCS object, IAM policy, Supabase row, provider, worker deployment,
billing state, render, export, or package lock was changed by this slice.
