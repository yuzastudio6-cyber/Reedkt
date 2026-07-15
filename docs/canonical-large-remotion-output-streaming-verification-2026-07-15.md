# Canonical Remotion Streaming-Output Verification — 2026-07-15

Status: `bounded_private_runtime_and_canonical_large_output_verified_production_unverified`

## Runtime streaming boundary

The confined Remotion runtime uses the versioned
`offline-remotion-render-stream-execution-v2` protocol. A bounded JSON manifest
is followed by exact raw media frames. The manifest contains approved planning
data and size/SHA-256/MIME/identity commitments, but no media base64, caller
path, URL, command, code, or credential.

The host hashes every opened input stream. The container stages inputs under
generated private identities, rehashes and signature-checks them, and serves
them to Remotion only over an internal loopback range server. The container is
network-none, read-only-root, non-root, cap-drop-all, no-new-privileges,
mount-free, bind-free, and caller-environment-free.

Current ceilings are:

- 192 MiB per selected source;
- 192 MiB for selected sources combined;
- 8 MiB for caption overlays combined;
- 64 MiB for approved voice tracks combined;
- 272 MiB for all render inputs combined; and
- 256 MiB for the final MP4.

Approved voice tracks use the server-injected stream path. The host and
container rehash their exact bytes, and the container validates fixed PCM from
a bounded file prefix rather than reading the full WAV into one Buffer. The
legacy base64 request remains capped at 2 MiB.

## Output persistence and QA

The runner inspects and hashes the completed MP4 without loading it into one
application Buffer. It emits bounded metadata and streams the exact MP4 to a
create-only private sink. The host enforces declared length and SHA-256,
verifies the MP4 signature, reopens and rehashes the committed object, and
supports one bounded authenticated byte range. Malformed or unsatisfiable
ranges fail closed. Public and signed URLs remain disabled.

Independent server-injected FFprobe verifies H.264 video dimensions, frame
rate and readable frame count, `yuv420p`, BT.709, AAC audio, sample rate,
channels, duration, and synchronization. A negative output commitment cannot
publish a poisoned target.

## Canonical same-attempt proof

The canonical color workflow now provides the previously missing same-attempt
large-final evidence. Its latest aggregate run streamed the exact
57,689,613-byte VP9/Matroska color dependency and its exact approved voice
dependency into Remotion, then persisted a 16,847,752-byte 4K H.264/AAC final
MP4 with SHA-256
`15f9e9472d7286b57343c671aa8934de052b78eef3ab5d213f321fd5919e57d1`.
The final then passed independent streamed FFprobe QA, artifact reconciliation,
idempotent replay, and private download integrity under the same approved
snapshot and reservation.

The final render recorded four successful server-owned lease heartbeats. The
heartbeat extends only the existing five-minute lease window and never the
immutable approved attempt deadline.

The exact aggregate's separate confined runtime smoke produced and
independently verified a 49,289,463-byte two-second UHD output with SHA-256
`6082397036f0db6e88bdab085838e324ee7ed35533f14dc7a6df35a37d5b0e41`.
That attempt remains useful runtime/persistence stress evidence; the canonical
workflow is the stronger lifecycle claim.

## Fail-closed evidence

The covered smokes reject caller paths, oversized commitments, duplicate or
reordered input identities, checksum substitution, poisoned create-only
targets, stale lease/dependency authority, and public-delivery promotion.
Provider, billing, customer-wallet, remote Supabase, deployment, public
delivery, external-beta, and paid-production authority all remain false.

## Remaining limits

This closes the short-fixture whole-Buffer Remotion output gap and the
same-attempt canonical large-final gap. It does not prove representative
long-duration throughput, outputs above 256 MiB, combined inputs above 272
MiB, distributed worker recovery, resume after host loss, live object-store
delivery, broad professional codec/timecode/VFR/multichannel coverage, HDR
delivery, or production operations.

## Verification

Focused Remotion streaming, canonical color, canonical multi-source,
50-tool dispatch, lease, persistence, TypeScript, ESLint, and diff-hygiene
checks passed. The final `npm run qa:internal-pipeline` run passed all 27
phases in 1,678,185 ms, including the 96,614 ms Remotion streaming phase,
11/11 named-edit browser tests, the 50-identity report, and the signed-in
maximum-eight-source accepted review. All production/public flags remained
false.
