# Canonical Music v3.3 final-closure red-team audit

Date: 2026-08-06

Branch: `codex/canonical-music-skill`

Scope: the original execution-integrity delta through Music `3.1.0`, the
artifact/receipt/publication closure in Music `3.2.0`, and the fresh
requirement-to-source audit that publishes Music `3.3.0` with canonical Sound
`4.3.0` and immutable Sound Music-support v2 contracts.
This audit is evidence for the standalone departments; it does not implement
the Head of Orchestra, final composition, mux, render, export, or delivery.

## Result

No unresolved Music-specific closure defect was found after implementation and
the final focused regression pass. The implementation fails closed when cue
policy, authority, source lineage, operation parameters, provider state, or
measured output evidence cannot be proved.

Published identities at the audited source state:

- Music: `3.3.0`, contract `music.skill_contract.v3`, manifest
  `40a43c5426e0d733097921d7a66e4deb0b70292bccff889bf01abb06d7f619fb`.
- Sound: `4.3.0`, contract `sound.skill_contract.v4`, manifest
  `7a95f89ebfed61e9ef2658d6a162b36f48d0659959b247cd431da4f7e6512591`.
- Music cue grouping: `music.route.plan.cue_grouping.v3@3.3.0`.
- Music cue sheet and constraint publication:
  `music.route.plan.cue_sheet.v3@3.3.0`.
- Music two-source support: `music.route.support.two_source_crossfade.v3@3.3.0`.
- Sound two-source executor:
  `sound.route.edit.music_two_source_crossfade.v2@2.0.0`.
- Sound Music automation:
  `sound.route.edit.music_technical_automation.v2@2.0.0`.

The immutable hashes are recomputed by publication tests. A stale route,
handler, tool operation, output schema, or manifest reference prevents
publication.

## Adversarial checks

| Attack or failure hypothesis | Evidence inspected | Result |
|---|---|---|
| Atomic soundtrack segments are presented as final Music cues, so a long video may be over-scored. | `buildMusicCueGroupingPlan`, `music_cue_grouping_plan_v3`, and the 38-segment closure scenario. | Rejected. Atomic segments are grouped before cue creation. Four active cues remain under the approved count and density limits. The grouping engine no longer relaxes story-function or cue-role compatibility. |
| Grouping merges across incompatible rights, acquisition sources, locked cues, narrative purpose, or no-Music boundaries. | A dedicated user-upload/provider-generated boundary with distinct rights, plus narrative/no-Music/locked boundary assertions. | Rejected. Each incompatibility is recorded as an exact non-merge reason and no resulting group crosses the protected boundary. |
| The cue ceiling is only a warning. | Impossible one-cue policy with three fully locked cues. | Rejected. Planning emits `music_cue_policy_conflict_v3`; execution returns typed `blocked` and creates no fake completion. |
| Grouping changes between identical requests. | Same request planned twice with one idempotency key; grouping hashes and group payloads compared. | Rejected. Replay is deterministic and an idempotency collision with changed inputs fails closed. |
| Whole-video execution secretly requires caller-authored cues, leaves segment gaps, selects the first source, or returns metadata-only media. | `cues: []` whole-video fixture with three independently resolved ranges, cue-specific descriptors, decoded selected/processed/stem files, and segmentation QA. | Rejected. Source Music, no Music, and generated Music execute in one request; planned and executed coverage are exact, no gap or illegal overlap exists, Sound sync/technical/mix evidence is present, and every selected/processed/stem reference resolves to real private audio bytes. |
| “Crossfade” is one-source fade metadata or the receipt merely repeats requested curves. | Two distinct real WAV sources, 24-frame overlap, external 440/880 checks, and receipt-bound decoded spectral least-squares measurements at start/midpoint/end. | Rejected. The receipt proves source-specific dominance/presence, curve-share error, reconstruction correlation, duration, true peak, clipping, route/profile, parameter hashes, and two-source lineage. |
| A stale, missing, duplicated, unauthorized, malformed, or weakly evidenced crossfade is accepted. | Missing right source, same source twice, stale source/Music/Sound manifests, stale route hash, missing approval, malformed curves, out-of-authority overlap, excessive overlap, and self-consistent receipt/evidence tampering. | Rejected in every case before usable output authority is returned. |
| Duck attack/release values are labels and the audio jumps instantly. | Receipt-bound decoded pre-baseline, attack, hold, release, and post-baseline windows plus exact frame/sample counts. | Rejected. The range-envelope mode records requested attenuation and frames, applied frame segments, measured ramps, hold attenuation, and return-to-baseline; zero-length ramps, reversed ranges, and stripped evidence are rejected. |
| Music accepts a Sound receipt even when a requested parameter was ignored. | Per-operation requested/compiled/applied records for all 17 one-source operations: trim/cut, fade, gain, normalization, loop, resample, channel conversion, time stretch, pitch shift, placement, ducking, EQ, dynamics, pan, stem rendering, and technical QA. | Rejected. Music validates each operation identity, exact expected parameters, profile, route, range, source/output lineage, measured evidence class, and receipt hash. Crossfade remains isolated on the two-source boundary. |
| Receipt fields can be edited without detection. | Original seven field attacks, one requested-parameter mutation for every one-source operation, execution-evidence mutation, exact-route substitution, and removal of duck-ramp, pan-channel, and loudness/peak evidence with recomputed hashes. | Rejected in all 29 cases. |
| Public Sound semantics were silently expanded while the v1 route and receipt identities stayed unchanged. | Historical v1 constants/routes compared with current request, result, route, profile, manifest, and Music dependency identities. | Rejected. Active Music support now uses `sound.music_technical_automation.v2`, `sound.music_two_source_crossfade.v2`, v2 receipts/profiles/routes, Sound `4.3.0`, and Music `3.3.0`; exact hashes are publication-validated. |
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
