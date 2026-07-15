# Canonical Private Professional Voice Delivery

Status: `implemented_local_private_bounded_slice`

Status date: 2026-07-14

## Purpose

This slice connects one exact professional voice-delivery recipe to the
canonical private edit lifecycle. It is intentionally narrower than the full
SoundSync plan. The compiler may publish it only when every approved audio
instruction is representable by the fixed recipe and every output remains
bound to one approved source range.

## Exact Recipe

Each approved source item produces one private PCM WAV through the pinned LGPL
FFmpeg runtime:

- trim to the exact approved source frame range;
- reset audio timestamps;
- apply a 70 Hz high-pass filter;
- apply the fixed `gentle_voice_v1` compression profile;
- normalize to -14 LUFS integrated loudness with 7 LU loudness range;
- limit to -1 dBTP;
- emit 48 kHz, stereo, signed 16-bit PCM WAV.

The command is server-owned. The planner cannot supply arbitrary filters,
codecs, paths, commands, sample rates, channel layouts, loudness targets, or
compression parameters.

## Canonical Authority Chain

The executable proof requires all of the following:

1. an immutable approved plan snapshot and synthetic private-test credit
   reservation;
2. one exact FFmpeg voice work item per approved source item;
3. exact source-media and cleanup-decision lineage with no caller-supplied
   dependency substitution;
4. a dependency-ready job, active lease, and one-use dispatch grant;
5. execution in the reviewed, pinned LGPL FFmpeg runtime;
6. private WAV persistence plus independent structure/codec/rate/channel/frame
   verification;
7. artifact QA, reconciliation, idempotent replay, and downstream byte/hash
   verification;
8. exact ordered WAV selection by the final-composition lease;
9. Remotion replacement of source audio only under
   `replace_with_approved_voice_tracks`;
10. private H.264/AAC composition, independent final ffprobe QA,
    reconciliation, replay, and authenticated private download.

The final compositor validates exact source order, output keys, duration
frames, content type, byte length, SHA-256, WAV format, and sample-derived
duration before it serves any voice track through its private loopback origin.
When replacement is selected, source-video audio is muted and each approved
WAV is placed in the matching source sequence. Preserve-source profiles retain
their prior behavior.

## Compiler Eligibility

The bounded compiler emits this graph only when the plan explicitly requests
voice leveling, EQ cleanup, compression, loudness normalization, and true-peak
limiting with the approved -14 LUFS/-1 dBTP contract. Every clip must be
source-bound and request the same supported operation set.

The compiler still fails closed when the approved plan requires any richer
audio behavior, including music, music ducking, SFX, SoundSync cues, beat
alignment, a different loudness policy, or an unsupported clip operation. It
also remains blocked by unrelated uncompiled requirements such as non-hard-cut
transition effects, color work, or unsupported segment operations. Exact
approved source-boundary hard cuts are supported separately. No requirement is
silently dropped to obtain approval.

## Evidence

Focused evidence is provided by:

- `npm run smoke:offline-media-binary-execution`
- `npm run smoke:offline-remotion-render-execution`
- `npm run smoke:canonical-planning-publication-client`
- `REEDITPRO_CANONICAL_MULTI_SOURCE_SLICE_ONLY=true npm run smoke:canonical-private-tool-dispatch`
- `npm run qa:canonical-private-pipeline`

The two-source canonical fixture proves distinct source tones produce distinct
private voice artifacts, both artifacts pass QA/reconciliation/replay, the
final lease selects the exact ordered pair, the Remotion output uses the
replacement tracks, and the decoded final AAC differs from the
preserve-source baseline.

## Readiness Boundary

This is private, generated-fixture, single-host evidence. It does not authorize
or prove:

- live provider/model calls;
- deployed workers or production image attestation;
- Supabase or remote storage changes;
- customer wallet mutation, billing, settlement, or a second export charge;
- public rendering, export delivery, external beta, or paid production;
- arbitrary audio processing, mastering, music, ducking, SFX, or SoundSync;
- restoration of detail that is absent from a low-quality source.

The approved edit estimate continues to use the 4K UHD delivery ceiling. This
audio slice consumes only the already approved deliverable authority and does
not create a second estimate, reservation, or charge at export time.
