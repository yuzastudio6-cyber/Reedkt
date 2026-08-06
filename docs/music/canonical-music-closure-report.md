# Canonical Music v3.2 standalone closure report

Date: 2026-08-06

Branch: `codex/canonical-music-skill`

Status: `standalone_skill_complete`, `orchestra_ready`,
`orchestra_integration_pending_by_design`,
`live_music_provider_private_canary_verified`,
`live_music_provider_production_activation_pending_canonical_runtime_integration`

## Published identity and qualification

- Skill key/version: `music` / `3.2.0`
- Contract: `music.skill_contract.v3`
- Manifest hash: `e7497e4c3297d8505f77d1454aa17cea741ad4ad7bc49601113a46d858013043`
- Top-level qualification: `planning_qualified`
- Capability entries / supported jobs: 35
- Internal mini-skills: 42
- Tool capability manifests: 10
- Exact immutable routes: 33
- Exact fixture-executable direct jobs: 4
- Exact private-internal executable direct jobs: 8
- Production-qualified jobs: 0

The top-level status is intentionally the lowest honest composite status. Deterministic private
operations remain internally qualified, injected Lyria remains fixture evidence, and a real
deployed private Lyria canary is now verified. Subjective professional judgments remain
confidence-scored or review-required, while production route promotion remains blocked until the
canonical product runtime supplies all exact durable execution evidence. Each supported job has a
unique planning evidence record. Direct
execution qualification exists only where an exact job/mode test binds the request, capability,
route, handler, inputs, outputs, assertions, and result-evidence hash.

## Canonical locations

| Boundary | Location |
|---|---|
| Neutral shared skill kernel | `server/edit-skills/core/` |
| Shared skill registry | `server/edit-skills/registry.ts` |
| Music skill | `server/edit-skills/music/`, `server/music/` |
| Public Music service | `server/edit-skills/music/canonical-music-skill-service.ts` |
| Request/result/artifact/rights/handoff contracts | `server/music/music-contracts.ts` |
| Capability manifest | `server/edit-skills/music/music-capability-manifest.ts` |
| Per-mode acceptance matrix | `server/edit-skills/music/music-capability-mode-matrix.ts` |
| Exact acceptance evidence | `server/edit-skills/music/music-acceptance-evidence-registry.ts` |
| Mini-skill registry | `server/edit-skills/music/music-mini-skill-registry.ts` |
| Tool registry | `server/music/music-tool-capability-manifests.ts` |
| Route registry | `server/music/music-tool-routes.ts` |
| Publication validator | `server/edit-skills/music/music-publication-validation.ts` |
| Execution graph | `server/edit-skills/music/music-execution-graph.ts` |
| Route executor / handler registry | `server/edit-skills/music/music-route-executor.ts`, `music-operation-handler-registry.ts` |
| Supervision / segmentation | `server/music/music-supervision.ts` |
| Audio analysis / professional matching | `server/music/music-analysis.ts`, `music-asset-matcher.ts` |
| MusicSync | `server/music/music-sync.ts` |
| Music QA and continuity | `server/music/music-qa.ts` |
| Sound public port | `server/music/music-sound-support-port.ts` |
| Lyria provider | `server/music/lyria-provider.ts`, `music/lyria-live-transport.ts` |
| Legacy boundary | `server/edit-skills/music/music-legacy-compatibility-adapter.ts` |
| Read-only UI projection | `server/edit-skills/music/music-ui-projection.ts`, `src/components/editor/music/MusicPlanChatFlow.tsx` |

Music registers beside B-roll and Sound through the same shared schema, registry, immutable hash,
qualification vocabulary, assignment/plan/result envelopes, estimators, invalidation, revision,
and publication validator. It introduces neither a Music-local generic kernel nor a Head of
Orchestra facade.

Music `3.2.0` publishes `music_cue_constraint_resolution_v3` through
`music.route.plan.cue_sheet.v3@3.2.0` and publishes
`music_acceptance_receipt_v3` as a canonical public-service output. Both are
immutable artifact envelopes rather than unregistered result-only structures.

## Professional department and authority

The public service owns validation, admission, exact scope, context resolution, study-first Music
supervision, Music-need and silence decisions, atomic soundtrack segmentation, professional cue
grouping, cue-constraint resolution, narrative arc, exact cue sheet, cue-local acquisition, provider attempts, candidate
analysis/selection, MusicSync, creative editorial and mix intent, Sound delegation, QA, continuity,
localized revision, and final handoff.

Every authorized write range is covered by exact, non-overlapping atomic segments derived from
scene, speech, silence, ambience, transition, chapter, locked-range, and cue-constraint boundaries.
Those atomic planning segments are not treated as final cues. The versioned grouping stage merges
compatible adjacent segments, reuses continuity families, removes weak decorative scoring where
policy permits, and hard-enforces both the approved cue count and cue-change density. An impossible
policy produces a typed conflict and blocked result rather than a warning-only over-scored plan.
Whole-video context inspection never expands Music write authority. Fully/range/creative-field
locked cues and soft/advisory cues are resolved by typed receipts. Visual timing is never mutated;
Music returns a proposal instead.

Music can choose source Music, user upload, rights-bound project/workspace/internal library Music,
original generation, hybrid treatment, ambience-only, intentional silence, or no Music. It does
not generate merely because no upload exists. Location, culture, and one mood label never directly
select genre or instrumentation; Lake Como remains a fixture only.

## Timing, MusicSync, and editorial

All authority uses the shared rational frame rate and exact frames/samples with explicit rounding.
Acceptance covers 24/1, 25/1, 30000/1001, 30/1, 50/1, 60000/1001, and 60/1 plus long-duration
round trips without accumulated drift. No canonical path silently assumes 30 FPS or uses seconds
as mutation authority.

MusicSync evaluates measured beat, downbeat, phrase, and section boundaries against every supplied
target anchor. Its decision records all evaluated source/target alignments, rejects out-of-authority
entries and unsafe short sections, supports bounded handle shifts and intentional off-beat/free-time
placement, and never changes picture timing. The arrangement editor produces an exact creative edit
specification; Sound performs the byte mutation.

## Rights, matching, reference DNA, and assets

Actual source/upload/project/workspace/internal candidates are independently decoded and compared
on rights, project/workspace/platform scope, duration, speech safety, vocal policy, measured tempo,
structure, energy, ending, loop, motif, provenance, and review risk. Rights are hard gates and input
order cannot select the winner. A library route remains blocked when no real authorized artifact
exists; no fake catalog item is created.

User uploads remain user media and are never automatically promoted. Generated output defaults to
`project_only`. Reference Music remains study-only and separates measured, inferred, declared, and
review-required evidence. Do-not-copy rules cover melody, lyric, hook, artist imitation, recognizable
arrangement, exact timing, and source reuse. No automatic legal copyright clearance is claimed.

## Lyria provider integrity

Profile `music.provider.google_lyria_3_pro_preview.v2` binds model
`lyria-3-pro-preview`, the global `v1beta1` Interactions endpoint, `store=false`, one audio output per
interaction, documented audio constraints, and the immutable Music rate card. Legacy Lyria names or
request fields do not authorize execution.

One cue-level attempt group creates one independent child provider interaction for each candidate.
Each child has a unique idempotency fingerprint, provider request ID, storage identity, checksum,
brief/prompt/snapshot/cue/ordinal binding, and revision identity. All returned candidates are
privately ingested, decoded, measured, QA-checked, and ranked independently. Unknown outcomes are
reconciled per child before retry; blind resubmission and automatic higher-cost fallback are blocked.

Injected transport returns real WAV fixture bytes through the same adapter and route graph used by
future live execution. Live mode requires the durable private attempt store and remains fail-closed
without account, privacy, retention, commercial, rate, deployed-runtime, project, confirmation, and
private-canary evidence. CI reads no credential and makes no provider call.

On 2026-08-05, the dedicated deployed private canary completed one real Lyria request from immutable
image digest `sha256:794791f9e4f7bb64b66c415f0d9d4e7ed0d74841923a21a4d86b499cfe41a36e`.
Execution `reeditpro-music-lyria-private-canary-w5nvh` returned a checksum-verified 1,476,245-byte
MP3, 61.257083 seconds, 44.1 kHz stereo, with provider cost USD 0.08 and `store=false`. Measured raw
output evidence included -12.9 LUFS, +0.1 dBTP, and 5,501 clipped samples; therefore the candidate
still requires canonical Sound processing and final measured QA. The live evidence is recorded in
`docs/music/canonical-music-lyria-live-canary-evidence-2026-08-05.md`. This verifies deployed live
transport without falsely promoting the immutable route or top-level Music capability to production
qualification.

## Canonical Sound 4.2 collaboration

Music imports only `MusicSoundSupportPort`. The production adapter calls canonical Sound skill
`4.2.0`, contract `sound.skill_contract.v4`, manifest
`84ed4074e718aff8c48a3af6b7f981dc3442672721e1a20f1fef4546e800e122`, capability
`sound.edit_music_technical_automation`, and exact route
`sound.route.edit.music_technical_automation.v1`.

The delegated request binds the Music version/manifest, parent request, cue, selected artifact,
rational rate, exact bounded range, complete technical parameters, protected speech/ambience,
approval, budget, reservation, and idempotency. Sound applies trim/cut/fade/crossfade/gain/
normalization/loop/resample/channel conversion/stretch/pitch/place/duck/EQ/dynamics/pan/stem/QA as
requested and returns parameter-specific per-operation requested/compiled/applied records and hashes,
source/output lineage, outputs, measured QA, mutation receipts,
route evidence, cost, and caller receipt. Music rejects mismatched hashes, missing outputs/QA, stale
manifests, or range escalation. Sound receipts determine actual Music mutation ranges. Nested Sound
cost stays separate and is not double-counted. The ancestor chain prevents Music→Sound→Music cycles.

The final receipt-integrity acceptance executes all 17 one-source operations
through this port and rejects 27 targeted mutations. Normalization requires
measured loudness and true peak, nonzero ducking requires measured attack and
release ramps, pan requires decoded channel-balance evidence, and a peak limiter
requires measured peak evidence. Crossfade cannot use this one-source boundary.

True two-source Music crossfade uses a separate typed public boundary and exact route
`sound.route.edit.music_two_source_crossfade.v1@1.0.0`. It binds two independently checksum-verified
private sources, exact source windows, overlap frames/samples, gain curves, authority, route/profile,
output hash, and measured overlap/peak/clipping QA. The generic one-source automation contract rejects
crossfade. Dialogue ducking now applies and measures exact frame-based attack, hold, and release ramps;
zero-length ramps and invalid protected ranges fail closed.

## Route truthfulness, QA, continuity, and revision

Every execution unit binds an immutable route/version/hash, operation-spec hash, handler, exact
inputs, dependencies, expected named outputs, failure policy, and idempotency key. Publication rejects
unknown routes, tools, handlers, schemas, inputs, outputs, conditions, stale hashes, unsupported jobs,
and unreachable final output. Runtime rejects undeclared produced output and missing required output.
Step receipts contain actual timestamps, elapsed time, inputs, named output bindings, lineage,
runtime evidence, cost, QA, provider attempt, and receipt hash; no total duration is fabricated across
steps.

Routes may contain multiple dependency-ordered steps. The executor performs a
cycle-safe topological pass and creates a distinct receipt and named outputs for
each step; the cue-sheet route proves both cue-sheet planning and exact
constraint-resolution publication.

QA is separated into planning, technical, structural/MusicSync, speech safety, narrative fit,
vocal/lyric, reference/copy risk, culture/stereotype, continuity, provenance, and integration classes.
It validates planned and executed atomic-segment coverage, constraint resolutions, actual decoded
candidate bytes, actual processed Sound outputs, exact applied parameter hashes, measured Sound
technical/sync/mix evidence, cue-to-track placement, track reuse/fatigue, silence, boundary behavior,
loudness continuity, and Music/SFX collision policy. Subjective emotional, originality, culture,
advanced harmonic, vocal-certainty, lyric, and legal findings remain review-aware.

Localized revision preserves byte-identical unaffected artifacts, provider attempts, hashes, and
Sound receipts; recompiles only invalidated cues; gives changed generated cues new attempts and
storage identities; reruns affected Sound/QA and neighboring continuity; and creates an updated
handoff. Partial failure preserves independent success.

## Final handoff, legacy, UI, and persistence

A completed Music handoff contains real approved selected/processed/stem references, exact
placements, MusicSync maps, mix intent, Sound receipts, QA, provenance, ranges, and review items.
Existing approved Music can be handed off without falsely claiming byte mutation. Typed no-Music and
ambience-only handoffs contain exact ranges and reasons and do not invent Music or non-musical
ambience. Final mux, render, export, delivery, and publishing remain outside Music.

`SOUND_MUSIC_AUDIO`, SoundSync-as-owner, keyword directors, fixed timing, metadata-estimated analysis,
mock providers/workers/orchestrators, mock QA, and UI local state have no execution authority. One
planning-only compatibility adapter cannot bypass scope, rights, approval, cost, route admission,
provider lifecycle, Sound, QA, or handoff. The UI is a read-only canonical artifact projection and
its Chromium acceptance test passes. No SQL migration was added; historical Music SQL remains domain
inventory only.

## Local acceptance record

| Command | Result |
|---|---|
| `npm run test:music-final-closure` | passed; six mandatory real-byte/grouping/receipt/manifest scenarios |
| `npm run test:music-acceptance` | passed; includes Music v3.2, Sound 4.2, shared kernel, and B-roll |
| `npm run test:sound-acceptance` | passed within aggregate |
| `npm run validate:skill-capability-manifests` | passed; 3 manifests |
| `npm run test:edit-skill-capability-kernel` | passed |
| `npm run test:b-roll-capability-manifest` | passed |
| `npm run typecheck:server` | passed |
| `npm run qa:canonical-music-ui` | passed; Chromium 1/1 |
| `npm run lint` | passed |
| `npm run build` | passed; non-blocking existing chunk-size/dynamic-import warnings only |
| `npm run check:secrets` | passed; 6,171 files, no secret values printed |
| `npm run check:frontend-boundary` | passed; 2,088 files |
| `npm run audit:prod:high` | passed; 0 vulnerabilities |
| `node database/canonical-v3-local/verify.mjs` | passed; 24 migrations / 227 files, remote mutation and production authority disabled |
| `git fsck --full` | passed after quarantining validated AppleDouble metadata sidecars; only pre-existing unreachable objects reported |
| `git diff --check`, `git diff --cached --check` | passed before closure commit |

The dedicated workflow is `.github/workflows/canonical-music-acceptance.yml`. It installs the exact
Node/media/browser runtime and repeats Music/Sound/kernel acceptance, UI QA, security boundaries,
typecheck, lint, build, and the production audit. Its pushed run is the final external release gate.

## Definition-of-Done evaluation

All 137 requested statements were evaluated against publication validation, source inspection,
exact acceptance records, real execution receipts, and the command matrix:

- 1–16: one public service, shared kernel, manifest, registries, Head/peer-shaped calls, and no
  competing framework — satisfied; actual Orchestra integration remains pending by design.
- 17–22: broad read/exact write authority and rational timing with no fixed-spacing, silent-30-FPS,
  or seconds-only execution path — satisfied.
- 23–42: study-first need/silence/ambience/source/generation decisions, cue-local acquisition,
  anti-keyword authority, exact cue sheets, arc, motif, density, and continuity — satisfied.
- 43–51: user/reference/generated rights, project-only defaults, measured/inferred/declared DNA,
  speech-bound vocals, and review-aware language/culture — satisfied.
- 52–62: provider-neutral brief, verified Lyria profile, server-only fail-closed live boundary,
  real fixture bytes, cue-specific idempotent attempts, reconciliation, and deployed private live
  canary — satisfied. Production-route promotion remains intentionally separate from canary proof.
- 63–79: independent candidates, order-independent selection, actual-byte audio analysis, measured
  loudness/peak/clipping/timing evidence, and anchor-driven MusicSync/editorial — satisfied.
- 80–92: public Sound 4.2 port only, exact delegated authority and cost, receipt-derived mutations,
  separated measured QA, and honest subjective/legal boundaries — satisfied.
- 93–102: bounded whole-video execution, partial success, localized revision, real/existing/
  no-Music/ambience handoffs — satisfied.
- 103–110: Music excludes mux/render/export/delivery/publishing and active legacy authority —
  satisfied; historical SQL remains undeployed inventory.
- 111–118: every supported job has exact matrix evidence; planning/blocked modes fail closed and
  top-level/route/mini-skill/live-provider qualifications remain honest — satisfied.
- 119–129: Music, Sound, kernel, B-roll, typecheck, lint, build, secrets, frontend boundary,
  production audit, and diff validation — satisfied locally.
- 130–137: dedicated CI exists; branch push, SHA parity, clean worktree, and hosted workflow result
  are final release gates verified after this report is committed. No Head of Orchestra or other
  top-level skill was implemented.

## Milestone commits

- `7144733a2` — capture v3 integrity gaps
- `81afa1b9d` — establish segmented Sound-bound execution
- `a8945b4ff` — qualify professional matching and anchor sync
- `6a121f3f9` — enforce truthful named route outputs
- `a7211a94a` — isolate provider candidates and revisions
- `80c979ab8` — bind exact acceptance and segmented QA
- `21ec35aca` — qualify non-route service boundaries honestly
- `9e4822cdc` — publish v3 standalone closure evidence
- `62ad251bb` — restore live Lyria canary and measured QA
- `250ceffb9` — make the private canary image readable
- `741772bfe` — package shared canary dependencies
- `3f1178621` — preserve safe Lyria rejection evidence
- `170bc13d0` — align live Lyria prompts with provider policy
- Live evidence commit — this report and immutable deployed canary record
- `9cbfd4af6` — close cue grouping and Sound execution integrity
- Final v3.1 acceptance evidence commit — first six focused regressions and CI wiring
- `07a0913cb` — complete operation tamper matrix, typed constraint/acceptance
  artifacts, negative publication attacks, and dependency-ordered route execution
- Final v3.2 closure-evidence commit — gap matrix, red-team audit, command record, and closure report

Music is safe to close because its public contract, manifest, route graph, handlers, real private
artifacts, rights, exact timing, Sound collaboration, measured QA, localized revision, final handoff,
qualification, and acceptance evidence now agree. Live provider transport is verified from the
deployed private canary; production product routing and global Orchestra integration remain explicit
runtime/design boundaries and cannot bypass canonical Music/Sound admission or QA. No other top-level
skill was started.
