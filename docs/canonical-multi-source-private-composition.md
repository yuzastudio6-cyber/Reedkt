# Canonical Multi-Source Private Composition

Status date: 2026-07-15

Status: exact ordered three-source, two-caption, three-voice, reference-bound professional-color, approved-hard-cut composition is verified through the canonical private lifecycle; product, external-beta, public-delivery, and production readiness remain false.

## What is implemented

The canonical planning compiler can publish a bounded source-and-caption graph for an exact ordered source sequence. The graph contains:

1. immutable approved-snapshot validation;
2. exact source-range validation for every ordered source;
3. one dependency-free libass artifact for each approved caption cue;
4. optional exact source-bound FFmpeg voice-delivery and professional-color intermediates, including direct dependency on the first source's QA-passed color artifact for later-source shot matching;
5. one Remotion final composition using either the legacy full-duration caption profile or `approved_source_sequence_caption_track_final_v1`, with one immutable hard-cut record per ordered source boundary; and
6. dependency-bound FFprobe final-artifact QA.

The Remotion composition places each source in an explicit timeline `Sequence`, applies its exact approved source range, enforces `approved_hard_cuts_only`, preserves source audio or applies the exact approved replacement-voice tracks, and places every approved full-frame RGBA caption artifact in a second exact frame-bounded `Sequence`. Each cut binds the master timing ID, refined timing ID, adjacent segment IDs, adjacent source IDs, and exact boundary frame. Source bytes and dependency artifacts are reopened only by the backend from their approved private manifests. Browser paths, URLs, bytes, commands, credentials, and caller-authored storage identity are rejected.

## Exact sequence contract

The sequence contract accepts two through eight unique MP4 sources and requires all of the following:

- confirmed source order and one exact cleanup decision per source;
- duration-preserving source-to-timeline ranges with no gap or overlap;
- exactly one unique approved hard cut at each adjacent source boundary, with no duration, overlap, SFX, or caller-selected effect;
- exact coverage of the approved 24–240-frame final duration;
- 24fps or 30fps and an approved bounded output frame;
- each immutable original source between 64 bytes and the 1 TiB professional source ceiling; when any original exceeds 16 MiB, every source must have an approved professional-color intermediate before publication;
- each selected Remotion source/intermediate no larger than 16 MiB and the combined selected-input sequence no larger than 20 MiB under the current serialized runtime contract;
- either one full-duration caption or two through seven unique, ordered, non-overlapping caption cues inside the approved duration;
- one checksum-bound PNG per caption cue, in exact output-key order, with no more than 8 MB across the combined caption track;
- a complete serialized request no larger than the confined runtime's 32 MB stdin ceiling;
- safe caption text and exact cue-to-artifact lineage; a legacy single cue must span the complete final frame range;
- no unsupported cleanup action, speed change, placeholder, provider route, or hidden fallback.

The protocol and compiler cover two through eight sources. The focused executable evidence in this milestone uses three distinct approved source objects. A separate signed-in maximum-profile fixture covers eight short synthetic sources; neither result is long-duration or genuinely huge media proof.

## Source-bound runtime identity

The Remotion image is rebuilt with an aggregate SHA-256 over the Dockerfile, runner, composition, entry point, bundle scripts, package manifest, and lockfile. That digest is stored in the image label `com.reeditpro.runner.source-tree.sha256`. Runtime activation recomputes the digest from the reviewed source and refuses an image whose label does not match. This closes the prior gap where current host source hashes could be combined with an older already-built image identity.

The container remains network-none, read-only, non-root, capability-dropped, mount-free, caller-environment-free, and bounded by fixed CPU, memory, PID, tmpfs, stdin, output, and timeout limits.

## Verified evidence

`npm run smoke:offline-remotion-render-execution` proves the current source-bound image actually renders two ordered one-second MP4 sources into a 48-frame H.264 composition, applies the approved hard cut at frame 24, preserves AAC audio, applies two distinct approved caption artifacts over frames 0–24 and 24–48, decodes distinct captioned frames, rejects a changed cut frame, and passes an independent pinned FFprobe frame/codec/duration check.

`npm run smoke:canonical-multi-source-final-composition` proves the same exact sequence profile through:

- persisted planning handoff;
- immutable approved snapshot;
- synthetic private-test credit reservation without customer charging;
- three-source trim authority and dependency readiness;
- two exact caption artifacts and their approved frame ranges;
- three exact source-bound voice WAVs;
- one baseline and two directly first-reference-bound professional-color intermediates with objective boundary-continuity QA;
- immutable hard-cut snapshot authority and exact source-boundary execution;
- worker lease and one-use dispatch;
- backend-only source reads and confined Remotion execution;
- private artifact persistence;
- independent final FFprobe QA;
- reconciliation, idempotent adapter replay, downstream QA, and authenticated private download.

`npm run smoke:canonical-planning-publication-client` proves the named-edit compiler produces one exact libass work item per cue, freezes the cue output-key/frame mapping into the Remotion payload, and preserves the ordered source ranges and all caption dependencies in the canonical work graph.

The focused caption-track lifecycle is green through `npm run smoke:canonical-multi-source-final-composition`. The broader `npm run smoke:canonical-private-tool-dispatch` result from the prior one-caption baseline is not claimed as a post-change aggregate rerun here. All 50 tool identities remain private/internal evidence; none are promoted to product, external-beta, public-delivery, or production readiness by this slice.

## No-silent-drop boundary

The normal rich two-source mock editor plan is intentionally not published into this bounded graph. Confirmed preserve-source-order planning maps its two one-second sources to two exact contiguous segments totaling two seconds/60 frames; it neither repeats nor stretches source footage. Its two caption ranges remain inside those segments and expose short-readability risk without extending the timeline. The explicit `use the source only` instruction now suppresses b-roll, music, SFX, beat analysis, SoundSync cues, ducking, and silence removal while preserving the exact professional voice-delivery chain. With no transition motivation, refinement chooses an exact hard cut at frame 30. The compiler clears the duration, segment, caption, transition, SFX, ducking, and audio blockers. The normal plan still fails closed on its uncompiled professional color operation instead of silently dropping color to obtain publication.

The following remain separate future work-item/compiler milestones:

- caption animation, overlapping captions, more than seven cues, and transcript/word-level alignment workers;
- crossfades, wipes, pushes, zooms, match cuts, other transition effects, and visual timing cues;
- added music, SFX, music ducking, silence detection/removal, and richer audio operations;
- broader color correction, grading, arbitrary reference selection, HDR/wide-gamut delivery, and long-duration intermediates beyond the fixed current profile;
- provider-backed assets, visual assets, and provider clip timing;
- speed changes, retiming, non-contiguous selects, and richer segment operations;
- deployed workers, distributed recovery, real-user storage/tenancy, public delivery, and production operations.

## Explicit non-authority

This milestone does not enable Supabase changes, provider calls, customer pricing or credits, billing, wallet mutation, production settlement, deployment, public rendering, Motion Studio, or MS-001. The synthetic reservation is private test authority only. All product, external-beta, final-export, public-delivery, and production readiness flags remain false.
