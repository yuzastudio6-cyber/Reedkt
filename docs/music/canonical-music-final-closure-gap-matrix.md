# Canonical Music final-closure gap matrix

Date: 2026-08-05

Starting branch: `codex/canonical-music-skill`

Starting commit: `e796400b9befd9882c51f83fef6c70a9be045a7c`

This audit is the implementation freeze for the final standalone Music closure. It records repository evidence at the starting commit and does not itself qualify runtime behavior.

First closure update: the original source-level gaps below were closed in Music
`3.1.0` / Sound `4.2.0`. The post-green audit then identified the narrower
evidence and artifact-inventory delta recorded next.

## Post-green evidence audit — 2026-08-06

The first closure implementation and its dedicated Music/Sound workflows were
green at `ce1452d03408071fd8047032c57a6323c113b05c`. A fresh requirement-to-source
audit found that green status was not yet sufficient for the stricter objective.
The table below is the authoritative implementation delta for the final pass.

| Closure requirement | Current source and test evidence | Remaining gap before this pass | Required closure evidence |
| --- | --- | --- | --- |
| Cue grouping and hard policy | `buildMusicCueGroupingPlan`, the v3 grouping route, and `canonical-music-cue-grouping-enforcement-smoke.ts`. | None found in the audited public-service path. | Preserve deterministic grouping, typed hard conflict, and exact segment coverage. |
| Autonomous `cues: []` execution | `StandaloneCanonicalMusicSkillService.execute` and `canonical-music-autonomous-whole-video-execution-smoke.ts`. | None found in the mixed source/generated/no-Music real-byte scenario. | Preserve exact coverage, actual Sound receipts, hashes, QA, and handoff. |
| Two-source crossfade | Music and Sound public crossfade services plus `canonical-music-two-source-crossfade-smoke.ts`. | None found in the decoded 440/880 Hz overlap and negative authority/hash tests. | Preserve two independent source hashes, measured overlap, curve, peak, and fail-closed receipt validation. |
| Duck attack/release | Sound compiles a frame-bounded envelope and `canonical-music-duck-envelope-smoke.ts` measures decoded RMS windows. | None found in the real-byte public-port path. | Preserve nonzero gradual attack/release and measured ramp evidence. |
| Every advertised Music-to-Sound operation | Runtime maps all 18 Music operation families to exact Sound route steps and emits parameter-specific receipts. | The dedicated receipt test requests only 8 operations; crossfade is separate, leaving cut, loop, resample, channel conversion, time stretch, pitch shift, placement, EQ, and dynamics without complete independent receipt/tamper proof in Test E. | Execute every one-source operation through the public Music-to-Sound port, validate exact parameter/source/output/range/route/QA bindings, and mutate every operation receipt so QA rejects it. Keep crossfade on its exact two-source test boundary. |
| v3 authoritative artifact inventory | The public result already contains typed `MusicCueConstraintResolution` and `MusicAcceptanceReceipt` values. | They are embedded result fields but are not published as `music_cue_constraint_resolution_v3` and `music_acceptance_receipt_v3` artifact envelopes; manifest completeness does not test them. | Publish immutable artifacts, declare their service/route reachability, bump the immutable Music version/hash, and reject undeclared or stale publication mutations. |
| Publication negative validation | Route publication already rejects unresolved steps, undeclared step outputs, unsupported jobs, and unreachable route outputs. | The dedicated v3 completeness test is mostly positive and does not independently mutate every required failure class. | Add negative publication tests for undeclared artifacts, stale manifest/route hashes, missing handlers/outputs, unsupported jobs, and unreachable outputs. |
| Repository/Git integrity | Source worktree was clean and local/remote/PR heads matched before this pass. | macOS AppleDouble `._*` files appeared in the shared Git pack directory and are parsed as invalid pack indexes by the system Git client. | Quarantine only those validated metadata sidecars, re-run Git integrity/status, and do not modify real pack objects. |

This delta does not authorize changes to the unrelated two-hour custom-estimate
gate, Lyria live-canary evidence, the Head of Orchestra, final composition
rendering, or another top-level skill.

Closure result: a second adversarial source audit found that the green `3.2.0`
state still expanded Sound v1 receipt semantics in place and did not bind
source-specific decoded crossfade evidence or complete duck-envelope evidence.
Those defects are now closed in Music `3.3.0` and Sound `4.3.0`. Active Music
support publishes v2 Sound extensions, routes, profiles, and receipts; crossfade
evidence contains decoded source-specific curve measurements; duck receipts bind
baseline/attack/hold/release/post-release measurements and the applied frame
segments; synchronization evidence is no longer dropped at the Music boundary;
and 29 receipt mutations plus seven publication attacks are rejected. Exact
final GitHub SHA and hosted CI evidence are recorded only after the final commit
is pushed.

| Requirement | Starting evidence | Starting gap | Closure action |
| --- | --- | --- | --- |
| Professional cue grouping | `buildMusicSoundtrackSegmentationPlan` creates exact atomic segments; `buildCueSet` in `server/music/music-supervision.ts` creates a derived cue for every range decision. | No canonical grouping artifact exists between atomic segmentation and final cues. Cue-count and cue-density excesses are warnings. | Add a deterministic `music_cue_grouping_plan_v3`, hard policy enforcement, deterministic reduction, and typed `music_cue_policy_conflict_v3`. |
| Autonomous whole-video execution | `StandaloneCanonicalMusicSkillService.execute` can replace empty caller cues with Music-planned cues and routes those cues through the canonical executor. | The path is not yet proven with professional grouping, mixed real source/generated/no-Music routes, exact atomic coverage, and measured outputs in one public-service scenario. | Make grouping an authoritative service stage and add a real-byte public-service acceptance scenario with `cues: []`. |
| True two-source crossfade | Music maps `crossfade` to generic Sound `mix`; the request carries one selected Music artifact and reuses `loopCrossfadeFrames`. | No independent left/right source binding, exact two-source overlap contract, measured curve, or fail-closed two-source receipt exists. | Publish a versioned two-source Music crossfade extension/route, execute both decoded sources, measure the overlap, and validate both hashes and exact authority. |
| Duck attack/release | The old boundary sent attenuation and attack/release frame values in `sound.music_technical_automation.v1`. | Existing Sound execution could report values without binding the complete applied envelope and return-to-baseline evidence. | Publish `sound.music_technical_automation.v2`, compile an exact protected-range envelope, measure pre/attack/hold/release/post RMS and frame/sample lengths, and bind the applied segments and measurements to every duck receipt. |
| Operation-specific receipts | Sound emits one receipt per requested Music operation with matching parameter hashes. | Several operations share generic `mix_stem` evidence and do not independently bind requested/compiled/applied parameters, exact source/output hashes, range, and operation-specific measurements. | Replace the projection with parameter-specific, hash-verifiable receipts and operation-specific QA requirements, including tamper rejection. |
| Manifest/output/version agreement | Music and Sound publish immutable manifests and exact routes. | The first closure mutated Sound Music-support v1 receipt semantics and left changed Music grouping/Sound-dependency routes at old versions. | Publish Music `3.3.0`, Sound `4.3.0`, Music grouping/support routes `3.3.0`, and Sound Music-support extensions/routes/profiles/receipts v2 with exact manifest hashes. |
| Final closure acceptance | `test:music-acceptance` and `test:sound-acceptance` pass at the starting SHA. | The six mandatory real-byte closure tests and `test:music-final-closure` do not exist. | Add all six tests, include the aggregate in Music acceptance and both relevant CI workflows, then run the full required validation matrix. |
| GitHub exact-SHA proof | PR #2501 and local/remote branch all point to the starting SHA; the dedicated Music and Sound checks are green there. | New closure behavior is not committed or proven on an exact final SHA. | Commit in meaningful milestones, push, update PR evidence, and wait for both dedicated workflows on the final SHA. |

## Protected boundaries

- Keep the Head of Orchestra, final mux, render, export, delivery, publishing, and other top-level skills out of scope.
- Preserve the existing Lyria live-canary evidence unless provider compilation, transport, parsing, reconciliation, or private ingestion changes.
- Do not weaken the unrelated two-hour custom-estimate gate to make UI QA green.
- Preserve private artifact, approved snapshot, exact range, rational timeline, approval, credit, rights, and provenance gates.
