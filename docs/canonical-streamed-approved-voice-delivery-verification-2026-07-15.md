# Canonical Streamed Approved-Voice Delivery Verification — 2026-07-15

Status: `bounded_private_canonical_voice_streaming_verified_long_duration_and_production_unverified`

## Closed backend gap

Approved FFmpeg voice-delivery artifacts previously crossed canonical storage
through an 8 MiB whole-Buffer boundary and crossed final composition through a
2 MiB combined voice-track boundary. The canonical private path now keeps the
approved WAV bytes streamed from FFmpeg output through create-only private
persistence, lease-selected dependency reads, and the confined Remotion input
boundary.

The implementation:

- validates RIFF/WAVE PCM structure from at most a 64 KiB prefix plus the exact
  committed object length;
- accepts FFmpeg's non-seekable-pipe RIFF/data size sentinel while requiring
  every concrete declared length to match;
- hashes and size-checks the complete stream without assembling the PCM payload
  in one application Buffer;
- persists the exact WAV create-only, reopens it through a no-follow reader,
  and rejects identity collisions, checksum poisoning, and oversized streams;
- revalidates snapshot, work item, selected artifact, source attempt, lease,
  dispatch grant, QA, reconciliation, MIME, length, and SHA-256 before exposing
  a fresh credential-free `openStream()` dependency contract; and
- has the confined Remotion runner materialize, rehash, and validate the exact
  approved voice file before composition without calling `readFile()` on the
  voice payload.

Legacy buffered readers remain fail-closed at 8 MiB. The legacy base64
Remotion request remains capped at 2 MiB. Only the reviewed server-injected
stream protocol receives the larger boundary.

## Explicit capacities

- canonical FFmpeg approved-voice streamed output: 64 MiB;
- canonical private PCM WAV persistence and selected dependency read: 64 MiB;
- confined Remotion approved voice tracks combined: 64 MiB;
- confined Remotion selected sources combined: 192 MiB;
- confined Remotion captions combined: 8 MiB;
- confined Remotion all inputs combined: 272 MiB; and
- confined Remotion final MP4 output: 256 MiB.

At fixed 48 kHz stereo 16-bit PCM, 64 MiB is approximately 349.5 seconds of
payload. That arithmetic is a transport ceiling, not a duration promise. The
current executable canonical compiler remains capped at 240 frames and the
signed-in maximum-eight-source proof remains an eight-second fixture.

## Exact evidence

`npm run smoke:canonical-private-audio-streaming-output` passed with an exact
9,437,228-byte WAV, SHA-256
`b128de6f190c803a6ea2ed9adb15b0e40794667c50b691be3e80223caa1cb5e8`,
and 49.152 seconds of PCM. It proved create-only commit above the former 8 MiB
ceiling, bounded-header/sample-count inspection, no-follow reopen and rehash,
exact replay, collision rejection, buffered-reader fail-closed behavior, and
cleanup after a false checksum commitment.

`npm run smoke:canonical-private-color-execution` passed with a real
18,874,505-byte 3840x2160 source, streamed approved voice, a 57,689,613-byte
lossless VP9/Matroska color dependency, a 4K H.264/AAC master above 16 MiB,
independent final FFprobe QA, reconciliation, replay, and private download.
The runner reported that the exact lease-selected voice dependency was streamed
and PCM-validated from the private file.

`npm run smoke:canonical-multi-source-final-composition` passed with three
source-bound streamed voice deliveries, three professional-color artifacts,
two approved hard cuts, ordered composition, boundary continuity QA,
reconciliation, replay, and private download.

`npm run smoke:canonical-private-tool-dispatch` passed all 50 canonical tool
identity, payload, job-adapter, private artifact, QA, reconciliation, replay,
and downstream verification gates.

The final `npm run qa:internal-pipeline` run passed 27/27 phases in 1,678,185
ms. Relevant phase durations were 585,231 ms for multi-source composition,
491 ms for standalone audio streaming, 581,021 ms for canonical professional
color, 96,614 ms for large Remotion output, 15,400 ms for 11/11 named-edit UI
tests, and 370,019 ms for the signed-in maximum-eight-source private review.
Server typecheck, quiet ESLint, private-persistence hardening, and diff hygiene
also passed.

## Honest boundary and next work

This is local/private canonical lifecycle proof. It does not establish a
representative long professional program, near-64-MiB audio throughput,
segmented/chunked long-form rendering, distributed worker recovery, deployed
object storage, broad multichannel/sample-format coverage, public delivery, or
production operations.

No provider was activated. No remote Supabase action, SQL or migration change,
customer wallet mutation, billing, charging, settlement, deployment, public
render, public delivery, package-lock change, Motion Studio work, Edit
Reference/Edit Preferences implementation, or shared Qwen seam was added.
Product, external-beta, public-delivery, and paid-production readiness remain
false.
