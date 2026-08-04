# Track All implementation progress

Status: `track_14_qa_repair_implemented_qualification_receipt_pending`

This ledger records actual implementation, test, qualification, Git, and
external-gate evidence for the canonical `track_all@1.0.0` skill. It does not
promote injected fixtures or contract-only routes as real SAM 3.1 execution.

## TRACK-00 — stable edit-skills foundation

Status: complete locally; remote push confirmation follows from the evidence
commit that contains this record.

The isolated clean foundation checkout is:

`/Users/macuser/Documents/REeditpro-edit-skills-foundation-v1`

The preservation checkout at `/Volumes/backup/REeditpro` was not modified. It
contained 1,063 status entries and corrupt macOS `._pack-*.idx` sidecars, so it
was treated as an audit-only source and all foundation work used a fresh clone.

Selected exact authorities:

- backend integration branch:
  `origin/codex/backend-workflow-pipeline-continuation`
- backend integration SHA:
  `f2e4a7e7611089dd69c74d81c1ac67ec94a675d0`
- frozen B-Roll branch:
  `origin/codex/reeditpro-b-roll-skill-end-to-end`
- frozen B-Roll SHA:
  `17784eca635695652ebcbdc225a9ceaf74c78e62`
- prior shared merge base:
  `6423f12c1e62a252fc860ce5184888770411c62d`
- normal foundation merge:
  `01539fbbe631f7f3672c425259be8dd225120a84`
- merge parents:
  `f2e4a7e7611089dd69c74d81c1ac67ec94a675d0` and
  `17784eca635695652ebcbdc225a9ceaf74c78e62`

The backend and B-Roll branches had 68 and 83 unique commits respectively.
Only `package.json`, `server/config/env.ts`, and
`server/services/edit-planning-authority-service.ts` overlapped after the
shared merge base. Git's normal `ort` merge combined all three without a
conflict. The merged files preserve the backend's current Visual Intelligence,
source-cleanup, billing-account, and SAM 3.1 authorities and B-Roll's generic
edit-skill kernel, Gemini secret coordinate, canonical plan component, and
qualification commands.

### B-Roll foundation qualification

The exact clean merge commit
`01539fbbe631f7f3672c425259be8dd225120a84` was tested by:

`REEDITPRO_GIT_BIN=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git npm run qualify:b-roll:internal`

Actual result:

- status: `internal_execution_qualified`
- command evidence: `29` passed
- fixture evidence: `36` passed
- dependency authorities: `18`
- manifest hash:
  `40219ecc4319bc5639de87f16695ba9f87119ec7efce60acbd95fc60b1d4dec0`
- relevant source-tree hash:
  `8b6c5cd286ace90759fc0f25bbba07b4b42f0182e68172a42fad4a3fdb3489b3`
- dependency-authority set hash:
  `954bcaad794a039eb17146c8a3cd1ad7538a228b1612750e70113d1069045147`
- qualification receipt hash:
  `340483b65c603a981b6c35fee84cf681a5e07cc0ae9d1e161d2aa552d48608ee`
- generated qualification artifact hash:
  `a96b6074c6028d7b62246cd846aa66dacb3959b0d820a848930af320aa41969c`
- provider requests: `0`
- public artifacts: `0`
- production mutations: `0`

The complete qualifier passed B-Roll planning, independently derived planning
QA, qualification evidence validation, plan invariants, public plugin and
canonical lifecycle, strict artifact schemas, runtime bindings and factory,
UI media-runtime workflow, capability manifest and kernel, build, server
typecheck, lint, frontend boundary, provider authority and injected lifecycle,
retirement, existing-source FFprobe/FFmpeg execution, candidate QA, private
Remotion integration, canonical integration, runtime API security, execution
security, and idempotency.

`npm ci` installed only the existing lockfile graph. It reported the existing
npm audit state of one moderate and two high vulnerabilities; no dependency or
lockfile change was made by TRACK-00.

No Track All runtime, head orchestra, production worker, paid model call, GPU
execution, public artifact, production mutation, or database migration was
performed during TRACK-00.

### Qualification truth entering TRACK-01

- B-Roll: `internal_execution_qualified` on the merged foundation.
- Track All: `implementation_pending`.
- SAM 3.1 Track All route: not yet claimed; current source/checkpoint/runtime
  authorities remain fail-closed pending TRACK-01 research and later route
  qualification.
- Production qualification: `false`.

## TRACK-01 — research, repository audit, and tool architecture

Status: complete and pushed.

- implementation commit: `3042555d221e680cf655d7db0d4dbcd35bc58015`
- remote confirmation: `origin/codex/track-all-skill-end-to-end` resolved to
  the same commit immediately after push.

- Inspected official Meta SAM 3.1 source at `96914d2425f90a64f45ca977c2b5165418099543`; its source tree and four pinned file hashes exactly match the repository authority.
- Verified Object Multiplex, builder, text/point/box prompts, object IDs/removal, reset/cancel/close, non-zero initialization, and forward/backward/bidirectional propagation directly from official source and notebook.
- Kept direct multiplex mask prompting unclaimed because the public request dispatcher does not expose it.
- Confirmed official issue #526 is open; strict zero-missing/zero-unexpected checkpoint qualification remains mandatory.
- Confirmed the checkpoint repo is human-gated and inaccessible without authorization; no checkpoint/model bytes or paid GPU work occurred.
- Audited the current 75-profile tool catalog and 38 professional operation specs.
- Froze `tool.sam3_1.track_masklets.v2` as the forward-only intended Track All operation while preserving V1 exactly.
- Classified SAM2, BiRefNet, rembg, and transparent-background as unavailable tracking fallbacks.
- Added SAM research/runtime/qualification documents, tool audit/matrix/gap/ownership documents, and the initial retirement map.

Qualification state remains `implementation_pending`; documentation and contracts alone do not qualify execution.

## TRACK-02 — capability manifest and public plugin

Status: complete and pushed.

- implementation commit: `dee982caf8feb54df945cd0293b6da111dc7c85e`
- remote confirmation: `git ls-remote --heads origin codex/track-all-skill-end-to-end`
  returned the same exact SHA after `git push -u origin HEAD`.

Implemented:

- one deep-frozen, content-addressed `track_all@1.0.0` capability manifest on
  `track_all.skill_contract.v1`;
- 13 structured supported jobs and 20 explicit fail-closed unsupported jobs;
- structured phases, target/VI/tracking dependencies, conflicts, overlaps,
  ownership, routes, attempts, estimators, QA, invalidation, revision, fixture,
  and limitation semantics;
- a generated read-only manifest projection, produced only from TypeScript;
- registration in the existing generic B-Roll edit-skill kernel (no second
  kernel and no head orchestra);
- the public plan, approval/work-graph, dependency-acceptance,
  work-result-validation, and finalization plugin boundary;
- exact internal-fixture runtime binding declarations for all 13 jobs. These
  adapters fail closed and cannot masquerade as canonical-private or
  production workers;
- forward-gated manifest/runtime validation: a route may declare a higher
  minimum than the skill's current status, while dispatch still rejects an
  invocation below that exact minimum;
- strict initial assignment, target, dependency, planning QA, plan, result,
  and shared Track Graph registrations needed by the public boundary.

Actual checks run:

- `npm run generate:track-all-capability-manifest` — passed.
- `npm run test:track-all-capability-manifest` — passed; manifest hash
  `155fc4d3324bd1a514d5e3cbb36f3bfe125efda734973c33862d9f6b2ec7e196`,
  13 supported jobs, 20 unsupported jobs, 8 route definitions.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-capability-manifest`
  — passed with both manifests statically validated.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:edit-skill-runtime-factory`
  — passed; both public plugins resolved, production in-memory storage failed
  closed, and adapter environment classes remained separated.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:edit-skill-capability-kernel`
  — passed.

Qualification truth remains `implementation_pending`. TRACK-02 proves the
declaration and public boundary, not Track All planning quality, deterministic
geometry, real SAM inference, or production execution. The SAM route remains
blocked on authorized checkpoint/runtime evidence and no model, GPU, paid,
public, or production action occurred.

## TRACK-03 — assignment, target, and input authorities

Status: complete and pushed.

- implementation commit: `5336fa2baba8adf025e305f5baf95062baac06e9`
- remote confirmation: `git ls-remote --heads origin codex/track-all-skill-end-to-end`
  returned the same exact SHA after `git push -u origin HEAD`.

Implemented:

- immutable tenant/project/session/assignment-bound target specifications;
- independently content-addressed write, source-frame, scene-context, Visual
  Intelligence, privacy-policy, point/box/brush/reference, and repair
  authorities;
- exact selected-source ID plus checksum resolution;
- exact Master Timing assignment range and FPS validation;
- exact ownership range and scene-context/write-range separation;
- plugin-side rejection of stale assignment, target, timing, source,
  ownership, manifest, tenant, and optional dependency lineage;
- explicit `needs_range_expansion` with no SAM or visible treatment when target
  evidence is readable but outside write authority;
- raw-chat and unrestricted caller-field rejection through strict target
  schemas;
- `assignment-and-target-contract.md` and reusable isolated public fixtures.

Actual checks run:

- `npm run test:track-all-authority` — passed 21 adversarial cases; baseline
  `use_no_action`, outside-range target `needs_range_expansion`, raw chat
  rejected, and outside-range mutation false.
- `npm run generate:track-all-capability-manifest` — passed.
- `npm run test:track-all-capability-manifest` — passed; current manifest hash
  `65eb6541aafc312f390479273d196aaa5f2db5cd52cba898dd9165a88f7a5998`.
- `npm run typecheck:server` — passed.
- affected-file ESLint — passed.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-public-plugin`
  — passed; B-Roll public Track Graph dependency behavior remained compatible.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-capability-manifest`
  — passed.

Qualification remains `implementation_pending`: authority tests do not prove
planning qualification, deterministic geometry, SAM execution, privacy
quality, or production readiness. No head orchestra, provider/model request,
GPU work, paid action, public artifact, or production mutation occurred.

## TRACK-04 — planning mini-skills, estimators, and planning QA

Status: implementation complete and pushed; qualification receipt issuance is
deferred to the evidence-backed qualification milestone.

- implementation commit: `deee532dfd2be26c4d78da6cb750f34b88f762f8`
- remote confirmation: `git ls-remote --heads origin codex/track-all-skill-end-to-end`
  returned the same exact SHA after `git push -u origin HEAD`.

Implemented:

- strict private shot/chunk, overlap, initialization-frame, multiplex-budget,
  prompt-strategy, session-lifecycle, and complete-estimate mini-skills;
- 240-frame qualified chunk ceilings, dynamic evidence-derived overlaps,
  non-zero initialization support, 16-object buckets, and multi-bucket cost;
- registry estimators covering frames, chunks, overlaps, groups, objects,
  buckets, SAM sessions, bidirectional propagation, planar/OCR/landmark/mask
  work, privacy, preview, QA depth, and repairs;
- strict no-action/dependency/blocked/ceiling/source/SAM/planar plan invariants;
- coherent time- and credit-ceiling fallback that zeroes all executable work;
- 24 independently derived, hashed `SkillQaFinding` values from one strict
  evidence schema and a content-addressed aggregate report;
- fail-closed generic QA behavior: caller booleans produce `needs_review` and
  cannot approve Track All;
- the current Track All architecture document.

Actual checks run:

- `npm run test:track-all-planning` — passed 9 planning scenarios, 24 QA
  findings, a 4-chunk long-range fixture, a 2-bucket/8-session multiplex
  fixture, time and credit fallback, contradictory-state rejection, forged QA
  rejection, and raw-boolean rejection.
- `npm run test:track-all-authority` — passed 21 adversarial cases.
- `npm run test:track-all-capability-manifest` — passed; manifest hash remains
  `65eb6541aafc312f390479273d196aaa5f2db5cd52cba898dd9165a88f7a5998`.
- `npm run typecheck:server` — passed.
- affected-file ESLint — passed.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:edit-skill-runtime-factory`
  — passed.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-planning`
  — passed.

The manifest deliberately remains `implementation_pending` until the Track All
evidence issuer can generate and validate a receipt for the exact committed
source tree. Passing smokes alone is not promoted as qualification. No SAM
model/checkpoint/GPU run, paid action, public artifact, production mutation,
head orchestra, or peer-skill implementation occurred.

## TRACK-05 — shared Track Graph and strict artifact contracts

Status: complete and pushed.

- implementation commit: `5a49f80ca92286a8da75536c7fa4a6b9bece4fd5`
- remote confirmation: `git ls-remote --heads origin codex/track-all-skill-end-to-end`
  returned the same exact SHA after `git push -u origin HEAD`.

Implemented:

- moved frozen `track_graph_v1` schema ownership into
  `server/edit-skills/shared/track-graph/` while preserving the exact B-Roll
  consumer contract and re-export;
- added content-addressed `track_graph_v2` with exact tenant/project/session,
  assignment, plan, manifest, source, timing, and authorized-range lineage;
- added typed graph references for box, mask, landmark, anchor, planar,
  occlusion, camera-motion, attempt, repair, and QA evidence;
- added shot/chunk authority, scene-cut identity resets, visibility states,
  parent/child anonymous identities, re-entry and identity-switch evidence,
  Object Multiplex budgets, stitching evidence, and fail-closed private-mask
  and range-mutation flags;
- added strict, distinct, content-addressed schemas for every active Track All
  planning, tracking, treatment, QA, repair, handoff, and result artifact;
- kept large masks as private checksum-bound binary/object manifests and
  rejected embedded bitmap arrays and public mask publication;
- added an exact V2-to-V1 projection and regression coverage through both the
  shared and B-Roll V1 parsers.

Actual checks run:

- `npm run test:track-all-artifact-contracts` — passed; 32 produced artifact
  types were strict, V1 compatibility passed, V2 hash validation passed, raw
  mask bitmaps were rejected, and no public mask was published.
- `npm run test:track-all-authority` — passed 21 adversarial cases.
- `npm run test:track-all-planning` — passed 9 planning scenarios and 24
  independently derived planning-QA findings.
- `npm run test:track-all-capability-manifest` — passed; manifest hash remains
  `65eb6541aafc312f390479273d196aaa5f2db5cd52cba898dd9165a88f7a5998`.
- `npm run test:b-roll-active-artifact-contracts` — passed; 29 B-Roll active
  artifact contracts remained strict.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-public-plugin`
  — passed with exact Track Graph V1 dependency acceptance.
- `npm run typecheck:server` — passed.
- affected-file ESLint — passed.
- `git diff --check` — passed using the repository fallback Git runtime; the
  host Xcode shim is not used by the branch validation commands.

Qualification remains `implementation_pending` pending the evidence-backed
receipt milestone. TRACK-05 proves strict artifact contracts and frozen V1
compatibility; it does not prove real SAM inference, GPU execution, privacy
quality, or production readiness. No model/checkpoint/GPU run, paid action,
public artifact, production mutation, head orchestra, or peer-skill
implementation occurred.

## TRACK-06 — deterministic visual geometry

Status: complete and pushed.

- implementation commit: `70f1d90e572d96fce2ce473eaeac036514bcb3cc`
- remote confirmation: `git ls-remote --heads origin codex/track-all-skill-end-to-end`
  returned the same exact SHA after `git push -u origin HEAD`.

Implemented:

- strict FFprobe technical-source normalization and an exact
  `tool.ffprobe.inspect_approved_media.v1` request compiler;
- exact approved-range FFmpeg proxy authority through
  `tool.ffmpeg.execute_approved_media_recipe.v1`, with no caller path or
  command;
- fixed Track All PySceneDetect content-detector requests;
- two fixed profiles inside the existing confined OpenCV operation:
  `track_all_camera_motion_v1` and `track_all_planar_homography_v1`;
- bounded source-range decode, non-zero initialization, Shi–Tomasi features,
  pyramidal Lucas–Kanade optical flow, RANSAC partial-affine camera transforms,
  stabilized coordinates, motion classification, confidence, discontinuity,
  and reprojection evidence;
- forward and backward polygon-constrained planar feature tracking from the
  initialization frame, RANSAC homography, four-corner geometry, visibility,
  occlusion, surface stability, confidence, and reprojection evidence;
- strict projection into content-addressed `camera_motion_graph_v1` and
  `planar_track_graph_v1` artifacts;
- range and order refinements for sample, box, mask, landmark, anchor, camera,
  planar, occlusion, focus, and reframe artifacts;
- preservation of the old OpenCV profiles and all existing structured Python
  operations; no parallel tool runner was added.

Actual checks run:

- `npm run test:track-all-deterministic-geometry` — passed using installed
  FFmpeg `8.1.1`, FFprobe `8.1.1`, real confined PySceneDetect, and real
  confined OpenCV. It produced 2 scenes, 24 camera transforms, and 24 planar
  frames from a non-zero initialization at frame 5.
- deterministic evidence hashes: source truth
  `6e15f12447578ca31debb3f5e4f6fee23f00f9aaf6abb8d1e4c0540565e038d7`,
  camera graph
  `ebd22a743ba11e8b5780ca8f415dc501bf445606888de03afa965b27d50e1fc9`,
  planar graph
  `b7f0ca4d729f0cafb44934059458e205122ca392387a96d09a04f98bcfa6a012`,
  shot-boundary evidence
  `2013ea18b06c9acf13e194ac7beba8782ba140d0bb528ae64c713c267fe8ab39`,
  OpenCV image identity
  `2207d4886d1fcda6cbd01e39148c9696340dda1959fce2a88f7a50dd905c17aa`.
- `npm run smoke:offline-python-structured-execution` — passed all existing
  19 operations plus confinement, attestation, and caller-input rejection.
- `npm run smoke:core-registry-operation-specs` — passed 50 canonical specs
  and all adversarial executable/path/URL/prompt/scope checks.
- `npm run smoke:professional-tool-operation-specs` — passed 38 bounded
  adapter contracts.
- `npm run test:track-all-artifact-contracts` — passed 32 strict outputs,
  shared V1 compatibility, V2 hashing, private-mask enforcement, and exact
  range rejection.
- `npm run test:track-all-authority` — passed 21 adversarial cases.
- `npm run test:track-all-planning` — passed 9 scenarios and 24 derived QA
  findings.
- `npm run typecheck:server` — passed.
- affected-file ESLint — passed.

The executed geometry fixture is actual private CPU tool evidence, not a mock
declaration. Aggregate Track All qualification remains `implementation_pending`
until the later receipt issuer binds this evidence to the exact committed
source tree. The fixture is not SAM evidence and does not promote the SAM or
top-level skill route. No checkpoint, GPU, model/provider, paid, public,
production, database, or head-orchestra action occurred.

## TRACK-07 — SAM 3.1 Track All operation authority

Status: complete; push confirmation is recorded by the following evidence
ledger commit.

- implementation commit: `c6919897bde19db59daccf6274b9cc5e567bbce5`

Implemented:

- preserved `tool.sam3_1.segment_and_track_subject.v1`, the pinned source
  revision, source archive hash, checkpoint revision, and all existing V1
  runtime contracts without modification;
- added the separate content-addressed
  `tool.sam3_1.track_masklets.v2` authority with operation authority hash
  `cd6f408a7328ff3a4d54e054dd29b7438d8571533e67003856b5c84bfc4d1a1a`;
- bound the exact Track All manifest, assignment, plan, approved snapshot,
  work item, attempt, lease, reservation, source checksum/range, target group,
  anonymous object IDs, object/bucket/frame ceilings, and cost authorities;
- added server-compiled text, positive-point, negative-point, and bounding-box
  prompt contracts; direct mask prompting remains rejected and unqualified;
- added non-zero initialization plus forward, backward, and bidirectional
  propagation, bounded refinement, object removal, reset, cancellation, and a
  mandatory close-in-finally policy for all six terminal outcomes;
- added separately hashed attempt and close evidence which cannot represent
  injected masklets as real strict-load/CUDA evidence;
- rejected caller model, module, class, checkpoint, command, GPU, endpoint,
  path, URL, retry, fallback, price, and raw-chat authority;
- kept the canonical-private and production execution adapters absent until
  real qualification exists.

Actual checks run:

- `npm run test:track-all-sam3.1-operation-authority` — passed the valid
  non-zero/bidirectional, point/box/refinement, removal, reset, cancellation,
  six-outcome close, injected-evidence, cross-workspace, stale-lineage, and 21
  adversarial checks; actual SAM request count was `0`.
- `npx tsx server/smoke/canonical-sam3_1-gpu-runtime-contract-smoke.ts` —
  passed 46 V1 checks; request binding hash
  `a1d9a9c739ec92c6a057a58ffea3d214e504f526e5846c73f040643f61089b4d`
  and response binding hash
  `6a132e95eb6bb2f5ec6b7540f099ef05d35676e604b033ff8aaf1b1001900856`
  remain unchanged.
- `npx tsx server/smoke/canonical-sam3_1-source-runtime-candidate-smoke.ts`
  — passed 134 checks with V1 candidate hash
  `a05d7789966ce35cf64acf4f17125e49535fd03da1f5296f3c6b1b366e6b7b33`;
  runtime execution remained false and production readiness remained false.
- `npm run typecheck:server` — passed.
- `npm run lint -- --quiet` — passed.
- `npm run test:track-all-capability-manifest` — passed before the V2 source
  addition; manifest hash remains
  `65eb6541aafc312f390479273d196aaa5f2db5cd52cba898dd9165a88f7a5998`.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-capability-manifest`
  — passed and preserved the frozen B-Roll manifest hash.
- staged `git diff --check` — passed.

Qualification truth remains `implementation_pending`. The SAM route remains
`blocked` on authorized checkpoint ingest, strict-load compatibility,
immutable image qualification, and real private A100/L4 evidence. No SAM
model/checkpoint/GPU inference, paid action, public artifact, production
mutation, database migration, head orchestra, or peer-skill implementation
occurred.

## TRACK-08 — SAM source, checkpoint, and runtime qualification gates

Status: complete for every non-external requirement; push confirmation is
recorded by the following evidence ledger commit.

- implementation commit: `4ecce6a6ddb198b2fc251e3c5ed0bb4a95b66fe7`

Implemented:

- added one strict, ordered, content-addressed V2 route-gate report derived
  from the canonical repository source candidate rather than a caller-supplied
  pass declaration;
- covered legal/terms, source ingest/security, checkpoint ingest/hash/security,
  strict compatibility, offline closure, immutable image, V2 session runtime,
  A100, conditional L4, current rate, and private privacy-quality gates;
- enforced that internal qualification needs all active gates plus actual
  checkpoint bytes, strict load, real A100 inference, and a nonzero real SAM
  request count;
- enforced that production authority cannot exceed internal authority and a
  production-qualified route receipt;
- made the L4 gate not-applicable only when L4 is explicitly inactive;
- rejected missing/injected evidence as real gate evidence and rejected a
  forged internal qualification status;
- preserved all existing V1 artifact-ingest, compatibility, image, runtime,
  and historical authority code unchanged.

Actual checks run:

- `npm run test:track-all-sam3.1-route-gates` — passed; report hash
  `8aef95a45077ed81cf395e6e0443dfb54ab150e1629c24afd740d08e61aee27d`,
  11 required gates, 1 passed repository source/operation gate, 10 blocked
  external/private gates, zero checkpoint bytes, zero strict loads, zero A100
  or L4 inference, and zero SAM requests.
- `npm run test:track-all-sam3.1-operation-authority` — passed and preserved
  operation authority hash
  `cd6f408a7328ff3a4d54e054dd29b7438d8571533e67003856b5c84bfc4d1a1a`.
- `npm run typecheck:server` — passed.
- `npm run lint -- --quiet` — passed after the full ESLint process completed.
- staged `git diff --check` — passed.

The exact external blocker is authorized human access/approval for the gated
official checkpoint followed by exact private hash/security evidence,
strict-load compatibility, immutable signed runtime images, and real private
A100/L4 runtime/quality/cost/privacy evidence. Track All remains
`implementation_pending` and the SAM route remains `blocked`. No checkpoint,
model, GPU, paid, public, production, database, or head-orchestra action
occurred.

## TRACK-09 — stateful session ownership and injected masklet ingestion

Status: complete for the internal injected route; push confirmation is recorded
by the following evidence ledger commit.

- implementation commit: `81f285664fb30af811622f6964a75390e7813b2f`

Implemented:

- an internal-fixture-only session owner with explicit dependency-injected
  private persistence and no hard-coded production store;
- one writer per session, exact plan/assignment/lease lineage, create-only
  event sequence, same-owner replay, cross-owner reconciliation, and
  conflicting-writer rejection;
- lifecycle evidence for start, prompt, propagation, removal/reset/cancel
  plans, private output persistence, terminal observation, and exactly one
  terminal close;
- close-in-finally behavior after completion, failure, cancellation, timeout,
  unknown-outcome reconciliation, and partial output;
- strict, content-addressed private multi-object masklet manifests and private
  binary references with exact range, frame count, geometry, tenant, and
  checksum authority;
- separately classified injected attempt evidence with zero model requests,
  no checkpoint strict-load claim, no CUDA claim, no public artifacts, and no
  production mutation;
- a fail-closed canonical-private availability guard requiring a validated
  internally qualified V2 route report and durable private storage;
- a current operator runbook for deterministic, SAM contract/gate/injected,
  blocker, reconciliation, and terminal-close behavior.

Actual checks run:

- `npm run test:track-all-sam3.1-injected-session` — passed; 6 success events,
  exact private object persistence, same-owner idempotent replay, another-owner
  reconciliation, conflicting-writer rejection, failure/cancellation closure,
  timeout/reconciliation/partial-output closure, bad-object failure closure,
  zero SAM requests, zero public artifacts, and zero production mutations.
- `npm run test:track-all-sam3.1-operation-authority` — passed 21 adversarial
  authority cases plus all six terminal evidence dispositions.
- `npm run test:track-all-sam3.1-route-gates` — passed with the real route
  still blocked and zero real evidence.
- `npm run test:track-all-artifact-contracts` — passed 32 strict public
  artifacts, private-mask policy, and Track Graph V1/V2 compatibility.
- `npm run typecheck:server` — passed after the complete process exited `0`.
- affected-file ESLint — passed with exit `0`.
- staged `git diff --check` — passed.

Injected masklets prove lifecycle, persistence, closure, and evidence
separation only. They do not prove target quality, temporal quality, checkpoint
compatibility, GPU performance, or actual SAM inference. Aggregate Track All
remains `implementation_pending`; the SAM route remains `blocked`. No real
checkpoint/model/GPU/paid/public/production/database/head-orchestra action
occurred.

## TRACK-10 — chunk stitching and anonymous identity graph

Status: complete and awaiting the following evidence-ledger push confirmation.

- implementation commit: `8a3d0b5cf6f62852831c66e6318dd0aa2a06f9d6`

Implemented:

- deterministic overlap association using exact frame IoU and center geometry,
  plus a bounded two-second gap/re-entry score;
- stable semantic anonymous IDs independent of local SAM object numbers;
- duplicate reconciliation across Object Multiplex buckets while preventing
  same-bucket identities from collapsing;
- dynamic shot/chunk/bucket authority, multi-bucket/session evidence, and
  exact target-count enforcement;
- explicit lost spans, reacquisition, partial/full occlusion, occlusion event
  logs, re-entry evidence, and conflict/ambiguity identity-switch warnings;
- default shot-cut identity reset and optional explicit evidence-qualified
  cross-shot linkage that remains marked uncertain rather than certain;
- deterministic parent/child association from overlapping containment
  geometry;
- strict sample, box, private mask-sequence, occlusion, and identity-lineage
  artifacts plus content-addressed Track Graph V2 and frozen V1 projection;
- fail-closed rejection of duplicate observations, invalid/reordered ranges,
  bad bucket authority, over-count targets, invalid parents, and cross-tenant
  mask/runtime/QA references.

Actual checks run:

- `npm run test:track-all-chunk-identity` — passed; graph hash
  `e610beb243816cfb48057277c7a3727d6c1d118881df6b95591d617d51cf2688`,
  5 stable tracks over 4 chunk/bucket records, 2 buckets, 8 planned sessions,
  one re-entry, parent/child lineage, similar-person crossing continuity,
  default shot reset, explicit uncertain cross-shot linkage, V1 compatibility,
  and 9 adversarial cases.
- `npm run test:track-all-artifact-contracts` — passed all 32 strict active
  outputs and private-mask boundaries.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-active-artifact-contracts`
  — passed all 29 frozen B-Roll active contracts.
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-public-plugin`
  — passed the frozen public V1 Track Graph consumer boundary.
- `npm run typecheck:server` — passed with exit `0`.
- affected-file ESLint — passed with exit `0`.
- staged `git diff --check` — passed.

TRACK-10 uses deterministic/injected observation evidence and does not promote
the real SAM route. Track All remains `implementation_pending`, SAM remains
`blocked`, and no checkpoint/model/GPU/paid/public/production/database or head
orchestra action occurred.

## TRACK-11 — fail-closed privacy redaction

Status: complete and remotely confirmed.

- implementation commit: `9af2ac03d9cf2a43061def8f842c04770e948485`
- remote confirmation: `origin/codex/track-all-skill-end-to-end` resolved to
  `9af2ac03d9cf2a43061def8f842c04770e948485` after `git push -u origin HEAD`.

Implemented:

- strict Track Graph V2, box-sequence, FFprobe source-truth, assignment,
  timing, privacy-policy, tenant, checksum, and authorized-range validation;
- reliable-region dilation, stronger partial-occlusion dilation, explicit
  reflection coverage, and full-frame conservative covers for missing,
  low-confidence, fully occluded, lost, or identity-uncertain frames;
- fixed Gaussian blur, pixelation, mosaic, and solid-fill recipes, with any
  uncertainty automatically promoting the effective treatment to solid fill;
- a server-owned `approved_track_all_privacy_redaction_matroska_v1` FFmpeg
  boundary that accepts no caller filter, command, path, URL, codec, model,
  GPU, retry, fallback, destination, or public-output selection;
- actual private VP9/Matroska execution in the networkless, read-only,
  non-root FFmpeg image and a forward-only v10 image authority containing
  only the four newly required LGPL/core filters;
- independently decoded source/output RGB inspection, content-addressed
  privacy QA, immutable private result receipt, and fail-closed rejection of
  forged evidence, unchanged previews, missing reflection/lost-track coverage,
  public output, cross-workspace data, and out-of-range mutation.

Actual checks run:

- `npm run test:track-all-privacy-redaction` — passed all four real host
  FFmpeg treatments and the confined private runtime path; conservative
  inspection hash
  `268949464cf397dc0ebd99d61268448fc485810336a0fb77da741c19b1574bcc`,
  privacy-QA hash
  `7f48255c1551f2d7b659a1cbf1b54d9ce7a36af9f09228780bc8921f8e05596c`,
  result hash
  `d9bf9abb72719bf31dced117d7602ff08c98bf416cd0e0190ba7431d46f59f4e`,
  and no public artifact or outside-range mutation;
- `docker/prod/ffmpeg-lgpl-runtime/smoke.sh --build` — passed exact component
  allowlists and the actual masked-redaction probe; OCI image ID
  `sha256:838af9025e941b7d6b936e0cf7820b579e752bfc983c9479bf67bf201ff2d2c6`
  and image identity hash
  `6711a15ed2e9a81937aa6cad53667d0887bf7839fa31c5e6fdb25f8b73dd0149`;
- `npm run smoke:offline-media-binary-execution` — passed the complete pinned
  media-runtime regression after the v10 authority promotion;
- every TRACK-02 through TRACK-11 Track All smoke — passed;
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-canonical-private-runtime`
  and `smoke:b-roll-remotion-integration` — passed without a provider call;
- `npm run typecheck:server`, `npm run lint`, and
  `npm run check:frontend-boundary` — passed;
- staged `git diff --check` — passed.

This milestone qualifies only the deterministic private privacy execution
fixture. It does not prove real SAM 3.1 target/temporal quality or real-world
production privacy performance. Track All remains `implementation_pending`,
the SAM route remains `blocked`, and no real checkpoint/model/GPU/paid/public/
production/database/head-orchestra action occurred.

## TRACK-12 — tracked focus and reframe

Status: complete and remotely confirmed.

- implementation commit: `ccf67a7f401d7fc30398ea2628e3c9f3224919c6`
- remote confirmation: `origin/codex/track-all-skill-end-to-end` resolved to
  `ccf67a7f401d7fc30398ea2628e3c9f3224919c6` after `git push -u origin HEAD`.

Implemented:

- all eight bounded simple focus modes, contiguous product/speaker handoffs,
  confidence-derived full-frame restraint, and strict Track Graph/box lineage;
- per-frame `16:9`, `9:16`, `1:1`, and `4:5` reframe trajectories with
  multi-target union bounds, headroom, directional lead room, smoothing,
  caption safe-zone projection, zoom ceilings, and explicit low-confidence
  behavior;
- a strict `caption_reserved_zones_v1` public artifact contract owned by the
  public schema layer rather than a private mini-skill;
- fixed private `track_all_private_treatment_preview_v1` Remotion authority
  with exact committed source bytes, one canonical sample per frame, captions
  above Track All, audio removed, public output forbidden, and no caller
  command/path/URL/executable/model/GPU/retry/fallback controls;
- actual Remotion source-media composition for tracked focus and reframe,
  independent runtime/attestation/frame-golden integration QA, private focus
  result receipts, model-neutral reframe trajectory receipts, and final Render
  ownership preserved.

Actual checks run:

- `npm run test:track-all-focus-reframe` — passed all eight focus plans, a
  product-to-speaker handoff, speaker-follow `9:16`, two-target `16:9`, safe
  zones, zoom restraint, actual Remotion `4.0.487` focus/reframe renders, six
  PNG frame goldens, forged/cross-tenant/caller-input rejection, zero public
  artifacts, and zero production mutations; stable focus plan hash
  `29014edf686e779878203ab00dd687dc141ded577de4abfe0ed6bddd5ebe5ee4`,
  speaker reframe plan hash
  `c63fcb24f98fd6a27155e3b23a6874cdc813dee8638e5ac13efd0536c270ed60`,
  and two-target reframe plan hash
  `0ebb3859ab6bd31f5ac3dc15a87f77798f41bae55a3deaced83e86dd7e44b47e`;
- `npm run smoke:offline-remotion-render-execution` — passed the complete
  actual Remotion image/confinement/composition regression;
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run smoke:b-roll-remotion-integration`
  — passed the frozen B-Roll integration with exact V1 Track Graph support;
- Track All manifest, authority, planning, artifact, deterministic geometry,
  chunk/identity, and privacy smokes — passed;
- `node --check docker/prod/offline-remotion-render-execution/runner.mjs`,
  `npm run typecheck:server`, `npm run lint`, and
  `npm run check:frontend-boundary` — passed;
- staged `git diff --check` — passed.

The deterministic focus/reframe route has actual private Remotion execution
evidence but no production-qualified mask-isolation, worker/store, or release
evidence. Track All remains `implementation_pending`, SAM remains `blocked`,
and no checkpoint/model/GPU/paid/public/production/database/head-orchestra
action occurred.

## TRACK-13 — cross-skill geometry handoffs

Status: complete and remotely confirmed.

- implementation commit: `71b1a0b0897e433d7bebeb4fe2276f41873d2dba`
- remote confirmation: `origin/codex/track-all-skill-end-to-end` resolved to
  `71b1a0b0897e433d7bebeb4fe2276f41873d2dba` after `git push -u origin HEAD`.

Implemented:

- one strict, discriminated, content-addressed geometry handoff for each of
  B-Roll, Captions, Graphic Design, Living Frame, 3D, Color, Sound,
  Transition, and Render;
- exact Track Graph V2 and box/mask/anchor/camera/planar artifact validation,
  including assignment, plan, manifest, source, tenant, and range lineage;
- the frozen Track Graph V1 projection for B-Roll while retaining V2 for new
  consumers;
- speaker/inset/crop geometry for B-Roll, foreground/behind-subject/face-safe
  geometry for Captions, stable anchors for Graphic Design, depth/camera
  geometry for Living Frame, planar/occlusion geometry for 3D, selective
  masks for Color, interaction timing for Sound, wipe geometry for
  Transition, and exact private layer requirements for Render;
- peer ownership preservation: Track All supplies geometry but does not own
  final Caption, Graphic, Color, Sound, Transition, Render, or export design;
- strict rejection of generic/model-specific payload fields, mismatched
  consumer payloads, cross-workspace references, forged referenced artifacts,
  and frame evidence outside the authorized range.

Actual checks run:

- `npm run test:track-all-cross-skill-handoffs` — passed 9 consumer handoffs;
  Track Graph V2 hash
  `8ed6517bff546740c897a232f23b3aafb23be4165df627be0b1859c421e2b2d1`,
  exact V1 compatibility, 9 unique handoff hashes, model-specific dependency
  rejection, cross-workspace rejection, peer ownership preservation, no
  outside-range mutation, and zero provider/public/production actions;
- `npm run test:track-all-artifact-contracts` — passed 32 strict active
  schemas and the private-mask boundary;
- `npm run test:track-all-capability-manifest` — passed 13 supported jobs,
  20 unsupported jobs, 8 routes, and manifest hash
  `65eb6541aafc312f390479273d196aaa5f2db5cd52cba898dd9165a88f7a5998`;
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-active-artifact-contracts`
  — passed all 29 frozen B-Roll active contracts;
- `REEDITPRO_BROLL_QUALIFICATION_GENERATING=1 npm run test:b-roll-public-plugin`
  — passed the frozen B-Roll public plugin and V1 Track Graph dependency;
- `npm run typecheck:server`, `npm run lint -- --quiet`, and
  `npm run check:frontend-boundary` — passed;
- staged `git diff --check` — passed.

TRACK-13 does not dispatch or implement peer skills or the head orchestra.
Track All remains `implementation_pending`, SAM remains `blocked`, and no
checkpoint/model/GPU/paid/public/production/database action occurred.

## TRACK-14 — independently derived QA and bounded repair

Status: complete and remotely confirmed.

- implementation commit: `3c7deff2c659581379a58cee92cba37550e43400`
- remote confirmation: `origin/codex/track-all-skill-end-to-end` resolved to
  `3c7deff2c659581379a58cee92cba37550e43400` after `git push -u origin HEAD`.

Implemented:

- strict content-addressed target, mask, seam, identity, and integration
  measurement contracts with fixed producer operation identities and no raw
  pass boolean;
- independently derived target alignment/exclusion/count, temporal gap/jump/
  shot-reset, mask coverage/leakage/flicker/edge/hole/fragment/blur, chunk
  seam, anonymous identity-switch, camera/planar, ownership/range/source/
  timing/layer/private-output/final-lineage findings;
- report-schema enforcement that derives the aggregate disposition from the
  worst exact hashed finding and rejects an inconsistent freshly rehashed
  report;
- privacy QA failure artifacts from actual decoded-pixel evidence, with final
  redaction acceptance still failing closed unless the exact report passes;
- a bounded repair director that chooses actions from failed evidence rather
  than caller selection, binds the exact Track Graph and reports, permits one
  automatic repair, requires exact same-tenant selection authority for repair
  two, and rejects repair three;
- positive-point, negative-point, box, local-retrack, conservative privacy
  expansion, overlap increase, identity reassignment, planar recalculation,
  and user-selection repair decisions plus fresh post-repair QA acceptance.

Actual checks run:

- `npm run test:track-all-independent-qa-repair` — passed; QA bundle hash
  `29828a1e0305073fc69f4280389b271acb10f3d53f178b626c4f269ac0fad015`,
  six strict report artifacts plus camera/planar findings, raw-boolean and
  forged-measurement rejection, inconsistent-disposition rejection, nine
  repair paths, conservative accepted repair hash
  `85623e051351bd5f6a68c8aea8ab424c55d270543183efde948c13a3067f1909`,
  manual approval for repair two, and rejection of repair three;
- `npm run test:track-all-privacy-redaction` — passed actual FFmpeg treatments,
  critical evidence for an unchanged preview, exact finalization rejection,
  conservative coverage, reflections, and private output;
- `npm run test:track-all-focus-reframe` — passed all eight treatments and
  actual private Remotion focus/reframe integration after the report-schema
  hardening;
- Track All artifact, planning, chunk/identity, deterministic geometry, and
  capability-manifest smokes — passed;
- frozen B-Roll active-artifact and public-plugin smokes — passed under the
  qualification-generation gate;
- `npm run typecheck:server`, `npm run lint -- --quiet`, and
  `npm run check:frontend-boundary` — passed;
- staged `git diff --check` — passed.

TRACK-14 independently qualifies the implemented fixture/deterministic QA
logic; it does not promote actual SAM inference. Track All remains
`implementation_pending`, SAM remains `blocked`, and no checkpoint/model/GPU/
paid/public/production/database/head-orchestra action occurred.
