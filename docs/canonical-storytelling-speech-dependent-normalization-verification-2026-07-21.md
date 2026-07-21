# Canonical Storytelling Speech dependent normalization verification

Date: 2026-07-21

## Verdict

The protected private backend now has one bounded, provider-neutral handoff from
the already admitted ElevenLabs Storytelling Speech provider attempt into the
existing canonical FFmpeg operation:

- provider operation:
  `provider.elevenlabs.generate_storytelling_speech_candidate.v1`;
- provider route: `elevenlabs_eleven_v3_storytelling_speech`;
- dependent tool operation: `tool.ffmpeg.execute_approved_media_recipe.v1`;
- fixed recipe: `approved_storytelling_speech_take_normalization_v1`;
- output role: `normalized_storytelling_speech_take`;
- output contract: private `audio/wav`, PCM s16le, 48 kHz, mono.

This is accepted private/internal source and runner evidence. It is not a live
provider run, a deployed worker proof, or production readiness. Provider
transport, Secret Manager payload access, Supabase/cloud mutation, customer
pricing, credits, service fee, billing, final delivery, deployment, and public
access remain disabled.

## Exact authority chain

The normalization work item is accepted only when all of the following are
true:

1. It is an immutable approved work item in the exact execution package and
   uses the existing FFmpeg operation and fixed Speech recipe.
2. Its only dependency is the successful provider job from the same package.
3. That provider job has exactly two ordered private outputs from one terminal
   attempt: bounded `audio/mpeg` and bounded `application/json` alignment.
4. The current provider receipt, queue claim/lease aliases, one-use dispatch,
   terminal output set, create-only candidate bytes, checksums, private-object
   identities, and readback hashes reverify at consumption time.
5. Both outputs bind the same production, Prepared Script segment, scene,
   Voice Bible version and digest, spoken-text digest, timing authority,
   approved frame range, and source-authority digest.
6. The MP3 and alignment records have passed the existing private artifact QA
   and reconciliation authority. Raw alignment never enters the browser or the
   FFmpeg input stream.
7. The active snapshot, package, job, claim/lease, dispatch, dependency
   authority, and expected output are revalidated before tool dispatch.

The create-only bridge and verifier are exported by:

- `server/services/canonical-private-provider-output-artifact-store.ts`;
- `server/services/canonical-private-provider-output-artifact-verifier.ts`;
- `server/services/canonical-private-provider-output-artifact-service.ts`.

The exact work-item and payload digest authority is exported by
`server/edit-architecture/canonical-storytelling-speech-normalization-authority.ts`.

## Execution and QA behavior

The pinned networkless LGPL FFmpeg runner accepts the provider MP3 only through
the server-injected streaming boundary. It decodes and verifies the source
duration against the approved frame interval, strips metadata and chapters,
removes non-audio streams, trims only codec delay to the exact approved frame
duration, and produces PCM s16le 48 kHz mono WAV. It does not time-stretch,
perform loudness normalization, select a take, mix audio, mutate a timeline, or
render/export the edit.

The output is independently probed for container, codec, sample rate, channel
count, bit depth, and frame-derived duration before create-only private
persistence. The existing artifact QA/reconciliation and worker-resource
evidence authorities bind the two dependency artifacts and normalized output
to the exact job, attempt, lease, dispatch, operation, and profile.

Provider-attempt internal cost and FFmpeg infrastructure cost remain separate
attempt-level components. Neither component contains customer price, customer
credits, ReEditPro service fee, wallet mutation, or settlement authority.

## Evidence classification

The provider-output proof uses
`private_injected_nonprovider_test` /
`non_promotable_private_injected`. The FFmpeg proof is an actual confined local
runner execution with cgroup-v2 CPU/memory evidence. Combining those two facts
does not promote the provider attempt to canonical live runtime evidence.

The main product planner still keeps generated Storytelling Speech execution
closed. This slice supplies the canonical consumer and execution seam needed by
Motion Studio; a future approved package may use it only after the provider
transport, durable deployed queue/lease/dispatch, private object store, cost
reconciliation, qualification, and same-release readiness gates pass.

## Verification

The following commands passed on the exact bounded source tree:

- `npm run typecheck:server`;
- `npm run smoke:canonical-private-multi-output-provider-work-lifecycle`;
- `npm run smoke:offline-media-binary-execution`;
- `npm run smoke:canonical-private-tool-dispatch`.

The focused provider smoke proves two current, checksum-readback provider
outputs, create-only bridge persistence, exact receipt reprojection, byte
reopening, tamper rejection, failed-attempt cost retention, and unknown-outcome
reconciliation with zero provider requests and zero secret reads.

The media smoke proves an actual MP3-to-WAV run, exact 48 kHz mono PCM output,
source/timing/Voice Bible/alignment authority, independent probe, cgroup-v2
resource evidence, deterministic confinement, and MIME/digest tamper rejection.

The authoritative aggregate proves all 50 frozen tool identities and their
payload bindings, canonical package queue/claim/lease/one-use dispatch,
FFmpeg/FFprobe cgroup evidence and internal cost, artifact QA/reconciliation,
restart/replay, and the retained eight-job private-review graph. One initial
aggregate attempt encountered a retryable local runtime failure in the older
`approved_voice_delivery_wav_v1` fixture. Its focused runner proof passed, and
the full authoritative aggregate then passed cleanly without changing that
profile or weakening an assertion.

## Remaining closed gates

- real ElevenLabs account/entitlement, continuity, retention, and transport;
- server-only credential payload read and deployed secret binding;
- deployed durable queue, lease, one-use provider dispatch, object storage, and
  multi-replica recovery;
- canonical live provider and infrastructure usage reconciliation;
- production qualification and same-SHA release evidence;
- automatic take selection, alignment interpretation, mix, timeline, final
  render/export, customer commercial settlement, deployment, and public
  delivery.

`productionReady=false` remains the only honest product-readiness conclusion.
