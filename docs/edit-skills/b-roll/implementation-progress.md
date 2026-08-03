# B-roll implementation progress

Branch: `codex/reeditpro-b-roll-skill-end-to-end`

Integration base: `4e57b8725134d4d7837b41910757f0a3dcafcbe1`
(`origin/codex/backend-workflow-pipeline-continuation` at reconciliation)

Qualification claims remain evidence-driven. The status shown after a
milestone is the highest level actually proved, not the intended release
level.

## M0 — repository reconciliation and baseline

Status: completed and pushed.

Implementation commit: `ca25f01035590ba86f62fb2273c8299924610dcc`

Remote confirmation: `origin/codex/reeditpro-b-roll-skill-end-to-end` resolved
to the implementation commit after push.

### Reconciliation

- Preserved the original `/Volumes/backup/REeditpro` worktree with its unrelated
  uncommitted changes.
- Selected the repository's current canonical remote continuation as the
  integration base and created an isolated clean worktree at
  `/Users/macuser/Documents/REeditpro-b-roll-skill-end-to-end`.
- Audited current B-roll, Creative Skill, canonical plan/snapshot/work-graph,
  provider V1-V4, private artifact, QA, Remotion, source-only, and legacy Wan
  branch surfaces.
- Chose a forward-only provider V5 module and one canonical `b_roll` runtime.
- Recorded the keep/refactor/retire map and architecture decision.

### Baseline evidence

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 477 packages, 0 vulnerabilities. Five dependency install scripts remained unapproved. |
| `npm run build` | Passed; existing Vite chunk-size and dynamic-import warnings only. |
| `npm run typecheck:server` | Passed. |
| `npm run lint` | Passed. |
| `npm run check:frontend-boundary` | Passed for 1,044 frontend files. |
| `npm run smoke:canonical-source-led-plan-compiler` | Passed: 2 sources, 60 frames, 9 publication work items, 6 adversarial assertions. |
| `npm run smoke:canonical-private-provider-work-lifecycle` | Passed with zero provider, secret, cloud, Supabase, or billing mutations. |
| `npm run smoke:canonical-provider-attempt-runtime-record` | Passed, including unknown-outcome reconciliation with zero provider requests. |
| `npm run smoke:private-artifact-qa-authority` | Passed. |
| `npm run smoke:offline-remotion-render-execution` | Passed real local confined render and FFprobe verification: 640x360, 24fps, 24 frames. |

Canonical provider registry hashes captured before implementation:

- V1 `17928478279cc8fd292db235286ae883db2434d79d015e7a16bfadc1a4bde1bd`
- V2 `6fbfdef538e3bc9ecb944892586e7eac154f518bdf1df1d3f15bbe3a9fb32d18`
- V3 `284b456da2610af6280e080bc9cb24c10989f2ee3401bd2711619622544bfd2b`
- V4 `91ea2d40a33f5198f124d6322b61e447bb29ea037dabb808b2f39887cd432eeb`

Known pre-existing unrelated failures: none in the executed baseline. The
baseline did not claim live Supabase, GCS, IAM, distributed worker, public
delivery, production billing, or real provider execution evidence.

Qualification after M0: `implementation_pending`.

## M1 — generic edit-skill capability kernel

Status: completed and pushed.

Implementation commit: `ac8fcc6f3b1be4f584f2bed804a769f3e340b667`.

Remote confirmation: the branch advanced to the implementation commit after
push.

Implemented strict manifest, manifest-reference, assignment, range,
context/dependency, plan/result envelope, qualification receipt, estimator,
QA, artifact-schema, runtime-handler, invocation, and static-validator
contracts under `server/edit-skills/core/`. Manifests are plain-data only,
canonically serialized, SHA-256 addressed, recursively frozen, and exact-ref
resolved. The validator rejects duplicate skill/version and route identities,
unknown registries, missing job/artifact implementations, missing handlers,
and cyclic phase authority.

Added the repository-wide
`validate:skill-capability-manifests` command, manifest documentation projection
support, and a kernel smoke covering deterministic hashes, function rejection,
deep freezing, tenant-scoped artifact reads, stale range rejection, bounded
invocation, duplicate registration, unimplemented jobs, phase cycles, and
forged/overclaimed qualification evidence.

Tests:

- `npm run test:edit-skill-capability-kernel` — passed.
- `npm run validate:skill-capability-manifests` — passed (zero production
  manifests until M2 registration).
- `npm run typecheck:server` — passed.
- `npm run lint` — passed.
- `npm run check:frontend-boundary` — passed for 1,044 files.

Known pre-existing unrelated failures: none in the affected checks.

Qualification after M1: `implementation_pending`.

## M2 — canonical B-roll manifest and qualification plan

Status: completed and pushed.

Implementation commit: `a1a73b0ca7b9efc4007c8c0c17777e69984142a2`.

Remote confirmation: the branch advanced to the implementation commit after
push.

Registered the only global B-roll identity as `b_roll@1.0.0` with contract
`b_roll.skill_contract.v1`. The deep-frozen manifest declares 13 implemented
job identities, 14 accepted and 12 produced artifact contracts, 42 planning,
output, and integration QA policies, exact execution phases and ownership
rules, source/provider/tool/no-action routes, one-initial/one-refinement attempt
limits, invalidation and revision rules, 41 qualification fixtures, and known
Gemini Omni, proof, frame, regional, tracking, provider, and ownership
limitations.

The runtime registry now resolves the exact manifest, schemas, estimator keys,
QA keys, job/operation/phase identities, disabled pre-qualification handler,
and an evidence-bound `implementation_pending` qualification receipt. The
read-only JSON documentation projection is generated from TypeScript and its
bytes are tested against the canonical projection. Retired Wan, Hailuo, Veo,
Kling, and stock routes are absent from active B-roll routing.

Tests:

- `npm run generate:b-roll-capability-manifest` — passed; manifest hash
  `5ae77ec86950f70aee64424c370e2eb646e68675d1a9a2f9283cea4f51ae09c3`.
- `npm run validate:skill-capability-manifests` — passed with one manifest.
- `npm run test:b-roll-capability-manifest` — passed: 41 qualification
  fixtures, 13 jobs, 42 QA policies.
- `npm run test:edit-skill-capability-kernel` — passed.
- `npm run typecheck:server` — passed.
- `npm run lint` — passed.
- `npm run check:frontend-boundary` — passed for 1,044 files.

Known pre-existing unrelated failures: none in the affected checks.

Qualification after M2: `implementation_pending`; planning invocation remains
explicitly disabled until M3 evidence passes.

## M3 — B-roll contracts and deterministic planning mini-skills

Status: completed and pushed.

Implementation commit: `e13e2907acebf65e383c5cd1e01262ff87a799ab`.

Remote confirmation: the branch advanced to the implementation commit after
push.

Implemented immutable B-roll assignment and separate whole-video read-context
versus exact write-range authority; tenant/project and master-timing checks;
strict planning context, source candidate, shot specification, coordination,
and plan contracts; and independently testable assignment guard, context
reader, restraint, editorial role, source scoring/routing, concept, shot,
timing/composition, cross-skill, and Omni request-planning mini-skills.

The planner now returns professional no-action, existing project source,
approved user asset, Gemini Omni generation/edit planning, Track All
dependency, user-confirmation, and blocked dispositions. It prefers source and
no-action routes, prevents generated proof, rejects repeated concepts, handles
regional edit ineligibility and non-native aspect ratios conservatively,
preserves caption and cross-skill ownership, produces exact range-bounded
plans, and can run through the generic manifest-gated invocation service with
content-addressed assignment/context/plan artifacts.

Planning qualification fixtures pass for emotional no-action, zero-provider
existing source, approved user asset, generated context, generated-proof
rejection, range overreach, whole-video read-only context, primary visual
conflict, caption-safe behavior, tracking present/missing, concept repetition,
regional eligibility, crop-safe non-native frames, and audio handoff. The
manifest and generated projection advanced to hash
`8ae1688bb9779be10f59e17553b86281cdaccaf52600c367bea1cbf496369b11`.

Tests:

- `npm run test:b-roll-planning` — passed all planning qualification fixtures.
- `npm run validate:skill-capability-manifests` — passed with one manifest.
- `npm run test:b-roll-capability-manifest` — passed.
- `npm run test:edit-skill-capability-kernel` — passed.
- `npm run typecheck:server` — passed.
- `npm run lint` — passed.
- `npm run check:frontend-boundary` — passed for 1,044 files.

Known pre-existing unrelated failures: none in the affected checks.

Qualification after M3: `planning_qualified`. No provider, media worker,
render, billing, wallet, cloud, or production operation was executed.

## M4 — orchestra and canonical-plan integration

Status: completed and pushed.

Implementation commit: `78d0a6e07`.

Remote confirmation: `origin/codex/reeditpro-b-roll-skill-end-to-end` resolved
to the implementation commit after push.

Added the separate manifest-gated B-roll publication path without changing the
conservative source-only compiler. Exact assignment, context, plan, work graph,
qualification, manifest, scope, and frame-range authority are stored as private
content-addressed artifacts behind a typed `bRollSkill` canonical-plan
component. The component reference is create-only and is asserted unchanged
when copied from plan to approved snapshot and execution package.

The B-roll compiler now produces exact atomic canonical work items with one
operation and output per item, explicit dependencies, approved tool/provider
identity, cost and attempt ceilings, QA lineage, caller-executable prohibition,
and the assignment's exact authorized range. Generated plans produce the
11-step graph; existing-source and approved-user-asset plans omit provider
generation; no-action, blocked, dependency-missing, and confirmation-required
plans produce a three-item restraint graph with no media/provider authority.
Publication, approval, and execution-package loading re-read and revalidate the
content-addressed component and reject stale hashes, altered work items,
cross-scope components, dropped refs, and range overreach.

The manifest and generated projection advanced to hash
`df52bf911e5d55cd9f373331e30d15965ee64cf192bfa1a44281f13d47f72b65`
after reconciling its FFprobe and Remotion routes with the repository's exact
canonical operation identities.

Tests:

- `npm run test:b-roll-canonical-integration` — passed generated, existing,
  no-action, confirmation-required, tamper, range, persistence, and exact
  plan/snapshot/package ref-propagation assertions.
- `npm run test:b-roll-planning` — passed.
- `npm run smoke:canonical-source-led-plan-compiler` — passed unchanged with
  9 publication work items and 6 adversarial assertions.
- `npm run generate:b-roll-capability-manifest` — passed.
- `npm run validate:skill-capability-manifests` — passed with one manifest.
- `npm run test:b-roll-capability-manifest` — passed.
- `npm run test:edit-skill-capability-kernel` — passed.
- `npm run typecheck:server` — passed.
- `npm run build` — passed; existing Vite chunk-size and dynamic-import
  warnings only.
- `npm run lint` — passed.
- `npm run check:frontend-boundary` — passed for 1,044 files.
- `git diff --check` — passed.

Known pre-existing unrelated failures: none. One initially mistyped local test
command (`test:edit-skill-kernel`) did not exist; the repository's correct
`test:edit-skill-capability-kernel` command was then run and passed.

Qualification after M4: `planning_qualified`. Canonical execution authority is
now persisted and immutable, but no provider request, media execution, render,
billing, wallet, cloud, or production operation was executed.

## M5 — existing-source execution route

Status: completed and pushed.

Implementation commit: `ff76daff6`.

Remote confirmation: `origin/codex/reeditpro-b-roll-skill-end-to-end` resolved
to the implementation commit after push.

Implemented a private internal existing-source executor that revalidates the
exact content-addressed B-roll component, plan/snapshot/package component ref,
assignment, context, source selection, provenance, rights, privacy, proof
safety, user approval, source checksum, source trim, timeline duration, work
graph, reservation state, and authorized range before media work. The executor
has no provider request port; a read-only request counter is asserted unchanged
across execution and persisted as zero in QA and result evidence.

The source is inspected with the repository's pinned network-disabled FFprobe
8.1.2 runtime and trimmed/normalized with its fixed
`approved_trim_transcode_v1` FFmpeg recipe. The exact 72-frame FFV1/NUT private
candidate is create-only and content-addressed. Source inspection, source QA,
B-roll layer, private source-trim preview, and final result receipts are strict
hashed JSON artifacts. The preview is an isolated private playback window over
the approved MP4 source; composite Remotion preview remains explicitly required
for M9. Same-idempotency replay returns the exact committed result without new
media or provider work.

Tests:

- `npm run smoke:b-roll-existing-source` — passed real FFprobe and FFmpeg
  execution, 72-frame normalization, private artifact persistence, source QA,
  layer/preview/result lineage, deterministic replay, source-byte substitution,
  cross-workspace substitution, and exactly zero provider requests.
- `npm run test:b-roll-canonical-integration` — passed.
- `npm run test:b-roll-planning` — passed.
- `npm run smoke:canonical-source-led-plan-compiler` — passed unchanged.
- `npm run validate:skill-capability-manifests` — passed.
- `npm run test:b-roll-capability-manifest` — passed.
- `npm run typecheck:server` — passed.
- `npm run lint` — passed.
- `npm run check:frontend-boundary` — passed for 1,044 files.
- `npm run build` — passed; existing Vite chunk-size and dynamic-import
  warnings only.
- `git diff --check` — passed.

Known pre-existing unrelated failures: none.

Qualification after M5: `planning_qualified`. The existing-source execution
fixture is proved, but the manifest is not promoted until the complete internal
execution fixture suite, provider lifecycle, QA/refinement, and Remotion
integration evidence pass. No provider, paid API, billing, wallet, cloud,
Supabase, final composition, or final export action occurred.

## M6 — Gemini Omni B-roll V5 authority

Status: completed and pushed.

Implementation commit: `b641e6f98`.

Remote confirmation: `origin/codex/reeditpro-b-roll-skill-end-to-end` resolved
to the implementation commit after push.

Added a clean forward-only provider module for
`provider.google.generate_b_roll_candidate.v1` without modifying the historical
V1-V4 authority file. V5 centralizes the preview model alias
`gemini-omni-flash-preview`, distinguishes the configured alias from the absent
immutable provider revision, and keeps live transport and production
qualification disabled. The strict server-owned request package binds the
manifest, assignment, plan, exact frame range, source reference, supported
task mode, one continuous shot, crop-safe aspect ratio, 720p/24fps duration,
full shot specification, avoid rules, and caller-input prohibitions.

The V5 lifecycle policy and authorization bind the exact approved snapshot,
execution package, reservation, B-roll component ref, work graph, provider work
item, expected raw MP4 output, request-package hash, injected rate authority,
cost ceilings, and idempotency identity. The injected lifecycle implements a
bounded worker lease, consumed one-use dispatch credential hash, create-only
private MP4 output, checksum readback, provider/infrastructure cost separation,
failed/unknown cost retention, exact replay, no retry or fallback, unknown
outcome reconciliation without a second submission, and a source-verified
consumer receipt that forbids automatic selection and timeline mutation. Its
accounting distinguishes zero actual provider requests from injected simulated
request history.

The canonical shot contract now includes framing, camera motion, lens/depth,
lighting, color mood, exact frame/second duration, aspect ratio, audio intent,
continuity, crop-safe subject area, and transformation class. The provider work
item now owns the distinct raw `provider_b_roll_candidate_video_mp4` artifact;
later FFmpeg normalization continues to own `b_roll_candidate_version_v1`.
The manifest and generated projection advanced to hash
`cac07f070ba3b9e485339625d12a19c77b1f809c78c96858433defb490f51539`.

Tests:

- `npm run smoke:b-roll-provider-authority` — passed V5 registry, lifecycle
  policy, request/authorization lineage, create-only private output, zero actual
  provider requests, internal-cost separation, exact replay, one-use dispatch,
  unknown reconciliation, stale rate, caller raw-input, route/model/request,
  cross-workspace substitution, consumer receipt, and historical registry hash
  assertions.
- Historical registry hashes remained exactly V1 `17928478…`, V2 `6fbfdef5…`,
  V3 `284b456d…`, and V4 `91ea2d40…`.
- `npm run generate:b-roll-capability-manifest` — passed.
- `npm run validate:skill-capability-manifests` — passed with one manifest.
- `npm run test:b-roll-capability-manifest` — passed: 41 fixtures, 13 jobs,
  and 42 QA policies.
- `npm run test:b-roll-planning` — passed.
- `npm run test:b-roll-canonical-integration` — passed.
- `npm run smoke:b-roll-existing-source` — passed real FFprobe/FFmpeg execution
  with zero provider requests.
- `npm run typecheck:server` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; existing Vite chunk-size and dynamic-import
  warnings only.
- `git diff --check` — passed.

Known pre-existing unrelated failures: none. One initially attempted local
script name (`check:types`) did not exist; the repository's applicable
`typecheck:server` command was run and passed.

Qualification after M6: `planning_qualified`. The V5 authority and injected
private lifecycle are proved, but the preview alias has no immutable accepted
revision, transport is inactive, provider account/rate/secret evidence is not
qualified, and no paid provider, billing, wallet, cloud, Supabase, public
delivery, timeline mutation, or production action occurred.

## M7 — real Gemini Omni transport

Status: completed and pushed; live canary blocked only by external gates.

Implementation commit: `751ed2055`.

Remote confirmation: `origin/codex/reeditpro-b-roll-skill-end-to-end` resolved
to the implementation commit after push.

Implemented the official server-side Gemini Omni Flash Interactions and Files
API transport behind exact private owner-confirmed canary authority. The
transport supports text-to-video, approved reference-image-to-video, and
region-eligible checksum-bound uploaded-video editing; inline and URI output;
official resumable upload; bounded source/result file status, interaction
status, and binary download; a one-read pinned numeric Secret Manager boundary;
sanitized failure classification; provider-usage hashing; separate unqualified
canary provider-rate and infrastructure-cost evidence; private create-only MP4
ingest and checksum readback; exact request counters; idempotent replay; and
bounded unknown-outcome reconciliation without a second generation submission.

Model, endpoint, credential, raw body, upload path, provider URL, temporary
download URL, polling limits, retry count, fallback route, and executable
remain server-owned. Redirects, automatic retries, and alternate-provider
fallbacks are zero. Raw secrets, headers, request bodies, responses, and URLs
are not persisted. The active cloud route/resource map now recognizes
`gemini_omni_flash` and the approved Gemini Secret Manager identity. The
preview alias remains unpinned and neither the canary rate nor transport is
production-qualified.

The explicitly gated `canary:gemini-omni-b-roll` command owns a built-in safe
three-second fixture and requires exact execution confirmation, fixture ID,
pinned secret reference, rate, cost ceiling, and absolute private destination.
In this environment it reported `blocked_external_prerequisites` for all six
gates, executed zero provider requests, and did not fake success. Transport and
canary architecture are recorded in
`docs/edit-skills/b-roll/gemini-omni-transport.md` against Google's current
official Omni and Files documentation.

Tests:

- `npm run smoke:b-roll-provider-lifecycle` — passed official request building,
  inline output, URI metadata/download, approved reference-image input and
  source substitution rejection, resumable uploaded-video edit and ACTIVE
  polling, single secret read, one generation submission, private readback,
  exact rate cost, sanitized persistence, replay, unknown manual disposition,
  and successful status reconciliation without resubmission.
- `npm run smoke:b-roll-provider-authority` — passed; historical V1-V4 hashes
  remained exact. Current B-roll V5 registry hash is `0d480ebe…`; lifecycle
  policy hash is `e5dbcc30…`.
- `npm run canary:gemini-omni-b-roll` — safely blocked with zero requests because
  the explicit confirmation, safe fixture, secret, private-root, cost, and rate
  gates are absent.
- `npm run test:b-roll-planning` — passed, including conservative source and
  tracking behavior after approved reference-image routing was enabled.
- `npm run test:b-roll-canonical-integration` — passed.
- `npm run check:frontend-boundary` — passed for 1,044 files.
- `npm run typecheck:server` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; existing Vite chunk-size and dynamic-import
  warnings only.
- `git diff --check` — passed.

Known pre-existing unrelated failures: none.

Qualification after M7: `planning_qualified`. Non-paid transport behavior is
internally qualified, but the live provider canary is blocked by explicitly
missing external prerequisites; the configured preview alias has no immutable
revision and provider account/rate/real usage evidence is absent. No paid
provider, billing, wallet, Supabase, public delivery, automatic selection,
customer timeline, or production action occurred.

## M8 — candidate QA and controlled refinement

Status: completed and pushed.

Implementation commit: `e218a4d57df412a8d0dd093820f339b0cba89d93`.

Remote confirmation: `origin/codex/reeditpro-b-roll-skill-end-to-end` resolved
to the implementation commit after push.

Implemented exact provider-attempt adaptation, private immutable candidate
versioning, output-QA reports, deterministic verdicts, source/no-action
fallbacks, and one bounded refinement. Every candidate remains bound to the
manifest, assignment, plan, concept, authorized range, provider request,
attempt, private MP4 checksum, separate provider/infrastructure cost evidence,
and automatic-selection/timeline-mutation prohibitions. Version 1 is the only
initial candidate, version 2 is the only refinement, and create-only replay
rejects media or QA substitution.

The exact private 720p/24fps MP4 now runs through pinned, network-disabled
FFprobe/FFmpeg 8.1.2 for container/stream/frame/duration/resolution inspection,
exact first/last-frame extraction, full decoded-frame black/freeze/motion QA,
and deterministic exact-duration FFV1/NUT normalization with audio removed.
The strict objective-QA protocol recognizes the canonical B-roll provider
operation/output pair while continuing to reject cross-pair substitutions.

Hashed internal visual observations cover semantic alignment, generated visual
integrity, subject/object consistency, plausible motion, camera intent, crop
safety, proof safety, content safety, and user-confirmation need. They are
explicitly internal injected evidence and do not claim a qualified production
visual-intelligence worker. Generated media is never proof, never
automatically selected, and its audio never silently enters the final mix.

The refinement authority binds prior candidate and QA refs/hashes, interaction
digest, route/model, concept, aspect ratio, duration, exact range, and provider
and infrastructure cost ceilings. It requires a new attempt and cost record;
permits one submission; rejects a second refinement, changed route/concept/range,
raw interaction substitution, retry, and alternate-provider fallback; and
builds the official `previous_interaction_id` request. The private injected
refinement path made zero provider requests.

Tests:

- `npm run smoke:b-roll-candidate-qa` — passed a real 720p decoded-media path:
  version 1 `needs_refinement`, version 2
  `accepted_after_normalization`, immutable replay, refinement cost ceiling,
  second-refinement rejection, forged semantic pass rejection, concept
  substitution rejection, source/no-action fallback, Sound handoff, and zero
  actual provider calls.
- `npm run smoke:offline-media-binary-visual-calibration-objective-qa` — passed
  moving media and rejected frozen media with full decoded-frame evidence.
- `npm run smoke:b-roll-provider-lifecycle` — passed unchanged.
- `npm run smoke:b-roll-provider-authority` — passed; historical V1-V4 hashes
  remained exact.
- `npm run test:b-roll-planning` — passed.
- `npm run test:b-roll-canonical-integration` — passed.
- `npm run smoke:b-roll-existing-source` — passed.
- `npm run validate:skill-capability-manifests` — passed with manifest hash
  `cac07f070ba3b9e485339625d12a19c77b1f809c78c96858433defb490f51539`.
- `npm run test:b-roll-capability-manifest` — passed.
- `npm run typecheck:server` — passed.
- `npm run lint` — passed.
- `npm run check:frontend-boundary` — passed for 1,044 files.
- `npm run build` — passed; existing Vite chunk-size and dynamic-import
  warnings only.
- `git diff --check` — passed.

Known pre-existing unrelated failures: none.

Qualification after M8: `planning_qualified`. The candidate QA/refinement path
is internally proved with real local media work and injected semantic/provider
evidence, but promotion waits for M9 Remotion/integration QA and M11 aggregate
qualification. The real provider canary remains externally blocked, the model
alias remains preview/unpinned, and no paid provider, public delivery, final
composition/export, billing, wallet, Supabase, or production action occurred.

## M9 — Remotion and cross-skill integration

Status: completed and pushed.

Implementation commit: `c8268a9d79fbbf7bbacdc315eddf244f703f1805`.

Remote confirmation: `origin/codex/reeditpro-b-roll-skill-end-to-end` resolved
to the implementation commit after push.

Implemented strict, hashed `BrollRemotionLayerManifest`, integration QA, and
result receipt contracts for accepted generated candidates and passed
existing-source selections. The executor revalidates assignment/plan hashes,
content-addressed artifact refs, exact write range, selected artifact bytes,
output QA lineage, caption dependency, and the optional model-neutral
`track_graph_v1`. Missing required tracking fails as a typed Track All
dependency; B-roll has no SAM2 or SAM 3.1 dependency.

The QA-normalized FFV1/NUT artifact is the editorial source of truth. A fixed
pinned, network-disabled FFmpeg recipe creates only the VP9 Matroska technical
proxy needed by Chromium, strips audio/metadata, preserves exact timing and
BT.709 intent, and forbids a creative color transform. Remotion validates and
actually applies fixed geometry for full-frame takeover, short cutaway, inset,
picture-in-picture, split-screen, partial overlay, and background treatments.
The real private preview is persisted create-only and rehashed on replay.

Sound, Color, Transition, Captions, Track All, and Render retain final
ownership. Content-addressed Sound/Color/Transition handoffs, eleven exact
integration QA checks, attempt history, candidate/integration cost separation,
private preview lineage, manifest hash, automatic-selection prohibition,
generated-proof prohibition, generated-audio final-mix prohibition, and
`outsideAuthorizedRangeModified: false` are frozen in the result receipt.

Tests:

- `npm run smoke:b-roll-remotion-integration` — passed real 72-frame FFmpeg and
  Docker-confined Remotion execution at 640x360/24fps, all seven treatment
  mappings, eleven integration QA checks, required Track All dependency,
  tamper rejection, immutable replay, all final-owner handoffs, and zero
  provider requests.
- `npm run smoke:offline-remotion-render-execution` — passed real shared
  Remotion regression. An initial concurrent Docker run collided during
  container creation; the isolated rerun passed with all assertions.
- `npm run smoke:offline-remotion-streaming-output` — passed the shared
  streamed-input/output regression after matching the B-roll layer boundary.
- `npm run smoke:offline-media-binary-execution` — passed the pinned FFmpeg and
  FFprobe runtime regression.
- `npm run smoke:b-roll-candidate-qa` — passed one-refinement QA and zero
  provider requests.
- `npm run smoke:b-roll-existing-source` — passed zero-provider source
  execution and replay.
- `npm run smoke:b-roll-provider-authority` and
  `npm run smoke:b-roll-provider-lifecycle` — passed; historical V1-V4 hashes
  remained exact.
- `npm run test:b-roll-planning`,
  `npm run test:b-roll-canonical-integration`,
  `npm run validate:skill-capability-manifests`, and
  `npm run test:b-roll-capability-manifest` — passed.
- `npm run typecheck:server`, `npm run lint`, `npm run build`,
  `npm run check:frontend-boundary`, and `git diff --check` — passed. Build
  emitted only the existing Vite chunk-size and dynamic-import warnings.

Known pre-existing unrelated failures: none. The one concurrent Docker
container-creation collision was environmental and passed immediately when the
shared Remotion smoke ran alone.

Qualification after M9: `planning_qualified`. Real private local media and
Remotion execution plus integration QA are proved, but aggregate promotion is
reserved for the complete M11 generated-route E2E fixture and qualification
receipt. The provider canary remains externally blocked and no paid provider,
public delivery, final export, billing, wallet, Supabase, or production action
occurred.

## M10 — active-route retirement and cleanup

Status: completed and pushed.

Implementation commit: `f2b799d2fd13409333b690a31182194c0a7075ed`.

Remote confirmation: `origin/codex/reeditpro-b-roll-skill-end-to-end` resolved
to the implementation commit after push.

Completed the active-route inventory and established one orchestra-callable
B-roll implementation: `b_roll@1.0.0` from
`server/edit-skills/b-roll/b-roll-capability-manifest.ts`. The only B-roll
provider operation is the forward-only Gemini Omni V5 operation. Existing
Wan, Hailuo, Veo, Kling, stock-library, generic provider-gateway, and alternate
provider routes remain absent from the active B-roll manifest and fallback
graph. No Track All implementation or tracking model is imported.

The reconciled repository contained no provider-specific B-roll runtime,
cache, downloader, installer, external-agent wrapper, environment variable,
or package script to delete. M10 therefore preserved history and unrelated
general visual-generation providers while superseding the remaining
active-looking compatibility surfaces. The old Creative Skill
`b_roll_planning` row is now `superseded`, `not_routed`, and `docs_only`; all
nine B-roll family rows in the 140-skill seed remain runtime-disabled. The old
B-roll planning contract/checklist and broader historical handoff now point to
the canonical architecture.

Added repository-wide executable retirement enforcement. It scans active
B-roll imports/environment keys, package scripts, production registrations,
historical metadata, supersession markers, and repository filenames; requires
one manifest registration and zero alternate provider fallbacks; and injects
Wan, Hailuo, Veo, Kling, and stock route fixtures that must be rejected.

Tests:

- `npm run smoke:b-roll-retirement` — passed across 6,046 repository files and
  40 active B-roll source files: one runtime registration, zero alternate
  provider fallbacks, five retired provider fixtures rejected, eleven B-roll
  package scripts canonical, nine historical metadata skills runtime-disabled,
  and no Track All implementation import.
- `npm run test:b-roll-capability-manifest`,
  `npm run test:b-roll-planning`, and
  `npm run test:b-roll-canonical-integration` — passed with manifest hash
  `cac07f07…` unchanged.
- `npm run smoke:b-roll-provider-authority` — passed; V1-V4 registry hashes,
  B-roll V5 registry hash, and lifecycle policy hash remained exact.
- `npm run build`, `npm run typecheck:server`, `npm run lint`,
  `npm run check:frontend-boundary`, and `git diff --check` — passed. Build
  emitted only the existing Vite chunk-size and dynamic-import warnings.

Known pre-existing unrelated failure:
`npm run smoke:professional-skill-planner` remains blocked because that legacy
planner requests the separately retired Qwen2.5-VL visual-understanding model
role (`source.review_sequence_and_structure.qwen_visual_understanding`). None
of the M10 files is in that planner's dependency path; the failure is recorded
without expanding B-roll scope or reactivating retired Qwen authority.

Qualification after M10: `planning_qualified`. Retirement and one-runtime
enforcement are proved. Aggregate promotion remains reserved for M11 E2E
evidence. No provider canary, paid request, public delivery, final export,
billing, wallet, Supabase, or production action occurred.

## M11 — full qualification and end-to-end acceptance

Status: completed and pushed.

Implementation commit: `4a74687ca4586892e8af1ac803563363c87c17eb`.

Remote confirmation: `origin/codex/reeditpro-b-roll-skill-end-to-end` resolved
to the implementation commit after push.

Promoted the canonical `b_roll@1.0.0` manifest only to
`internal_execution_qualified`. Its content-addressed qualification receipt
contains passed evidence for all 15 planning and 21 internal-execution
fixtures, plus separate build, test, security, and provider evidence hashes.
The five production fixtures remain explicitly excluded. The final manifest
hash is `c916e4d29dc91b71e2c16ac8f64fe55fa416e3dd10784e620d9d49d9ef254d6c`;
the qualification receipt hash is
`9b10ed12a838f70f0ff7c97c76695838acc219565634b34bdf8f2825200ec3bf`.

Added the aggregate private E2E route. It binds the exact manifest reference
through assignment, plan, canonical component, approved snapshot and
execution package authority; authorizes the forward-only Gemini Omni V5
operation; injects candidate bytes with zero provider requests; produces a
version-1 `needs_refinement` decision; executes the single allowed injected
refinement; accepts and normalizes version 2; reopens the exact private
FFV1/NUT artifact; renders a real 72-frame private Remotion preview; passes all
eleven integration QA checks; freezes Sound, Color, Transition, Caption,
Track All, and Render ownership; and proves immutable replay. The final run
recorded result hash
`0bbf044eaf3b8d02132208d28cc32cfe2893264c7c8df39306a7a5b69e5c49de`,
acceptance hash
`198782abe1404d5fe78fbddfd976cad76ae4500d10d2caf02bb97e3c66404aa4`,
329500 internal cost micros, and zero outside-range mutation.

Completed the architecture status, internal operator runbook, qualification
matrix, canary procedure, incident response, production exclusions, and
retirement cross-references. No direct SAM2 or SAM 3.1 dependency was added;
required tracking still accepts only `track_graph_v1` or returns the typed
Track All dependency.

Final validation:

- `npm run validate:skill-capability-manifests`,
  `npm run test:edit-skill-capability-kernel`,
  `npm run test:b-roll-capability-manifest`,
  `npm run test:b-roll-planning`, and
  `npm run test:b-roll-canonical-integration` — passed with the final manifest
  hash and 36-fixture internal qualification receipt.
- `npm run smoke:b-roll-existing-source` — passed real FFmpeg/FFprobe source
  preparation, exact 72-frame normalization, immutable replay, and zero
  provider requests.
- `npm run smoke:b-roll-provider-authority` and
  `npm run smoke:b-roll-provider-lifecycle` — passed; V1-V4 registry hashes,
  B-roll V5 registry hash, one-submission lifecycle, unknown reconciliation,
  private ingest, cost evidence, and zero alternate fallback remained exact.
- `npm run smoke:b-roll-candidate-qa` — passed one refinement, real technical
  QA/normalization, forged evidence rejection, source/no-action fallback, and
  zero provider requests.
- `npm run smoke:b-roll-remotion-integration` — passed the real private
  640x360, 24fps, 72-frame render, seven treatment mappings, eleven QA checks,
  all final-owner handoffs, range containment, Track All boundary, and replay.
- `npm run smoke:b-roll-retirement` — passed across 6,049 repository files and
  40 active B-roll source files: one active runtime, zero alternate provider
  fallbacks, five retired routes rejected, nine metadata skills disabled, and
  no Track All implementation import.
- `npm run smoke:b-roll-end-to-end` — passed the complete generated route with
  36 qualified fixtures, five production fixtures excluded, two candidate
  versions, one refinement, eleven QA checks, a real private Remotion preview,
  immutable replay, and zero actual provider requests.
- `npm run smoke:canonical-source-led-plan-compiler`,
  `npm run smoke:approved-snapshot`,
  `npm run smoke:canonical-private-provider-work-lifecycle`, and
  `npm run smoke:canonical-provider-attempt-runtime-record` — passed.
- `npm run smoke:private-artifact-qa-authority`,
  `npm run smoke:private-local-persistence`,
  `npm run smoke:offline-media-binary-execution`, and
  `npm run smoke:offline-remotion-render-execution` — passed the shared private
  artifact, actual pinned media, and actual confined Remotion regressions.
- `npm run smoke:runtime-api-security`,
  `npm run smoke:edit-execution-security-boundary`, and
  `npm run smoke:idempotency-boundary` — passed fail-closed runtime, execution,
  and replay boundaries.
- `npm run build`, `npm run typecheck:server`, `npm run lint`,
  `npm run check:frontend-boundary`, and `git diff --check` — passed. Build
  emitted only the existing Vite chunk-size and dynamic-import warnings.
- `npm run canary:gemini-omni-b-roll` — safely returned
  `blocked_external_prerequisites` with all six operator-owned gates absent,
  no execution, and zero provider requests.

Known pre-existing unrelated failure: the M10-recorded
`npm run smoke:professional-skill-planner` blocker remains unchanged. That
legacy planner requests the separately retired Qwen2.5-VL
`source.review_sequence_and_structure.qwen_visual_understanding` role; no M11
file is in that dependency path.

Qualification after M11: `internal_execution_qualified`. Code completeness,
planning qualification, injected/private internal execution, artifact QA,
Remotion integration, retirement, and documentation are complete. Production
qualification remains blocked by the real Gemini Omni canary, live credential
boundary, account-effective rate authority, live private output ingest, live
security/privacy release review, and the preview model alias lacking an
immutable accepted revision. No paid provider, public delivery, final export,
billing, wallet, Supabase, or production mutation occurred.

## Milestone ledger

| Milestone | Implementation commit | Progress-record commit | Push confirmation | Qualification |
| --- | --- | --- | --- | --- |
| M0 | `ca25f01035590ba86f62fb2273c8299924610dcc` | this bookkeeping commit | confirmed | `implementation_pending` |
| M1 | `ac8fcc6f3b1be4f584f2bed804a769f3e340b667` | this bookkeeping commit | confirmed | `implementation_pending` |
| M2 | `a1a73b0ca7b9efc4007c8c0c17777e69984142a2` | this bookkeeping commit | confirmed | `implementation_pending` |
| M3 | `e13e2907acebf65e383c5cd1e01262ff87a799ab` | this bookkeeping commit | confirmed | `planning_qualified` |
| M4 | `78d0a6e07` | this bookkeeping commit | confirmed | `planning_qualified` |
| M5 | `ff76daff6` | this bookkeeping commit | confirmed | `planning_qualified` |
| M6 | `b641e6f98` | this bookkeeping commit | confirmed | `planning_qualified` |
| M7 | `751ed2055` | this bookkeeping commit | confirmed | `planning_qualified` |
| M8 | `e218a4d57` | this bookkeeping commit | confirmed | `planning_qualified` |
| M9 | `c8268a9d7` | this bookkeeping commit | confirmed | `planning_qualified` |
| M10 | `f2b799d2f` | this bookkeeping commit | confirmed | `planning_qualified` |
| M11 | `4a74687ca` | this bookkeeping commit | confirmed | `internal_execution_qualified` |
