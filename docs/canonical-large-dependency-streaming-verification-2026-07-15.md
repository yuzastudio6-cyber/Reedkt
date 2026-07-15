# Canonical Large-Dependency Streaming Verification — 2026-07-15

Status: `bounded_private_canonical_large_color_dependency_verified_large_final_same_attempt_and_production_unverified`

## Verified canonical boundary

`npm run smoke:canonical-private-color-execution` now proves that an exact
QA-passed dependency above the former 16 MiB dependency-reader ceiling can
cross the canonical job boundary without media base64, a caller path, a URL,
or caller-supplied storage authority.

The passing attempt used:

- an 18,874,505-byte three-second 3840x2160, 24 fps source MP4;
- a 28,278,310-byte lossless VP9/Matroska professional-color artifact with
  SHA-256 `dae33d534cc028170c18a988d4bcb26380b17169ed264421d49b634324662730`;
  and
- a 7,758,859-byte H.264/AAC 4K final MP4 with SHA-256
  `f1d92106979cf5c0011a4b4c9ee01f2bd5f77ffcd300c74f706703bcf37d78a2`.

The color artifact exceeds 16,777,216 bytes by 11,501,094 bytes. The same
attempt completed immutable plan publication, approval, the synthetic private
reservation, source-trim validation, caption and replacement-voice work,
one-use dispatch, the FFmpeg execution fence, create-only private artifact
persistence, actual pixel/format QA, reconciliation, idempotent replay,
Remotion composition, downstream FFprobe final QA, and private download
integrity.

The final MP4 is smaller than 16 MiB. That fact is recorded in the smoke
output, and this document does not present it as a large-final proof.

## Authority-bound stream reader

The versioned dependency stream reader accepts only the artifact index already
selected in the active worker lease. Before returning a fresh stream opener it
revalidates:

1. authenticated workspace ownership;
2. the exact project, edit session, approved snapshot, current job, and
   approved work item;
3. the active lease credential, started/completed execution fence, execution
   attempt, dispatch grant, and complete dependency-authority hash;
4. the selected dependency job, expected asset, artifact ID and version,
   source execution attempt, and source lease immutable hash;
5. actual-run evidence, passed QA, private-test reconciliation, and the
   fail-closed `liveRuntimeEligible = false` state;
6. the allowed MIME type and format-specific ceiling; and
7. the complete private object's byte count, SHA-256, and MP4, NUT, or
   Matroska signature through a no-follow private stream.

The returned contract contains only MIME type, size, SHA-256, immutable
lineage identities, an evidence hash, and `openStream()`. It contains no bytes,
base64, path, URL, signed URL, bucket/key pair, credential, or command.

## Execution wiring

Canonical final composition now keeps JSON, PNG, and WAV dependencies on their
existing bounded reader while loading exact professional-color Matroska
dependencies through the new stream boundary. Remotion receives those
dependencies through its server-injected private streaming protocol.

Canonical final FFprobe QA now loads the selected private MP4 through the same
authority-bound stream reader and invokes the server-injected FFprobe
protocol. It no longer converts the final artifact to base64. The adapter
records attempt-level `dependencyStreamInputVerified` and
`largeDependencyOverLegacyBufferVerified` evidence. Generic completion
recovery sets both fields to false because a completed artifact alone cannot
prove the transport used by the original attempt.

The format ceilings remain explicit:

- MP4 dependencies: 256 MiB;
- NUT/Matroska dependencies: 32 MiB; and
- legacy structured/image/audio Buffer reads: 16 MiB or their stricter
  operation-specific limit.

These are private local execution ceilings, not source-upload limits or
production throughput claims.

## Multi-source regression

`npm run smoke:canonical-multi-source-final-composition` also passed with
three ordered professional-color intermediates. It verified one direct color
operation, two reference-bound color matches, exact source ordering, hard-cut
boundaries, timed captions, three replacement-voice artifacts, final
composition, final FFprobe QA, reconciliation, replay, and private download.
This proves the stream selection remains aligned with approved dependency
order for multi-source work, not only the single-source large fixture.

## Credit and safety boundary

The canonical smoke reuses the initial approved 4K estimate and reservation
for the covered 1080p, 2K, or 4K deliverable. It creates no second export
estimate or reservation and performs no export-time customer-credit mutation.
This slice adds no customer price, service fee, wallet behavior, billing, or
settlement logic. Internal production cost evidence remains separate from
customer price and credits.

Provider execution, remote Supabase, customer charging, deployment, public
rendering, signed/public delivery, external beta, and production readiness all
remain false.

## Remaining limits

This proof does not establish:

- a canonical same-attempt final MP4 above 16 MiB;
- media-binary output streaming or a professional-color intermediate above
  32 MiB;
- large caption, voice, or structured dependencies;
- a final MP4 above 256 MiB or combined Remotion input above 208 MiB;
- representative long-duration throughput or resume after host loss;
- distributed capacity reservations or worker recovery;
- live GCS, provider, billing, Supabase, deployment, or public-delivery
  behavior; or
- broad ProRes, VFR, timecode, multichannel, HDR, damaged-media, and hostile
  media coverage.

The separate confined Remotion runtime proof produced a real 52,092,354-byte
4K MP4 in the aggregate run and verified its streamed persistence and FFprobe
QA. A focused run on the same code produced 49,802,330 bytes; the smoke verifies
the exact commitment and media properties of each run rather than asserting a
stable H.264 byte identity across independent renders. These remain separate
runtime attempts, not canonical large-final job claims.

## Focused verification

The following passed on the changed code:

```sh
npm run typecheck:server
npm run lint
npm run smoke:private-local-persistence
npm run smoke:offline-media-binary-execution
npm run smoke:offline-remotion-render-execution
npm run smoke:offline-remotion-streaming-output
npm run smoke:canonical-private-color-execution
npm run smoke:canonical-multi-source-final-composition
npm run smoke:canonical-private-tool-dispatch
```

`git diff --check` also passed. Focused success alone does not promote product,
external-beta, public-delivery, or production readiness.

## Aggregate verification

The exact-code `npm run qa:internal-pipeline` run passed all 25 phases in
1,359,639 ms. The three-source canonical phase passed in 576,999 ms, the large
canonical color-dependency phase passed in 263,792 ms, the separate large
Remotion output phase passed in 101,992 ms, all 11 named-edit browser tests
passed, and the signed-in maximum eight-source private-review phase passed in
370,273 ms.

The tool identity report still records exactly 50 canonical end-to-end and
job-adapter-verified tool identities at evidence revision `2026-07-15.30`.
The dedicated canonical tool-dispatch smoke also passed after the aggregate,
including completed-fence adapter recovery, create-only replay, downstream
dependency verification, and preserved attempt-level internal-cost evidence
without re-execution.
Provider activation, live billing/wallet mutation, remote Supabase, public
delivery, deployment, external beta, and paid-production readiness all
remained false.
