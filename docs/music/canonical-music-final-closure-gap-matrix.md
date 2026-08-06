# Canonical Music final-closure gap matrix

Date: 2026-08-05

Starting branch: `codex/canonical-music-skill`

Starting commit: `e796400b9befd9882c51f83fef6c70a9be045a7c`

This audit is the implementation freeze for the final standalone Music closure. It records repository evidence at the starting commit and does not itself qualify runtime behavior.

Closure update: every source-level gap below is closed in Music `3.1.0` / Sound
`4.2.0`. The six-scenario final-closure suite, aggregate Music acceptance, Sound
acceptance, shared publication validation, and server typecheck pass locally.
Exact final GitHub SHA and hosted CI evidence are recorded only after the
milestone commits are pushed.

| Requirement | Starting evidence | Starting gap | Closure action |
| --- | --- | --- | --- |
| Professional cue grouping | `buildMusicSoundtrackSegmentationPlan` creates exact atomic segments; `buildCueSet` in `server/music/music-supervision.ts` creates a derived cue for every range decision. | No canonical grouping artifact exists between atomic segmentation and final cues. Cue-count and cue-density excesses are warnings. | Add a deterministic `music_cue_grouping_plan_v3`, hard policy enforcement, deterministic reduction, and typed `music_cue_policy_conflict_v3`. |
| Autonomous whole-video execution | `StandaloneCanonicalMusicSkillService.execute` can replace empty caller cues with Music-planned cues and routes those cues through the canonical executor. | The path is not yet proven with professional grouping, mixed real source/generated/no-Music routes, exact atomic coverage, and measured outputs in one public-service scenario. | Make grouping an authoritative service stage and add a real-byte public-service acceptance scenario with `cues: []`. |
| True two-source crossfade | Music maps `crossfade` to generic Sound `mix`; the request carries one selected Music artifact and reuses `loopCrossfadeFrames`. | No independent left/right source binding, exact two-source overlap contract, measured curve, or fail-closed two-source receipt exists. | Publish a versioned two-source Music crossfade extension/route, execute both decoded sources, measure the overlap, and validate both hashes and exact authority. |
| Duck attack/release | Music sends attenuation and attack/release frame values in `sound.music_technical_automation.v1`. | Existing Sound execution can report the values without proving a gradual range-based envelope. | Compile and apply an exact protected-range envelope, measure pre/attack/hold/release/post RMS, and bind the measurements to the operation receipt. |
| Operation-specific receipts | Sound emits one receipt per requested Music operation with matching parameter hashes. | Several operations share generic `mix_stem` evidence and do not independently bind requested/compiled/applied parameters, exact source/output hashes, range, and operation-specific measurements. | Replace the projection with parameter-specific, hash-verifiable receipts and operation-specific QA requirements, including tamper rejection. |
| Manifest/output/version agreement | Music 3.0.0 and Sound 4.1.0 publish immutable manifests and exact routes. | The published artifact inventories omit the grouping, policy-conflict, crossfade-plan, and crossfade-receipt artifacts; the public Music-to-Sound extension semantics need an honest version bump. | Update contracts, manifests, mini-skills, routes, handlers, acceptance evidence, dependency identity, semantic versions, and hashes together. |
| Final closure acceptance | `test:music-acceptance` and `test:sound-acceptance` pass at the starting SHA. | The six mandatory real-byte closure tests and `test:music-final-closure` do not exist. | Add all six tests, include the aggregate in Music acceptance and both relevant CI workflows, then run the full required validation matrix. |
| GitHub exact-SHA proof | PR #2501 and local/remote branch all point to the starting SHA; the dedicated Music and Sound checks are green there. | New closure behavior is not committed or proven on an exact final SHA. | Commit in meaningful milestones, push, update PR evidence, and wait for both dedicated workflows on the final SHA. |

## Protected boundaries

- Keep the Head of Orchestra, final mux, render, export, delivery, publishing, and other top-level skills out of scope.
- Preserve the existing Lyria live-canary evidence unless provider compilation, transport, parsing, reconciliation, or private ingestion changes.
- Do not weaken the unrelated two-hour custom-estimate gate to make UI QA green.
- Preserve private artifact, approved snapshot, exact range, rational timeline, approval, credit, rights, and provenance gates.
