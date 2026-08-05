# Canonical Music standalone closure report

Date: 2026-08-04

Branch: `codex/canonical-music-skill`

Canonical Sound base: `0eef00d247b040168cf48a8c00a039954fb8595a`

Status: `standalone_skill_complete`, `orchestra_ready`,
`orchestra_integration_pending_by_design`,
`live_music_provider_activation_pending_external_evidence`

## Published identity

- Skill key: `music`
- Skill version: `2.0.0`
- Contract: `music.skill_contract.v2`
- Manifest hash:
  `8dbc3246016c5109652d91510ae30670e078e0c0c9f7cdc95776afaa21b6d3e6`
- Top-level qualification: `planning_qualified`
- Capability entries: 35
- Internal mini-skills: 41
- Tool manifests: 8
- Exact immutable routes: 31
- Fixture-executable jobs with exact acceptance evidence: 26
- Private-internal executable jobs with exact acceptance evidence: 24
- Production-qualified jobs: 0

The top-level status is deliberately the lowest honest composite status. Real
private local operations remain `internal_execution_qualified`; injected Lyria
remains fixture evidence; live provider execution and all production execution
remain blocked. The capability-mode matrix derives execution status only when
an exact route qualification and a concrete acceptance-evidence registry entry
both exist.

## Canonical architecture

| Boundary | Canonical location |
|---|---|
| Neutral shared skill kernel | `server/edit-skills/core/` |
| Shared skill registry | `server/edit-skills/registry.ts` |
| Music department | `server/edit-skills/music/` and `server/music/` |
| Public Music service and sole public barrel | `server/edit-skills/music/canonical-music-skill-service.ts`, `server/edit-skills/music/index.ts` |
| Request, result, artifacts, rights and handoff contracts | `server/music/music-contracts.ts` |
| Capability manifest | `server/edit-skills/music/music-capability-manifest.ts` |
| Per-mode matrix | `server/edit-skills/music/music-capability-mode-matrix.ts` |
| Acceptance evidence registry | `server/edit-skills/music/music-acceptance-evidence-registry.ts` |
| Mini-skill registry | `server/edit-skills/music/music-mini-skill-registry.ts` |
| Tool registry | `server/music/music-tool-capability-manifests.ts` |
| Route registry | `server/music/music-tool-routes.ts` |
| Publication validator | `server/edit-skills/music/music-publication-validation.ts` |
| Execution graph | `server/edit-skills/music/music-execution-graph.ts` |
| Route executor | `server/edit-skills/music/music-route-executor.ts` |
| Operation handlers | `server/edit-skills/music/music-operation-handler-registry.ts` |
| Scope guard | `server/music/music-scope-guard.ts` |
| Supervision | `server/music/music-supervision.ts` |
| Audio analysis | `server/music/music-analysis.ts` |
| Immutable Music rate card | `server/music/music-rate-card.ts` |
| Context/evidence resolver | `server/music/music-context.ts` |
| MusicSync | `server/music/music-sync.ts` |
| Music QA | `server/music/music-qa.ts` |
| Sound v4 port | `server/music/music-sound-support-port.ts` |
| Lyria adapter and profile | `server/music/lyria-provider.ts` |
| Lyria live transport | `server/music/lyria-live-transport.ts` |
| Final handoff builder | `server/music/music-contracts.ts` |
| Legacy adapter | `server/edit-skills/music/music-legacy-compatibility-adapter.ts` |
| UI projection | `server/edit-skills/music/music-ui-projection.ts`, `src/components/editor/music/MusicPlanChatFlow.tsx` |

Music is registered beside B-roll and Sound through the same schema, hashing,
qualification vocabulary, validator, and registry. No Music-local generic
kernel and no Sound-created Orchestra facade were introduced.

## Department implementation

The service owns request validation, admission, scope enforcement, versioned
context resolution, autonomous structured context study, Music-need and silence decisions, narrative arc, exact cue sheet,
per-cue acquisition, provider lifecycle, independent candidate analysis and
selection, MusicSync, creative editorial and mix intent, public Sound v4
delegation, actual-output QA, whole-video continuity, localized revision, and
final handoff.

Professional source order is enforced per cue: preserve source, user upload,
project library, workspace library, approved internal library, original
generation, then no Music. Library execution requires a real private artifact
and exact rights binding; no fake library record is accepted. No-Music and
ambience-only are real typed routes. Ambience-only produces a bounded Sound
requirement and never lets Music generate non-musical ambience.

Supervision separates measured, structured, user-declared, inferred, and
review-required evidence. It protects speech, natural ambience, emotional
silence and breathing room; creates soundtrack arcs and motif plans; detects
over-scoring; and never treats location or one mood label as genre authority.
Lake Como and legacy keyword mappings are fixture-only.

All authoritative timing uses the shared rational rate and exact frames.
Frame/sample conversion and explicit half-up rounding passed 24/1, 25/1,
30000/1001, 30/1, 50/1, 60000/1001 and 60/1, including a long-duration drift
test. No canonical path silently assumes 30 FPS or uses seconds as write
authority.

## Rights and provenance

Source, user, project, workspace, internal, reference and generated assets bind
exact ID, version, checksum, private object ID and source-specific rights.
User uploads remain user media and cannot be auto-promoted. Generated outputs
default to `project_only`. Reference Music is study-only, with explicit
no-melody, no-hook, no-lyric, no-artist-imitation and no-recognizable-arrangement
rules. The system does not claim legal copyright clearance.

## Lyria 3

The frozen profile is `music.provider.google_lyria_3_pro_preview.v2`, using
`lyria-3-pro-preview` and the documented global `v1beta1` Interactions endpoint.
It sets `store=false` and `background=false`, accepts the documented audio/mpeg
output, privately ingests it, and never exposes credentials or provider URLs as
artifact authority.

Injected transport returns real private WAV bytes. The canonical graph independently
ingests, decodes, measures and QA-checks three candidates, selects candidate 2
by evidence rather than array order, delegates the selected asset through Sound
v4 and creates the final handoff. Provider attempts bind immutable execution
fingerprints, and unknown outcomes reconcile before replay. A changed request
cannot reuse an idempotency key silently.

The controlled canary is `npm run canary:music:lyria`. It uses Application
Default Credentials only after explicit account, privacy, retention,
commercial, rate, runtime, project and confirmation gates pass. CI proves the
fail-closed path and never reads credentials or makes a provider call.

Live activation remains blocked until those gates plus a successful private
canary and generated-output QA evidence exist. Fixture evidence does not
promote production qualification.

## Sound v4 collaboration

Music depends only on the injected `MusicSoundSupportPort`. The production
adapter calls the canonical Sound v4 public service and binds Sound version
`4.0.0`, contract `sound.skill_contract.v4`, and manifest hash
`e971a332f814a4cf74a48700358f192b5f9696f5ee79c27f472cd53a6bec67a2`.

The delegated request carries the Music manifest, parent request, cue, exact
range, selected asset, rational rate, exact operation parameters and their hash,
protected speech, approval, cost ceiling and idempotency. Music validates the
Sound request hash, caller receipt, route, artifact lineage, range, operation
parameters, QA and cost evidence; Sound mutation receipts determine actual
Music mutation ranges. Nested Sound costs remain separate and are not
double-counted.
The ancestor chain blocks Music→Sound→Music cycles. Music never imports FFmpeg,
Sound route-executor, Mirelo, file-path or provider internals.

## QA, continuity and revision

Planning, technical, structural/MusicSync, speech safety, narrative fit,
vocal/lyric, reference/copy-risk, culture/stereotype, soundtrack continuity,
provenance and integration QA are separate. Technical checks decode actual
audio and measure duration, sample rate, channels, loudness, true peak,
clipping, silence and checksum. Speech safety uses exact overlap windows and
measured Sound receipts. Subjective emotional, originality, cultural,
advanced-harmonic, vocal-certainty and legal judgments remain confidence-scored
or review-required.

The executable whole-video pass preserves bounded writes while reading wider
context. Its continuity report covers cue families, energy, speech and ambience
priority, silence, repetition, cue density, boundaries, loudness and Music/SFX
collisions. Localized revision preserves unaffected artifact hashes and Sound
receipts, reruns only affected Music/Sound work and affected/neighboring QA, and
publishes an updated handoff.

## Legacy and UI closure

The migration inventory is in `docs/music/canonical-music-migration-inventory.md`.
Useful legacy planning concepts were adapted. `SOUND_MUSIC_AUDIO`, legacy
Music Director/provider workers, mock QA and UI state no longer own runtime
execution. The compatibility adapter is planning-only and cannot select tools,
call a provider, dispatch a worker, bypass scope/rights/approval/cost/QA, or
create a final handoff.

The editor renders a read-only projection of canonical Music artifacts. It has
no fake timers, provider calls, local approval authority or invented QA pass.
The empty state explicitly says it is waiting for canonical artifacts. No
database migration was added; the historical Music SQL remains domain
inventory, not executable production history.

## Acceptance and validation

The aggregate command is `npm run test:music-acceptance`. It runs Music,
shared-kernel, B-roll and canonical Sound v4 regressions. The dedicated workflow
is `.github/workflows/canonical-music-acceptance.yml`.

Local closure commands and results:

| Command | Result |
|---|---|
| `npm run test:music-acceptance` | passed |
| `npm run test:sound-acceptance` | passed within aggregate and independently; Sound remained `4.0.0` with manifest `e971a332f814a4cf74a48700358f192b5f9696f5ee79c27f472cd53a6bec67a2` |
| `npm run test:edit-skill-capability-kernel` | passed |
| `npm run test:b-roll-capability-manifest` | passed |
| `npm run validate:skill-capability-manifests` | passed, 3 manifests |
| `npm run typecheck:server` | passed |
| `npm run lint` | passed |
| `npm run build` | passed |
| `npm run qa:canonical-music-ui` | passed, Chromium 1/1 |
| `npm run check:secrets` | passed, no secret values printed |
| `npm run check:frontend-boundary` | passed |
| `npm run smoke:private-local-persistence` | passed |
| `npm run smoke:runtime-api-security` | passed |
| `npm run smoke:error-provider-confidentiality` | passed |
| `npm run audit:prod:high` | passed, 0 vulnerabilities |
| `git diff --check` | passed |
| `git diff --cached --check` | passed before final commit |

Key evidence includes real private audio bytes, per-candidate decode and
analysis, private file mode `0600`, create-only idempotent ingest, exact route
and operation receipts, actual Sound v4 artifacts, exact mutation ranges,
measured QA, partial-failure preservation, revision lineage, and typed
non-Music handoffs.

## Definition-of-Done evaluation

All 137 requested statements were evaluated against source, publication
validation, acceptance evidence and the command matrix:

- Items 1–16: one service/kernel/manifest/registry/route system and future
  caller contracts — satisfied; actual Orchestra pending by design.
- Items 17–22: exact authority and rational timing — satisfied.
- Items 23–42: study-first supervision, need/silence/ambience, source order,
  cue-local decisions, arc, motif and continuity — satisfied.
- Items 43–51: upload/reference rights, project-only reuse and review-aware
  vocal/culture rules — satisfied.
- Items 52–62: provider-neutral brief, current Lyria profile, server-only
  fail-closed provider and idempotent reconciliation — satisfied at fixture
  qualification; live evidence intentionally pending.
- Items 63–79: all-candidate real-byte processing, measured analysis,
  frame-accurate MusicSync and exact editorial specifications — satisfied.
- Items 80–92: public Sound v4 boundary, exact nested authority/cost and honest
  multi-class QA — satisfied.
- Items 93–102: bounded whole-video pass, partial success, localized revision,
  real/existing/no-Music/ambience handoffs — satisfied.
- Items 103–110: ownership and legacy retirement — satisfied; final
  mux/render/export/delivery/publishing remain outside Music.
- Items 111–118: complete acceptance matrix and honest derived qualification —
  satisfied; production and live provider stay blocked.
- Items 119–129: local acceptance, regressions, type/lint/build/security and
  diff validation — satisfied.
- Items 130–137: dedicated CI is installed; pushed SHA parity, clean worktree,
  and the final workflow result are release gates verified after this report is
  committed and pushed. No Head of Orchestra or other top-level skill was
  implemented.

## Milestone history

- `a1f025688` — `docs(music): freeze canonical migration inventory`
- `0cf7f945d` — `feat(music): establish canonical skill foundation`
- `fffaa3036` — `feat(music): execute canonical department end to end`
- `565aa0812` — `refactor(music): retire legacy runtime authority`
- `908f0ea32` — `test(music): qualify standalone closure and ci`
- `09de35a6f` — `docs(music): freeze v2 closure migration`
- `51ba85f50` — `feat(music): publish canonical v2 execution boundary`
- `72f5aa810` — `feat(music): enforce autonomous context and Sound receipts`
- `5ed762921` — `fix(music): bind estimates rights and provider replay`
- `9df975489` — `refactor(music): seal canonical public boundary`
- Final closure-evidence commit — updates this v2 report after all local gates.

Music is safe to close because its public boundary, internal execution,
authority, real artifacts, Sound v4 collaboration, QA, revision, handoff,
qualification and regression evidence now agree. The remaining work is an
intentional external activation/global-integration boundary, not an incomplete
Music implementation.
