# Large Media Private 4K Pipeline Verification — 2026-07-15

Status: `resumable_sized_4k_private_pipeline_verified_live_cloud_and_huge_scale_unverified`

## What is now executable

`npm run smoke:large-media-private-4k-pipeline` generates an actual lossless
3840x2160 FFV1/Matroska source with 48 kHz 24-bit PCM audio. The current fixture
is 27,109,799 bytes, so it crosses the 16 MiB resumable boundary with real media
bytes instead of declaring a synthetic 50 GiB or 100 GiB size.

The focused command connects:

1. authenticated project and source upload-intent authority;
2. a create-only resumable target;
3. browser-side 8 MiB chunking without whole-source `arrayBuffer()` use;
4. a deliberately lost response after the second committed chunk;
5. provider-offset query and exact resume;
6. backend streaming SHA-256, byte count, generation, and ETag authority;
7. filesystem-capacity admission before the finalization lease;
8. exact private source staging and FFprobe;
9. checksum-protected finalization state, fresh-process readback, and replay;
10. an approved-snapshot/idempotency/credit-reservation-bearing private media
    foundation payload;
11. exact source checksum verification before and after processing;
12. a 1920x1080 H.264 High/yuv420p/Rec.709/AAC analysis proxy; and
13. checksum-bound proxy artifact metadata that identifies the immutable source
    checksum and generation while declaring the proxy ineligible as final-render
    authority.

The output writer now records SHA-256 on proxy, extracted-audio, keyframe, and
representative-frame artifacts. FFmpeg output files are restricted to `0600`
and their output directories to `0700` before the artifacts are returned. This
adds useful artifact integrity and lineage evidence; it does not claim the
external-process writer has a complete sandbox or atomic-promotion design.

## Current evidence record

The 2026-07-15 focused execution passed with:

- source: 3840x2160, 27,109,799 bytes;
- resumable threshold: 16,777,216 bytes;
- maximum in-memory chunk body: 8,388,608 bytes;
- upload requests: five, including committed-offset recovery;
- whole-source browser buffer call: false;
- backend stored-byte hash and exact generation/ETag: verified;
- private probe stage: completed and cleaned;
- finalization replay after process-state clearing: verified;
- proxy: 1920x1080 H.264/yuv420p/Rec.709 with 48 kHz audio;
- source checksum before and after proxy creation: identical; and
- proxy checksum, source lineage, restrictive modes, and analysis-only role:
  verified.

The focused and aggregate runs observed about 22.5 GB available on the private
worker filesystem against an approximately 8.62 GB admission requirement.
Available-space figures are environment observations, not deployment guarantees.

## Canonical execution follow-up

This ingestion/proxy proof is now complemented by
`docs/canonical-large-source-streaming-verification-2026-07-15.md`. The follow-up
uses a separate valid 18,874,505-byte 3840x2160 MP4 and carries it through
resumable upload, background finalization, canonical planning and approval,
source-bound voice and professional color, private 4K composition, independent
final QA, replay, and private download. It preserves the original 4K estimate
and reservation with no export-time estimate or charge.

The follow-up does not turn this 27 MB proxy fixture or the 18.9 MB canonical
fixture into long-duration, genuinely huge, live-cloud, product, beta, or
production evidence. Canonical output/intermediate and Remotion-input buffers
remain a separate open architecture gate.

The exact post-change `npm run qa:internal-pipeline` aggregate completed all 24
phases in 1,075,984 ms with exit code 0. It included both byte-representative 4K
fixtures, the separate three-source continuity composition, the 50-tool identity
report, and the maximum eight-source signed-in private-review regression. This
is local/private aggregate evidence only; it does not close any live-cloud or
production gate listed below.

## Honest boundary

This is a short, byte-representative 4K fixture. It proves the connected private
code path above the resumable threshold, but it does not prove long-duration
media, sustained throughput, or the advertised maximum size.

Still required before a large-video product or production claim:

- live GCS CORS, IAM, create-only replay, lifecycle, and session-expiry tests;
- real 50 GiB, 250 GiB, and ceiling-boundary interrupted uploads;
- distributed dispatch, durable byte progress, host-loss recovery, cancellation,
  and shared capacity reservations;
- long-duration 4K/8K, ProRes, long-GOP, VFR, multichannel, timecode, damaged,
  hostile, HDR, and wide-gamut media suites;
- malware/content scanning and parser/subprocess sandbox evidence;
- a color-managed HDR/wide-gamut proxy path with objective and visual QA;
- deployed quotas, retention, privacy deletion, observability, and cost controls.

No live GCS object, provider, Supabase project, billing state, customer wallet,
deployment, public render, public export, package lock, or Motion Studio code is
used or changed by this proof.
