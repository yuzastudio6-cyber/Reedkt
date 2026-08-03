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

Status: completed locally; commit and push recorded by the follow-up progress
commit.

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

## Milestone ledger

| Milestone | Implementation commit | Progress-record commit | Push confirmation | Qualification |
| --- | --- | --- | --- | --- |
| M0 | `ca25f01035590ba86f62fb2273c8299924610dcc` | this bookkeeping commit | confirmed | `implementation_pending` |
| M1 | `ac8fcc6f3b1be4f584f2bed804a769f3e340b667` | this bookkeeping commit | confirmed | `implementation_pending` |
| M2 | `a1a73b0ca7b9efc4007c8c0c17777e69984142a2` | this bookkeeping commit | confirmed | `implementation_pending` |
| M3 | pending | pending | pending | `planning_qualified` |
