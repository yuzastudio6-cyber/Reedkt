# Canonical Music v3.2 final-closure red-team audit

Date: 2026-08-06

Branch: `codex/canonical-music-skill`

Scope: the original execution-integrity delta through Music `3.1.0`, the
post-green artifact/receipt/publication closure in Music `3.2.0`, and the
additive canonical Sound public-support delta through `4.2.0`.
This audit is evidence for the standalone departments; it does not implement
the Head of Orchestra, final composition, mux, render, export, or delivery.

## Result

No unresolved Music-specific closure defect was found after implementation and
the final focused regression pass. The implementation fails closed when cue
policy, authority, source lineage, operation parameters, provider state, or
measured output evidence cannot be proved.

Published identities at the audited source state:

- Music: `3.2.0`, contract `music.skill_contract.v3`, manifest
  `e7497e4c3297d8505f77d1454aa17cea741ad4ad7bc49601113a46d858013043`.
- Sound: `4.2.0`, contract `sound.skill_contract.v4`, manifest
  `84ed4074e718aff8c48a3af6b7f981dc3442672721e1a20f1fef4546e800e122`.
- Music cue grouping: `music.route.plan.cue_grouping.v3@3.1.0`.
- Music cue sheet and constraint publication:
  `music.route.plan.cue_sheet.v3@3.2.0`.
- Music two-source support: `music.route.support.two_source_crossfade.v3@3.1.0`.
- Sound two-source executor:
  `sound.route.edit.music_two_source_crossfade.v1@1.0.0`.

The immutable hashes are recomputed by publication tests. A stale route,
handler, tool operation, output schema, or manifest reference prevents
publication.

## Adversarial checks

| Attack or failure hypothesis | Evidence inspected | Result |
|---|---|---|
| Atomic soundtrack segments are presented as final Music cues, so a long video may be over-scored. | `buildMusicCueGroupingPlan`, `music_cue_grouping_plan_v3`, and the 38-segment closure scenario. | Rejected. Atomic segments are grouped before cue creation. Four active cues remain under the approved count and density limits. |
| The cue ceiling is only a warning. | Impossible one-cue policy with three fully locked cues. | Rejected. Planning emits `music_cue_policy_conflict_v3`; execution returns typed `blocked` and creates no fake completion. |
| Grouping changes between identical requests. | Same request planned twice with one idempotency key; grouping hashes and group payloads compared. | Rejected. Replay is deterministic and an idempotency collision with changed inputs fails closed. |
| Whole-video execution secretly requires caller-authored cues or selects the first available source. | `cues: []` whole-video fixture with three independently resolved ranges and cue-specific asset descriptors. | Rejected. The canonical service selects approved source Music, no Music, and generated Music in one request, processes both real Music outputs, and preserves the exact no-Music range. |
| “Crossfade” is one-source fade metadata. | Two distinct real WAV sources, exact left/right hashes, 24-frame overlap, FFT/RMS window measurements, and the Sound public service receipt. | Rejected. Both frequencies are measurable in the overlap; source dominance changes across the output; duration, clipping, true peak, route, profile, parameters, and two-source lineage are receipt-bound. |
| A stale, missing, duplicated, or unauthorized crossfade input is accepted. | Missing right source, equal-source checksum, stale checksum, out-of-authority overlap, excessive overlap, and receipt tampering. | Rejected in every case before usable output authority is returned. |
| Duck attack/release values are labels and the audio jumps instantly. | Actual decoded output windows at the beginning/end of a protected range. | Rejected. The filter applies frame-based attack/hold/release ramps and records measured RMS progression; zero-length attack/release and reversed ranges are rejected. |
| Music accepts a Sound receipt even when a requested parameter was ignored. | Per-operation requested/compiled/applied records for all 17 one-source operations: trim/cut, fade, gain, normalization, loop, resample, channel conversion, time stretch, pitch shift, placement, ducking, EQ, dynamics, pan, stem rendering, and technical QA. | Rejected. Music validates each operation identity, exact expected parameters, profile, route, range, source/output lineage, measured evidence class, and receipt hash. Crossfade remains isolated on the two-source boundary. |
| Receipt fields can be edited without detection. | Original seven field attacks, one requested-parameter mutation for every one-source operation, and removal of duck-ramp, pan-channel, and loudness/peak evidence with a recomputed per-operation hash. | Rejected in all 27 cases. |
| The public result returns authoritative v3 records that its manifest does not declare. | Planning, real execution, QA, localized revision, handoff, technical Sound support, and crossfade output inventory. | Rejected. Cue-constraint resolutions and acceptance receipts are immutable artifacts; all v3 public-service outputs are manifest-declared and publication-validated. |
| A multi-step Music route is declared but only its first step executes. | Cue-sheet plan step followed by exact constraint-resolution publication, with two independent step receipts and named output bindings. | Rejected. The Music route executor topologically executes all dependency steps and fails on cycles, missing dependencies, handlers, or required outputs. |
| Publication accepts stale or unreachable authority. | Stale manifest, stale route, omitted public artifact, missing handler, undeclared step output, unsupported job, and unreachable final-output attacks. | Rejected by the dedicated negative publication cases. |
| A new executable route has no exact handler or lies about outputs. | Shared publication validation, Music completeness validation, and Sound operation-handler coverage. | Rejected. Publication initially exposed the missing crossfade handler; the exact handler registration was added and the full shared registry now validates. |
| The generic one-source Sound request can invoke the two-source route without the exact extension. | Generic Sound automation validation and capability-wide Sound acceptance. | Rejected. Generic automation forbids `crossfade`; the two-source operation is callable only through the dedicated typed Sound public boundary. |
| Music can bypass Sound and run FFmpeg/provider internals. | Imports, operation registry, MusicSoundSupportPort, and receipt validation. | Rejected. Music uses the injected Sound public port; low-level Sound executor, command, path, credential, and provider details are absent from the Music request surface. |
| Broad video study escalates Music write authority. | Grouping, autonomous execution, crossfade, Sound support, and scope guard ranges. | Rejected. Every actual mutation/overlap remains a subset of exact authorized Music ranges and delegated Sound ranges. |
| The closure silently promotes subjective Music QA or Lyria production qualification. | Capability matrix, manifest qualification, QA outputs, provider profile, and retained live-canary evidence. | Rejected. Top-level Music remains `planning_qualified`; subjective findings remain review-aware; production-qualified jobs remain zero. The verified private Lyria canary is preserved without promoting the production route. |
| A wrong Google identity supplied the retained Lyria evidence. | Active Google Cloud identity and immutable canary evidence record. | Rejected. The active identity is `aiediting@reeditpro.com`; the evidence record states that the Yuza/personal identity was not used. |
| The final delta accidentally implements the Orchestra, another top-level skill, or final render. | Changed-file inventory and public ownership declarations. | Rejected. No Head/global scheduler/persistence or other skill was added; final mux/render/export/delivery remain outside Music and Sound. |

## Required focused evidence

`npm run test:music-final-closure` runs all six mandatory scenarios:

1. cue grouping and hard-limit enforcement;
2. autonomous whole-video execution with no caller-authored cues;
3. genuine two-source crossfade with real bytes and overlap measurements;
4. measured duck attack/release envelopes;
5. parameter-specific Sound receipt integrity and tamper rejection;
6. Music/Sound manifest, route, mini-skill, tool, handler, and output
   completeness.

The aggregate is included in canonical Music acceptance and as an explicit
cross-skill regression in canonical Sound CI. The final exact-SHA GitHub run,
local/remote SHA parity, and clean worktree remain release evidence to be
recorded after the milestone commits are pushed.

## Qualification-honesty conclusion

The closure adds private-internal deterministic audio execution evidence; it
does not convert planning judgment into measured fact. Real-byte execution is
claimed only for the exact local Sound routes and injected/private Music paths
that produced immutable artifacts and measured receipts. Live Lyria transport
has a previously verified private canary, while durable product-runtime
activation and production qualification remain separate explicit gates.
