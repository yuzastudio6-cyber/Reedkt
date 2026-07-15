# Canonical Remotion Streaming-Output Verification — 2026-07-15

Status: `bounded_private_runtime_persistence_and_qa_verified_canonical_large_output_job_and_production_unverified`

## Verified boundary

`npm run smoke:offline-remotion-streaming-output` produced a real two-second
3840x2160, 24 fps H.264/AAC delivery master through the confined Remotion
runtime. The latest hardened run used:

- a 13,496,169-byte high-detail UHD MP4 source with SHA-256
  `16b6012bf02aa0822b4a2c035d0f413601fdf8f193dd7b3545368545c79787ad`;
- a transparent approved full-frame PNG overlay; and
- a 52,092,354-byte output with SHA-256
  `89ee7386177dac29b4a30c15bef59a4b09cc0231ff49b9d367d9c2004b90f20a`.

The output exceeds the former 16 MiB output ceiling by 35,315,138 bytes. It is
an actual valid MP4, not padding, a sparse file, a mocked receipt, or an
unverified copy of the input.

A focused run on the same code produced a separately verified 49,802,330-byte
MP4. The smoke binds each attempt to its exact size and SHA-256 and does not
claim byte-identical H.264 output across independent Remotion renders.

## Streaming transport and confinement

The versioned `offline-remotion-render-stream-execution-v2` boundary sends one
bounded JSON manifest followed by exact raw media byte frames. The manifest
contains only approved planning data and size/SHA-256/MIME/identity
commitments. It contains no media base64, caller path, URL, command, code, or
credential.

The host independently hashes every opened input stream. The container writes
each input to a generated `/tmp` identity, rehashes it, verifies its file
signature, and validates approved PCM voice-track structure when present.
Remotion reads those files only through an internal loopback range server. The
container remains network-none, read-only-root, non-root, cap-drop-all,
no-new-privileges, mount-free, bind-free, and caller-environment-free.

The current bounded capacities are:

- 192 MiB per selected source;
- 192 MiB for all selected sources combined;
- 8 MiB for approved caption overlays combined;
- 2 MiB for approved voice tracks combined;
- 208 MiB for all render inputs combined; and
- 256 MiB for the final MP4.

These are explicit confined-runner ceilings, not professional source-upload
ceilings and not production throughput claims.

## Output persistence, QA, and delivery behavior

The runner inspects and hashes the completed MP4 without loading it into one
Buffer. It writes a bounded metadata header and then streams the exact raw MP4
over stdout. The host enforces the declared length and SHA-256 while passing
the stream to create-only private persistence.

Persistence verifies the exact length, SHA-256, and MP4 signature before the
temporary object can be committed. A negative fixture proves a mismatched
stream leaves no poisoned create-only target. The committed object is then
reopened and fully rehashed. A 1,024-byte range read returned the exact MP4
header, and independent server-injected FFprobe verified:

- H.264 video at 3840x2160;
- 24 fps and exactly 48 readable frames;
- `yuv420p` and BT.709;
- AAC audio at 48 kHz; and
- a valid duration/synchronization result.

Authenticated private media routes now stream their body and accept one
bounded HTTP byte range, including suffix ranges. Unsatisfiable or malformed
ranges fail with HTTP 416 and `Content-Range: bytes */<size>`. Public URLs,
signed URLs, public delivery, and browser-authored storage identity remain
disabled.

## Relationship to canonical execution

The canonical final-composition service now uses this v2 input/output
transport, streams approved original sources when selected, persists the raw
output before downstream authority is recorded, and gives independent FFprobe
a verified private stream. Existing canonical color and multi-source jobs pass
through that path with snapshot, reservation, lease, one-use dispatch,
artifact, QA, reconciliation, replay, and downstream verification evidence.

The canonical color job now also streams a 28,278,310-byte exact
VP9/Matroska dependency into Remotion after revalidating its lease, source
attempt, private object, QA, and reconciliation authority. Its same-attempt
final MP4 is 7,758,859 bytes, so it proves large canonical input-dependency
transport but not a large canonical final artifact.

The 52,092,354-byte aggregate fixture deliberately tests the
runtime/persistence/QA
boundary directly. It does not carry the full canonical job lifecycle in the
same attempt. Therefore the honest claim is:

> The canonical service path uses bounded v2 streaming, and a separate exact
> runtime/persistence/QA attempt proves a real output above 16 MiB.

It is not evidence that a canonical job has produced an output above 16 MiB.

## Fail-closed evidence

The focused smoke additionally proves that:

- caller-selected path fields are rejected;
- a source commitment above the 192 MiB ceiling is rejected;
- duplicate input identities are rejected;
- reordered host streams are rejected before the container or output sink;
- a checksum-mismatched output cannot publish a private target; and
- provider, billing, customer-wallet, remote Supabase, deployment, public
  delivery, external-beta, and paid-production authority remain false.

## Remaining limits

This closes the whole-Buffer/base64 Remotion output gap for one short bounded
UHD fixture. It does not prove long-duration editing, outputs above 256 MiB,
selected inputs above 208 MiB, FFmpeg output streaming, color intermediates
above 32 MiB, large caption/voice dependencies, source-bound Python streaming,
distributed worker recovery, live GCS, broad professional
codec/timecode/VFR/multichannel suites, HDR delivery, public export, or
production operations.

The next large-media execution work should address upstream large
intermediates and representative duration/throughput without weakening the
existing approval, reservation, immutable-snapshot, private-artifact, QA, or
delivery gates.

## Focused verification

The following passed on the changed code:

```sh
npm run typecheck:server
node --check docker/prod/offline-remotion-render-execution/runner.mjs
npm run smoke:offline-remotion-render-execution
npm run smoke:offline-remotion-streaming-output
npm run smoke:canonical-private-color-execution
```

The exact-code `npm run qa:internal-pipeline` run completed all 25 phases in
1,359,639 ms with exit code 0. The streaming-output phase passed in 101,992 ms;
the aggregate also completed the three-source canonical composition, the
over-16-MiB canonical source/color regression, the 11-test named-edit browser
suite, the 50-identity report, and the signed-in maximum eight-source accepted
review. No command in this verification contacts a live provider, remote
Supabase project, billing system, deployment, or public-delivery service.
