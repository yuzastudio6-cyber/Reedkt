# Canonical Large-Dependency Streaming Verification — 2026-07-15

Status: `bounded_private_canonical_large_color_dependency_and_same_attempt_large_final_verified_production_unverified`

## Verified canonical boundary

`npm run smoke:canonical-private-color-execution` now proves one exact
same-attempt private canonical 4K workflow with both a large intermediate and
a large final artifact. The latest passing attempt used:

- an 18,874,505-byte, seven-second, 3840x2160, 24 fps source MP4;
- a 57,689,613-byte lossless VP9/Matroska professional-color artifact with
  SHA-256 `16ce99bd7421c195fe6e7c41632fcbb6e21be8bb97f8bd7d0f8e0d922dce8b18`;
  and
- a 16,847,752-byte H.264/AAC 4K final MP4 with SHA-256
  `15f9e9472d7286b57343c671aa8934de052b78eef3ab5d213f321fd5919e57d1`.

The color artifact exceeds the former 32 MiB whole-output-Buffer ceiling by
24,135,181 bytes. The final MP4 exceeds the former 16 MiB canonical final
proof boundary by 70,536 bytes. H.264 output is bound to the exact size and
SHA-256 of each attempt; this document does not claim byte-identical output
across independent encodes.

The same attempt completed server-owned planning handoff, the one approved 4K
estimate, synthetic private reservation, immutable snapshot, source-trim
validation, caption and replacement-voice dependencies, one-use dispatch,
FFmpeg execution, streamed create-only persistence, format and pixel QA,
reconciliation, replay, Remotion composition, final FFprobe QA, and private
download integrity.

## Authority-bound dependency streaming

The dependency stream reader accepts only the artifact already selected in
the active worker lease. Before returning a fresh stream opener it
revalidates:

1. authenticated workspace ownership and exact project/edit-session scope;
2. the approved snapshot, current job, work item, lease, execution attempt,
   dispatch grant, and complete dependency-authority hash;
3. the selected dependency job, asset, artifact version, source attempt, and
   source lease identity;
4. actual-run evidence, passed QA, private reconciliation, and the explicit
   `liveRuntimeEligible = false` boundary;
5. MIME type, format-specific ceiling, byte count, SHA-256, and media
   signature through a no-follow private stream.

The returned contract contains commitments and `openStream()`. It exposes no
bytes, base64, path, URL, signed URL, bucket/key pair, credential, or command.

Canonical final composition streams Matroska color and approved PCM WAV voice
dependencies through this boundary. Canonical final FFprobe QA independently
streams the selected private MP4. Attempt evidence distinguishes source
streaming, dependency streaming, large-dependency verification, media-output
streaming, and long-running lease renewal. Generic completed-artifact recovery
leaves these transport-specific fields false because an artifact alone cannot
prove the transport used by its original attempt.

## Current bounded capacities

- canonical Matroska/NUT stream persistence and dependency reads: 192 MiB;
- canonical approved PCM WAV persistence and dependency reads: 64 MiB;
- Remotion selected source: 192 MiB;
- Remotion selected sources combined: 192 MiB;
- Remotion approved voice tracks combined: 64 MiB;
- Remotion all inputs combined: 272 MiB;
- canonical/private Remotion MP4: 256 MiB;
- legacy buffered private media reads: 32 MiB;
- legacy buffered private audio reads: 8 MiB;
- structured and image dependencies: no more than 16 MiB at the generic
  boundary; and
- caption overlays combined: 8 MiB.

These are local/private execution ceilings, not upload limits, duration
promises, or production throughput claims.

## Multi-source regression

`npm run smoke:canonical-multi-source-final-composition` passed with three
ordered source trims, three source-bound voice deliveries, one baseline color
artifact, two directly reference-bound color matches, two exact hard-cut
boundaries, ordered composition, independent final FFprobe QA, reconciliation,
replay, and private download. This proves approved dependency order remains
intact outside the single-source large fixture.

## Credit and safety boundary

The canonical proof reuses the initial approved 4K estimate and reservation
for the covered 1080p, 2K, or 4K deliverable. It creates no second export
estimate or reservation and performs no export-time customer-credit mutation.
This slice adds no customer price, service fee, wallet, billing, charging, or
settlement behavior. Internal production cost remains a separate domain.

Provider execution, remote Supabase, customer charging, deployment, public
rendering/delivery, external beta, and production readiness remain false.

## Remaining limits

This proof does not establish:

- representative long-duration 4K throughput or recovery after host loss;
- distributed/object-store output streaming and distributed lease recovery;
- a Matroska/NUT artifact above 192 MiB, PCM WAV above 64 MiB, Remotion input
  above 272 MiB, or final MP4 above 256 MiB;
- streaming shot-match reference input; that separate reference dependency is
  still buffered/base64-bound and capped at 16 MiB;
- near-ceiling or representative long-duration voice, large caption, image,
  or structured dependencies;
- broad ProRes, VFR, timecode, multichannel, HDR, damaged-media, and hostile
  media coverage; or
- live GCS, providers, billing, Supabase, deployment, or public delivery.

## Verification

The changed code passed focused TypeScript, ESLint, diff hygiene, private
persistence, legacy FFmpeg, lease authority/HTTP/verification, the 50-tool
dispatch regression, the three-source composition regression, the exact
34,603,145-byte private stream persistence smoke, and the decisive canonical
4K workflow.

The final `npm run qa:internal-pipeline` run passed all 27 phases in
1,678,185 ms. The three-source phase passed in 585,231 ms, the media streaming
storage phase in 739 ms, the audio streaming phase in 491 ms, the canonical
professional-color phase in 581,021 ms, the separate Remotion stress phase in
96,614 ms, all 11 named-edit browser tests in 15,400 ms, and the
maximum-eight-source signed-in review phase in 370,019 ms. All provider, live
billing/wallet, remote Supabase, deployment, public-delivery, external-beta,
and paid-production flags remained false.
