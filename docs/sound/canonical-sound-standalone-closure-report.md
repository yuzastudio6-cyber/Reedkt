# Canonical Sound standalone closure report

Status date: 2026-08-04

Skill state: `standalone_skill_complete`, `orchestra_ready`, `orchestra_integration_pending_by_design`

Provider state: `mirelo_live_activation_pending_external_evidence`

## Canonical boundaries

- Shared skill kernel: `server/edit-skills/core/`
- Shared registry: `server/edit-skills/registry.ts`
- Sound skill: `server/edit-skills/sound/` plus Sound-owned implementations in `server/sound/`
- Stable invocation service: `server/edit-skills/sound/canonical-sound-skill-service.ts`
- Sound route executor: `server/edit-skills/sound/sound-route-executor.ts`
- Exact route publication gate: `server/edit-skills/sound/sound-publication-validation.ts`
- Exact rational timebase: `server/edit-skills/core/timeline-rate.ts`
- Bounded visual proxy: `server/sound/sound-bounded-visual-proxy.ts`
- Output QA: `server/sound/sound-execution-qa.ts`
- Whole-video continuity: `server/sound/sound-continuity.ts`

The former Sound-created generic framework under `server/orchestra/` and `src/types/skill-capability-manifest.ts` is retired. The repository contains no Sound-owned implementation of the real Head of Orchestra.

## Published identity

- Skill key: `sound`
- Skill version: `3.0.0`
- Contract version: `sound.skill_contract.v3`
- Capability entries: 39
- Mini-skills: 19
- Tool manifests: 24
- Route manifests: 19, each at route version `3.0.0`
- Top-level qualification: `planning_qualified`

The top-level qualification is intentionally bounded by planning-only creative/perceptual capabilities and Mirelo fixture evidence. Deterministic private-local operations separately derive `internal_execution_qualified`; MMAudio is `blocked`; material realism, acoustic naturalness, advanced room matching, emotional fit, and professional perceptual judgment remain `needs_review` without an evidence-backed evaluator.

Version 3 is a new immutable publication for the execution-integrity closure. It adds the
typed per-unit operation graph, operation handler registry, exact mutation and placement
receipts, multi-cue/provider execution, partial-failure accounting, decoded mix evidence,
and a separate deterministic ambience-extension route. Published version 2 was not edited
in place.

## Execution evidence

The same Sound-owned service performs capability admission, context loading, planning,
per-cue/per-range graph compilation, route selection, execution admission, dependency-driven
bounded route execution, private artifact creation, synchronization, contextual mix
automation, output QA, authority validation, caller receipt, and final-composition handoff.

Every completed route step now has actual handler invocation evidence, start/completion
timestamps, measured elapsed time, exact output IDs/hashes, the compiled operation-spec
hash, and an operation-receipt hash. Skipped and failed steps cannot present completion
receipts. Exact modified ranges are the union of successful mutation receipts, not the
request's entire authority envelope.

Real private media tests cover study, extraction, trim, fade, gain, normalization, resampling, channel conversion, looping, time stretch, pitch shift, gentle cleanup, noise reduction, synchronization, mixing, stem creation, and QA. Output artifacts are decoded and measured for duration, sample rate, channels, clipping, true peak, loudness, checksums, and source immutability.

Exact-rate coverage includes `24/1`, `25/1`, `30000/1001`, `30/1`, `50/1`, `60000/1001`, and `60/1`. Tests cover long-duration conversion without accumulated frame drift, artifact duration, cue lead/tail, hit anchors, fades, ducking attack/release, proxy extraction, and rate mismatch rejection.

The bounded visual proxy executes a fixed allowlisted FFmpeg profile. It verifies source path, version, visual hash, checksum, range, handles, exact rate, output media, checksum, permissions, source immutability, and idempotent replay. It removes source audio and rejects traversal, symlinks, source overwrite, unauthorized ranges, hash mismatches, and rate mismatches. Provider-returned visual media never replaces the approved visual.

Injected Mirelo text and video tests execute through the canonical service and production-shaped route graph. Separate adapter tests cover official-profile request shape, preflight, private ingest, carrier audio extraction, provider visual rejection, timeouts, provider failures, unknown outcomes, reconciliation, no blind resubmission, hostile URL rejection, idempotency, cost evidence, and secret/URL non-persistence.

## Ownership and compatibility

Sound accepts typed Head and peer assignments with exact read/write authority. Peer callers cannot select tools, build provider payloads, supply executable arguments, dispatch workers, or expand authority. Sound may read whole-video context while mutating only assigned audio ranges. Visual mutation remains empty unless a separate approved visual proposal is routed outside Sound.

SoundSync is an internal mini-skill. Music context is read-only; composition and Music ownership are excluded. Final mux, render, export, delivery, and publishing remain outside Sound. The single legacy compatibility adapter emits planning-only canonical request seeds and routes legacy Music intent to the future Music skill; it has no provider, worker, route-executor, proxy, or local-media execution access.

## External activation requirements

Mirelo production qualification requires a live private canary, approved commercial account, approved privacy and retention treatment, verified account-specific rate conversion, deployed worker/runtime evidence, quota and reconciliation evidence, and real generated-output QA. Production FFmpeg execution also requires the approved deployable LGPL build/configuration and deployed runtime evidence. New evidence must publish new immutable versions; it cannot mutate `3.0.0` in place.

Global skill discovery, global work-graph construction, persistence, scheduling, approval coordination, credit aggregation, cross-skill conflict resolution, and final composition coordination are intentionally reserved for the future Head of Orchestra.

## Final acceptance evidence

The closure was validated locally on 2026-08-04 with:

- `npm run test:sound-acceptance` — passed all canonical Sound smokes, the execution-integrity regression suite, and all 39 declared job contracts (28 executable, 11 explicitly planning-only);
- `npm run test:edit-skill-capability-kernel` — passed the neutral shared-kernel regression;
- `npm run test:b-roll-capability-manifest` — passed the cross-skill shared-kernel regression;
- `npm run typecheck:server` — passed;
- `npm run lint` — passed;
- `npm run build` — passed with the repository's existing chunk-size and ineffective-dynamic-import warnings;
- `npm run check:secrets` and `npm run check:frontend-boundary` — passed;
- `git diff --check` — passed.

No live Mirelo request, paid provider call, CI workflow, deployment, or canary was run. Mirelo remains fixture-qualified and fail-closed for live activation without the external evidence listed above.
