# Canonical Sound tool-capability registry

Status: implemented and fixture/private-internal qualified where stated. This is not a production-activation claim.

## Purpose

The Head of Orchestra needs a machine-readable answer to four different questions:

1. `SkillCapabilityManifest`: what the Sound department can own or support.
2. `SkillCapabilityEntry`: whether Sound can handle one exact job, scope, caller, phase, and execution mode.
3. `SoundToolRouteManifest`: which ordered or dependency-bound route can deliver that job.
4. `ToolCapabilityManifest`: which exact operation each underlying tool can perform safely.

The Orchestra assigns work to `sound`; peer skills request a Sound capability. Neither the Orchestra nor peer skills receive credentials, provider payloads, executable names, arguments, or direct tool-dispatch authority. The Sound controller chooses and admits a route, and a worker receives exactly one qualified operation package.

## Shared manifest contract

The generic immutable contract is implemented in:

- `server/tool-registry/tool-capability-manifest-types.ts`
- `server/tool-registry/tool-capability-manifest-registry.ts`
- `server/tool-registry/tool-runtime-status-registry.ts`

Every `ToolCapabilityManifest` includes identity and version hashes; tool and operation class; supported and unsupported jobs; execution boundary; per-operation input, artifact, media, mutation, security, privacy, execution, cost, attempt, QA, invalidation, evidence, and limitation fields; and per-mode qualification.

Published manifests are schema-validated, canonically serialized, SHA-256 hashed, deeply frozen, and immutable for an existing `(toolKey, toolVersion)`. A changed contract must publish a new version.

Operation qualification is authoritative. A tool with one private-qualified operation and one planning-only operation does not make the planning-only operation executable.

## Qualification, availability, and admission

These states are deliberately separate:

- Qualification is immutable evidence attached to a tool operation or route version.
- Availability is a mutable runtime observation: installed version, credential presence, health, quota, concurrency, and canary reference.
- Admission is a per-request decision over qualification, availability, exact inputs, scope, budget, rate card, license evidence, and QA readiness.

An available but unqualified tool is denied. A qualified but unavailable tool is denied. Production execution requires `production_qualified`; fixture and private-internal evidence never upgrades itself into production evidence.

## Canonical tool inventory

| Tool key | Version | Current highest status | Role |
|---|---:|---|---|
| `mirelo_sfx` | 1.6 | fixture-qualified | Primary generated SFX/Foley provider; live production blocked |
| `mmaudio_v2` | 2.0 | blocked | Declared video-conditioned fallback only |
| `sound_internal_library` | 1.0.0 | planning-qualified | Search planning; no indexed production library evidence |
| `ffmpeg` | 8.1.1-local | private-internal-qualified | Ten separately qualified local operations |
| `ffprobe` | 8.1.1-local | private-internal-qualified | Media inspection and validation |
| `pyav`, `librosa`, `audioflux`, `pyloudnorm`, `pydub`, `scipy`, `resampy`, `noisereduce`, `pedalboard`, `rnnoise` | registry-current | private-internal-qualified | Bounded analysis or processing operations |
| `deepfilternet` | registry-current | declared | Cleanup candidate without qualified runtime evidence |
| `signalsmith_stretch` | registry-current | private-internal-qualified | Pitch-preserving retime operation |
| `sound_private_artifact_store` | 1.0.0 | fixture-qualified summary | Fixture-qualified proxy/ingest operations plus a separately private-internal-qualified commit operation |
| `sound_provider_attempt_service` | 1.0.0 | fixture-qualified | Provider attempt and reconciliation records |
| `sound_project_source_resolver` | 1.0.0 | planning-qualified | Project-owned source resolution |
| `sound_planning_service` | 1.0.0 | operation-dependent | Planning, reference DNA, visual study, and revision operations |
| `sound_sync_service` | 1.0.0 | private-internal-qualified | Visual-event alignment |
| `sound_qa_service` | 1.0.0 | private-internal-qualified | Final Sound QA |
| `sound_no_sound_decision` | 1.0.0 | private-internal-qualified | Typed no-Sound decision and receipt |

The current FFmpeg/FFprobe evidence comes from a local Homebrew GPL build. It is accepted only for private/internal development evidence; it is not the deployable production LGPL configuration required by `launch-tool-stack-update.md`.

## Canonical route inventory

| Route | Role | Planning | Preview execution | Final execution admission |
|---|---|---|---|---|
| `sound.route.study.source_audio.v1` | primary | private-internal | private-internal | blocked without production qualification |
| `sound.route.study.reference_sound.v1` | primary | private-internal | private-internal | blocked without production qualification |
| `sound.route.study.visual_events.v1` | support | planning | blocked | blocked |
| `sound.route.design.plan.v1` | primary | planning | blocked | blocked |
| `sound.route.revision.v1` | support | planning | blocked | blocked |
| `sound.route.acquire.internal_library.v1` | lower cost | planning | blocked | blocked |
| `sound.route.acquire.project_source.v1` | primary | private-internal | private-internal | blocked without production qualification |
| `sound.route.generate.video_sfx.mirelo.v1` | primary | fixture | fixture | blocked without production qualification |
| `sound.route.generate.video_sfx.mmaudio.v1` | fallback | blocked | blocked | blocked |
| `sound.route.generate.text_sfx.v1` | primary | fixture | fixture | blocked without production qualification |
| `sound.route.ambience.generate_or_extend.v1` | primary | fixture | fixture | blocked without production qualification |
| `sound.route.repair.dialogue_gentle.v1` | primary | private-internal | private-internal | blocked without production qualification |
| `sound.route.edit.deterministic.v1` | primary | private-internal | private-internal | blocked without production qualification |
| `sound.route.retime.pitch_preserved.v1` | primary | private-internal | private-internal | blocked without production qualification |
| `sound.route.sync.visual_event.v1` | support | private-internal | private-internal | blocked without production qualification |
| `sound.route.mix.scene.v1` | primary | private-internal | private-internal | blocked without production qualification |
| `sound.route.qa.final_sound.v1` | QA | private-internal | private-internal | blocked without production qualification |
| `sound.route.no_sound.v1` | no-Sound | private-internal | private-internal | blocked without production qualification |

The status labels in the table are evidence classifications. The final column reflects admission behavior: only `production_qualified` may enter `final_execution`.

## Mirelo route pipeline

The generated video-SFX route is ordered as:

1. prepare a bounded private visual proxy;
2. record an idempotent provider attempt;
3. call the bound Mirelo SFX 1.6 operation;
4. ingest provider output as untrusted private media;
5. validate the carrier;
6. optionally extract audio if the carrier is video;
7. analyze the event region;
8. trim and synchronize the candidate;
9. align it to the approved visual event;
10. mix-match against dialogue context;
11. run output and integration QA;
12. commit only the selected private audio artifact.

Provider-returned visuals are always rejected. Sound may consume approved visual evidence but cannot replace the project visual.

## Controller and worker projections

The Head view contains skill/capability eligibility, scope, dependencies, conflicts, estimates, route graphs, mode qualification, runtime observations, fallbacks, attempts, QA, and limitations.

The peer view contains callable Sound capability, required inputs, supported scopes, produced artifacts, estimates, and admission state. It explicitly denies direct tool, provider-payload, credential, executable, argument, and worker-dispatch access.

The Sound controller view contains full routes and exact operation manifests. The worker package contains one tool operation, one operation profile, opaque artifact bindings, exact ranges, attempt identity, and a private output contract. It contains no credential, URL, command, arbitrary argument, or caller-selected path.

## Exact bindings and invalidation

Assignments bind skill version, capability, manifest hash, and qualification. Route admissions bind route key/version/hash plus every selected tool key/version/manifest hash, operation key/version, profile key/version, qualification evidence, rate-card snapshot, and license evidence when required.

A source, approved snapshot, visual timing, manifest hash, route hash, operation version, profile version, rate card, license evidence, or qualification change invalidates the affected binding. Workers execute the bound approved version; they do not reinterpret raw chat.

## Verification commands

```text
npm run smoke:sound-capability-manifest
npm run smoke:sound-tool-capability-registry
npm run smoke:canonical-sound
npm run smoke:canonical-sound-local-audio
npm run smoke:canonical-sound-mirelo
npm run smoke:canonical-sound-legacy-retirement
npm run smoke:canonical-sound-e2e
npm run smoke:sound
```
