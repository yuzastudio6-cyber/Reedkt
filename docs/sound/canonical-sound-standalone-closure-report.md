# Canonical Sound standalone closure report

Status date: 2026-08-04

Skill state: `standalone_skill_complete`, `orchestra_ready`, `orchestra_integration_pending_by_design`

Provider state: `mirelo_live_activation_pending_external_evidence`

## Canonical boundaries

- Shared skill kernel: `server/edit-skills/core/`
- Shared registry: `server/edit-skills/registry.ts`
- Sound skill: `server/edit-skills/sound/` and `server/sound/`
- Stable invocation service: `server/edit-skills/sound/canonical-sound-skill-service.ts`
- Composite graph: `server/edit-skills/sound/sound-execution-graph.ts`
- Sound route executor: `server/edit-skills/sound/sound-route-executor.ts`
- Exact handler registry: `server/edit-skills/sound/sound-operation-handler-registry.ts`
- Capability/mode matrix: `server/edit-skills/sound/sound-capability-mode-matrix.ts`
- Route publication gate: `server/edit-skills/sound/sound-publication-validation.ts`
- Exact rational timebase: `server/edit-skills/core/timeline-rate.ts`
- Bounded visual proxy: `server/sound/sound-bounded-visual-proxy.ts`
- Local audio/mix processor: `server/sound/sound-local-audio-processor.ts`
- Output QA: `server/sound/sound-execution-qa.ts`
- Whole-video continuity: `server/sound/sound-continuity.ts`

The former Sound-created generic framework under `server/orchestra/` and
`src/types/skill-capability-manifest.ts` remains retired. The repository contains no
Sound-owned implementation of the real Head of Orchestra.

## Published identity and qualification

- Skill key: `sound`
- Skill version: `4.0.0`
- Contract version: `sound.skill_contract.v4`
- Manifest hash: `e971a332f814a4cf74a48700358f192b5f9696f5ee79c27f472cd53a6bec67a2`
- Capability entries: 39
- Mini-skills: 19
- Tool capability manifests loaded by Sound publication: 24
- Route manifests: 19 at immutable route version `4.0.0`
- Top-level qualification: `planning_qualified`

Version 4 is a new immutable publication; version 3 was not edited in place. The top-level
qualification remains intentionally bounded by creative/perceptual planning capabilities
and Mirelo fixture evidence. Deterministic private-local operations are
`internal_execution_qualified`; Mirelo execution is fixture-only; MMAudio remains
`blocked`; perceptual naturalness, material realism, emotional fit, advanced room matching,
and professional listening judgment remain `needs_review` without qualified evidence.

## Standalone execution

The Sound-owned service performs admission, context loading, Sound study/design,
per-cue acquisition selection, exact child-route admission, topological execution,
private artifact creation, synchronization, contextual mix rendering, measured QA,
authority validation, caller receipts, executed localized revision, and terminal handoff.
The future Orchestra does not need provider payloads, FFmpeg arguments, paths, credentials,
candidate-ranking internals, or Sound QA internals.

Composite execution supports exact source-preservation, internal-library/project extraction,
Mirelo fixture generation, mixed acquisition choices, multiple cues, multiple ranges, peer
support, and whole-video assignments. Acquisition outputs flow into range-bound stems and
terminal QA/handoff units. A failed unit preserves independent success and blocks only
dependent units; unknown provider outcomes cannot be blindly retried.

Every completed step has a real invocation receipt, elapsed time, operation-spec hash,
named-output bundle, output IDs/hashes, and evidence references. Completed results require
exact terminal private artifact references; no-Sound is an explicit typed outcome.

## Media, timing, mixing, and QA

Real private media execution covers study, extraction, trim, fade, gain, normalization,
resampling, channel conversion, looping, time stretch, pitch shift, gentle cleanup, noise
reduction, synchronization, mixing, stem creation, and QA. Sources remain immutable and
unsafe paths/arguments are rejected.

The exact rational rate is bound through requests, approved timeline manifests, operation
specifications, artifacts, SoundSync placements, proxies, fades, ducking, tails, and QA.
Coverage includes `24/1`, `25/1`, `30000/1001`, `30/1`, `50/1`, `60000/1001`, and `60/1`
without an authoritative decimal-FPS fallback.

Mix rendering applies bounded base gain, gain envelopes, fades, protected-speech ducking,
attack/release, Music collision policy, EQ, dynamics, pan, perspective, room treatment, and
headroom. Technical, sync, mix, continuity, provenance, and integration QA operate on real
outputs where execution qualification is claimed. Perceptual/material checks remain
needs-review.

Whole-video continuity produces structured scene/range, environment, ambience, dialogue,
Music, perspective, cue-density, repetition, boundary, intentional-silence, loudness,
dependency, and localized-revision findings while preserving bounded write authority.

## Mirelo and visual privacy

Injected Mirelo text/video execution uses the same canonical service, route graph, attempt
lifecycle, private ingest, candidate processing, ranking, and QA boundaries intended for
future live transport. Video-conditioned execution uses the real bounded private proxy.
The proxy is range/hash/version/rate-bound, private, idempotent, source-immutable, and strips
source audio by default. Provider carrier visuals are rejected and cannot replace approved
visuals; durable provider URLs and secrets are not result authority.

Live Mirelo qualification still requires an approved commercial account, privacy and
retention approval, account-specific rate conversion, deployed private runtime, quota and
reconciliation evidence, a controlled private canary, and generated-output QA. No paid live
call or production canary is claimed.

## Ownership and retirement

Typed Head and peer callers receive capability views and submit bounded Sound requests;
they cannot invoke Sound tools, supply provider payloads, dispatch workers, or expand
authority. SoundSync is an internal mini-skill. Music context is read-only, and Sound does
not compose or own Music. Final mux, render, export, delivery, and publishing remain outside
Sound. The single legacy adapter is planning-only and cannot bypass the shared manifest,
scope guard, canonical service, route admission, or approved operation profiles.

## Acceptance and CI

`npm run test:sound-acceptance` is the canonical aggregate. It validates the shared kernel,
B-roll compatibility, all Sound publications/routes, local media, Mirelo fixtures, legacy
retirement, end-to-end behavior, final-closure regressions, execution integrity, and all 39
job contracts. A dedicated `Canonical Sound Acceptance` GitHub Actions workflow installs
FFmpeg and runs the aggregate plus server typecheck, lint, build, and secret checks on Sound
changes.

Actual Orchestra integration remains pending by design: global discovery/selection, global
work-graph construction, persistence, scheduling, approval coordination, credit aggregation,
cross-skill conflict resolution, and final-composition coordination belong to the future
Head of Orchestra.
