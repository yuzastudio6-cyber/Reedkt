# Current End-to-End Capability Matrix

Status date: 2026-07-12
Authority: reviewed APFS continuation checkout at `/Users/macuser/Developer/REeditpro-backend-pipeline`

This document is the current capability truth for ReeditPro. It distinguishes UI policy and deterministic planning from code that actually executes against private test media. It does not turn internal test evidence into a public-beta or production-readiness claim.

## Capability Levels

| Level | Meaning |
| --- | --- |
| `ui_mock` | Browser-visible, deterministic local/mock behavior. No production side effect is implied. |
| `contract_ready` | Typed boundary, policy, route, manifest, or runner contract exists and is covered by focused validation. |
| `private_executable` | The repository executes the capability against generated private test media or private local artifacts with authenticated backend gates. |
| `staging_ready` | Deployed identity, storage, database, worker, secret, observability, and security evidence exists in a controlled staging environment. |
| `external_beta_ready` | Real-user tenancy, media, billing boundaries, recovery, privacy, and operational gates pass. |
| `paid_production_ready` | Production settlement, provider/tool execution, public delivery, incident controls, and release evidence pass. |

No capability should be described at a higher level than its strongest verified evidence.

## Current Product Journey

| Journey stage | Current level | Executable evidence | Important boundary |
| --- | --- | --- | --- |
| Public landing and desktop navigation | `ui_mock` | Active React routes and Playwright route coverage | Copy and UI do not constitute deployed-service readiness. |
| Sign-in and session | local-test UI is `ui_mock`; auth boundary is `contract_ready` | Dedicated sign-in page, guarded app routes, sanitized return paths, tab-scoped loopback-only local identity, Supabase helper contracts, server bearer verification, and auth boundary smoke | Local test identity is not a production account. Real-user Supabase/RLS and browser tenancy evidence are not yet complete. |
| Project and named-edit creation | `ui_mock`; private-internal tenancy V2 is verified for the local/private boundary | Browser project flow, project/edit API contracts, authenticated workspace checks, user/workspace-scoped V2 persistence, collision and revocation smokes, stale-write CAS evidence, full Playwright coverage, and the aggregate private pipeline. The older edit-session, Edit Brief, and local-plan testing routes are restored only inside the explicit local/internal runtime and now isolate records by authenticated owner plus workspace. | This remains local/private evidence. The restored legacy testing routes are not mounted in production/cloud runtime and grant no canonical execution authority. Durable multi-user Supabase/RLS staging evidence is not proven. |
| Source upload | `private_executable` for the internal test path | Authenticated upload intent, private source artifact, checksums, source-order lineage, project-scoped authority revision/checksum, cross-project non-invalidation, and same-project change invalidation | Real-user storage, deployed bucket policy, malware/privacy operations, and signed delivery remain blocked. |
| Upload-to-planning authority handoff | `private_executable` for authenticated local/private backend scope | The strict handoff route verifies finalized upload lineage and exact source order, reads current Exact Edit Preferences, Preference DNA application state, and Edit Brief authority, resolves frame/cleanup settings, and returns the exact source/planning authority consumed by canonical plan publication with no plan, snapshot, credit, tool, provider, or render side effect. | Browser consumption, real-user Supabase/storage, deployed identity/tenancy, and production operations remain blocked. |
| Edit Brief | `ui_mock` and planning-wired | After Footage Prep, a top-right `Edit Brief` action focuses the single existing inline brief. It reports Optional/Draft/Ready truthfully; opening it is non-mutating, while meaningful changes invalidate stale plan/approval state. The backend-local testing record is owner/workspace scoped when the explicit internal runtime is enabled. | It is not a separate route, drawer, or persistent workspace tab, and it is not yet a complete durable, versioned project source of truth. |
| Edit Preferences | authenticated private-internal persistence; planning provenance is `contract_ready` | The signed-in Preferences flow uses a bounded non-production backend route with live workspace membership/role checks, per-user/workspace storage, checksums, atomic writes, compare-and-swap, and authorization-before-idempotency. Saved defaults flow into named-edit setup and planning-input provenance. | This is single-host local/private persistence only. No Supabase preference table, reviewed RLS, controlled staging, production durability, or per-project override claim is made. |
| Intent compilation and edit planning | `contract_ready`; deterministic mock output | Structured compiler, planning layers, approved snapshots, smoke and browser coverage | Real footage/transcript/model understanding is not executed. |
| Aspect ratio, timing, cleanup, plan, and credit approval gates | `contract_ready`; approval is browser-testable | Frame/timing/cleanup policies, credit estimate, immutable snapshot contracts, approval E2E | Real transcript/timing workers and transactional wallet reservation are not proven. |
| Canonical private job execution | `private_executable` for one immutable job | Authenticated job-only route derives the approved work item, output, tool, operation, lease, dispatch, private artifact, QA, reconciliation, and replay from server authority. Exact source-trim, Remotion final-composition, and dependency-bound final-QA jobs pass through this adapter. | Product, beta, and production flags remain false. |
| Canonical private work graph | `private_executable` for run-to-blocked and one bounded complete graph | Authenticated package route derives topological order, executes only dependency-ready jobs, persists exact per-job outcomes, and reuses completed jobs. It now commits content-addressed immutable package-progress checkpoints as completed/resolved state advances; a checksum-protected atomic latest pointer prevents weaker/new-run-key state from replacing stronger progress. Canonical journey recovery exposes only checkpoint lineage, counts, status, time, and next gate. A five-job fixture completes snapshot validation, source-trim validation, caption generation, final composition, and independent final QA. Required completion produces one private create-only, checksum-verified, package/snapshot-bound certificate that survives fresh service instances and advances journey recovery to review assembly. | This is generated-fixture, single-process/single-host evidence, not general plan capability coverage, a distributed scheduler, or a deployed worker claim. No job IDs, artifact identities/bytes, paths, leases, or dispatch authority are exposed by progress recovery. |
| Private render and review journey | `private_executable` for one bounded internal fixture | The canonical graph applies approved trims and captions, renders the exact private H.264/AAC MP4, independently probes that exact dependency, proves lease/artifact lineage, assembles a credential-free create-only review manifest, replays safely, and supports authenticated private download. | The legacy upload-to-render route remains disabled. Browser handoff consumption, deployed real-user storage/workers, public delivery, and production promotion are not connected. |
| Revision and recovery | `private_executable` through accepted second review, superseded-history recovery, and pre-consumption cancellation | An exact review-bound revision completes snapshot-v2 execution/acceptance. Canonical journey recovery returns a hash-bound, credential-free authenticated-history descriptor for each completed decision; fresh history-service instances use those recovered descriptors to reopen both current and superseded QA-passed MP4 bytes. A restart-safe cancellation saga persists a pending fence, revokes/expires issued-but-unconsumed dispatch grants, releases/expires active never-started leases, then atomically releases a fully unused synthetic reservation while preserving snapshot/job/package/dispatch/lease evidence. | The descriptor contains no bearer token, signed URL, local path, bytes, or restored execution/credit authority. Cancellation after dispatch consumption or execution-fence start, deployed disaster recovery/retention, and real-user/browser handoff remain gated. |
| Public export and sharing | blocked | Production readiness gates intentionally deny it | Required assets, real-user privacy, delivery, settlement, and operations are incomplete. |

## Authentication and Tenancy

Current strengths:

- Browser-safe Supabase anon client and email/password helper contracts exist.
- Profile, workspace, membership, and workspace-context bootstrap contracts exist.
- Frontend API transport attaches bearer tokens when a real session exists.
- Server middleware verifies authenticated requests.
- Tokenless mock authentication is limited to an explicit flag, non-production local/mock mode, loopback remote addresses, and loopback browser origins.
- Production or cloud startup rejects the mock-auth bypass.
- CORS uses an explicit origin allowlist, with loopback convenience restricted to non-production local/mock mode.
- Edit Preferences has an authenticated, non-production persistence route that verifies live workspace membership and role before touching preference or idempotency state. Its single-host files are user/workspace scoped, checksummed, atomically replaced, and compare-and-swap protected.
- Project/edit browser and backend tenancy V2 has passed its focused smokes, full Playwright suite, and aggregate private pipeline for the local/private boundary; it must not be treated as a deployed tenancy claim.

Current gaps:

- Frontend sign-in, session, sign-out, protected-route, and sanitized-return-path integration is complete for the bounded local-test surface. Supabase mode uses the existing browser-safe helper boundary and fails closed when configuration is unavailable.
- Real Supabase local/staging RLS evidence is still required.
- Project/edit browser and backend tenancy V2 is complete only for the local/private boundary. A real mounted Supabase revocation transition, reviewed RLS, and controlled staging evidence remain required before any real-user tenancy claim.
- Durable real-user workspace ownership and revocation have not passed staging tests.
- Edit Preferences still has no Supabase preference table or reviewed RLS policy.

## Tool and Editing Execution Truth

### Registry and planning coverage

- 72 production tool registry profiles.
- 55 of 72 registry tools have a statically declared source package/binary/API
  surface; 39 of the 50 bounded adapters are in that set.
- 109 professional editing skills across 12 families.
- 55 hidden internal adapter names referenced by professional skills.
- 50 bounded backend adapter contracts.
- 50 of 50 bounded adapter contracts have a registered runner definition.
- 72 of 72 production profiles have structural cost-metering coverage.
- 0 of 72 production profiles are currently marked product-ready.

### 2026-07-12 executable-evidence audit

| Evidence | Current count | What it proves |
| --- | ---: | --- |
| Production registry | 72 | Named policy/ownership surface only. |
| Launch-core profiles | 24 | Intended first-wave tools, not readiness. |
| Hidden adapter names | 55 | Skill/planner references. |
| Bounded adapter contracts | 50 | Fixed backend contract exists. |
| Registered runner definitions | 50 / 50 | A bounded runner definition exists. |
| Callable candidates | 61 / 72 | Operation contract has no policy-blocking disposition. |
| Intentionally non-executable | 11 / 72 | Planning, future, evaluation, or policy-only lane; no call is permitted. |
| Confined runner verified | 53 | Exact bounded operation ran in its approved offline runtime profile. |
| Canonical private E2E identities | 50 | Exact approved snapshot/work item, funded reservation, lease, one-use dispatch, private persistence, QA, reconciliation, replay, and downstream verification passed. |
| Job-only canonical adapter | 15 runner classes implemented; 52 adapter paths executed; 50 exact tool identities recorded | Snapshot authority, dependency-bound source trim, and every canonical private E2E tool identity now prove server-derived adapter execution. The proof includes D3 plus dependency-bound Sharp, DuckDB, source-bound PyAV, DeepFilterNet with attempt-cost evidence, controlled libass, source-bound FFmpeg, exact Remotion final composition, and dependency-bound final ffprobe QA. |
| Product-ready | 0 / 72 | No registry tool meets production evidence gates. |
| Frontend-executable in practice | 0 | Tool execution stays off the browser. |

The authoritative identity source is `server/tool-execution/proven-tool-identity-catalog.ts`, evidence revision `2026-07-12.28`. Every one of its 50 `canonical_e2e_verified` identities performs an exact confined operation, passes the complete private canonical lifecycle, and has exact server-derived job-adapter proof. This is private single-host evidence, not distributed-worker, external-beta, or production evidence.

### Actual execution coverage

The 50 canonical identities span deterministic Node/Python operations, FFmpeg/ffprobe, Remotion, libass, fixed browser graphics, bounded AI-capability fixtures, native image/audio processing, container/package validation, VapourSynth, AudioFlux, rembg, and DeepFilterNet. Exact output content types include JSON, SVG, PNG, WAV, NUT, and private MP4 artifacts according to the approved operation contract.

For every accepted private run, evidence is valid only when operation identity, snapshot, work item, reservation, lease attempt, expected output, private artifact identity, checksum, byte length, QA, reconciliation, replay, and downstream dependency readback agree. DeepFilterNet additionally has attempt-level internal production-cost evidence using integer micros and the versioned rate card. That evidence contains no customer price, customer credits, service fee, wallet, settlement, or charging authority.

Package/import probes remain distinct from canonical E2E proof. Only identities marked `canonical_e2e_verified` in the proven catalog may be described as having complete private lifecycle evidence.

### Approved tool-work manifest vertical slice

The private internal pipeline now reconciles these separate systems into one immutable approved tool-work manifest:

- `ToolStrategyPlan`,
- `ProfessionalSkillPlan`,
- render, audio, color, map, and data-visualization plans,
- segment and asset identifiers,
- structured settings,
- bounded adapters and runner operations,
- private input/output artifact contracts,
- QA gates and fallback decisions,
- idempotency and approved-snapshot lineage,
- tool-cost ownership and reservation requirements.

The manifest is fingerprinted and bound to the workspace, project, approved snapshot, estimate, and credit reservation. It fails closed for blank scope, duplicate identifiers, orphan links, invalid dependencies, and mismatched operation evidence.

The job-only adapter accepts only workspace, project, edit-session, canonical job, purpose, and idempotency identity. It rejects caller-supplied snapshots, reservations, tools, operations, outputs, paths, URLs, commands, providers, prices, and credits. It supports one server-owned expected output and either one approved canonical tool or one of the exact tool-free authority profiles. The final Remotion profile requires one source, one cleanup decision, and exactly two lease-selected dependencies (source-trim JSON and caption PNG). Multi-output, multi-tool, and whole-graph execution remain explicitly gated.

## Credits and Cost Truth

Implemented at policy/contract level:

- 1 credit equals `$0.10`; 100 credits equal `$10`.
- Subscription access and usage credits remain separate concepts.
- Plan and estimate approval precede generation.
- Tool-cost events represent internal tool cost only; service fee remains in settlement preview/policy math.
- No silent unapproved overage is allowed.
- Structural metering profiles cover all 72 production registry profiles.

Not yet production-executable:

- transactional wallet reservation,
- ledger-backed spend/release/refund,
- Stripe checkout/webhooks,
- production service-fee settlement,
- export lock/unlock tied to settlement,
- production-billable operation settlement. The private FFmpeg/ffprobe slice records operation-linked, idempotent, nonbillable internal cost evidence with no wallet mutation or service fee. The conditionally executable fixed-template Playwright capture is also nonbillable.

## Private Pipeline Evidence

`npm run qa:internal-pipeline` is an aggregate audit command. A zero exit code means its assertions passed, including assertions that unavailable journey stages fail closed. It currently runs:

1. the auth runtime boundary smoke,
2. the approved tool-work manifest and real-media evidence smoke,
3. the conditionally authorized private fixed-template Playwright capture smoke,
4. the private internal upload journey fail-closed smoke,
5. the browser-to-backend approval journey fail-closed smoke.

The legacy upload journey now reports `blocked_by_canonical_browser_consumption_of_planning_handoff`; the browser journey reports `blocked_by_atomic_plan_approval_and_funded_credit_reservation` at its legacy standalone-credit seam. Separately, the authenticated local/private backend now converts finalized upload plus current Exact Edit Preference, Preference DNA application, and Edit Brief state into exact canonical plan-publication authority, and the canonical backend completes both review passes plus authenticated current/superseded history recovery. Browser consumption and deployed real-user infrastructure remain required.

The aggregate command does not prove a complete upload-to-review journey, live provider execution, real-user storage, public export, or paid production.

## Release State

| Release target | Current state | Reason |
| --- | --- | --- |
| Local browser/UI testing | available | Mock-safe browser flows and Playwright coverage exist. |
| Authenticated canonical single-job execution | available | Server-derived private route, exact runner execution, QA/reconciliation, durable service replay, and downstream verification pass. |
| Authenticated private upload-to-review pipeline | discoverable one-publication persisted backend handoff plus bounded two-pass execution fixture | The authenticated backend persists a checksum-protected, tenant-scoped upload/planning handoff, serializes preparation, and maintains a checksum-protected latest pointer per edit session. An authenticated client can persist a content-addressed publication-request candidate; candidate submission is serialized and a checksum-protected latest pointer supports refresh/restart recovery. A single `canonical-journey` endpoint recovers handoff, candidate, plan, estimate, approval snapshot, reservation state, job counts, execution package, latest monotonic work-graph progress, required-work completion, completed review assembly, completed review decision, and one exact next safe action without raw execution inputs, job outcomes, or artifact bytes. Completed decisions include an immutable-hash-bound authenticated-history descriptor that reopens current and superseded private review bytes after refresh without embedding credentials, paths, signed URLs, or delivery authority. Work-graph completion advances recovery to the exact review-assembly route instead of asking a refreshed client to rerun completed work. The internal route loads the full candidate and revalidates the handoff before publication. All authenticated canonical HTTP fixtures and the full initial/review/revision lifecycle publish through persisted handoff authority; the former caller-authority HTTP route fails closed. The fixture reaches first review, revision request, replacement-plan execution, accepted second review, and restart-safe current/superseded history download. Frontend consumption and deployed real-user operations remain blocked. |
| Controlled staging with real users | blocked | Supabase/RLS, deployed workers/storage, identity/tenancy, privacy, and operational evidence remain. |
| External beta | blocked | Production readiness scenarios intentionally fail closed. |
| Paid production | blocked | Billing, settlement, real providers/tools, public delivery, security, and operations remain incomplete. |

## Truthful Product Language

Safe current description:

> ReeditPro has deterministic planning and canonical approval authority plus 50 exact private tool lifecycles. Its authenticated local/private backend can bind finalized uploads and current planning inputs into exact plan-publication authority, then execute a bounded original review and revision pass through immutable plans, synthetic reservation reconciliation, independent final QA, accepted second review, and restart-safe current/superseded history download. Browser consumption, deployed real-user infrastructure, external beta, public delivery, live billing, Supabase/RLS tenancy, distributed workers, and production promotion remain gated.

Do not claim:

- “50 tools are production-ready.”
- “The full provider pipeline is live.”
- “Credits are transactionally charged.”
- “Exports are publicly delivered.”
- “Real AI footage understanding is complete.”
- “The product is ready for external beta.”

## Immediate Evidence-Gated Milestones

1. **Completed for local/internal testing:** frontend sign-in/session/route guards and local-test failure boundaries.
2. **Completed at contract/mock level:** cumulative planning-input resolution, preference provenance, and approval invalidation.
3. **Completed for authenticated local/private identity/workspace scope:** single-host Edit Preferences persistence with live membership/role authorization, checksum/atomic storage, compare-and-swap, and idempotency. Supabase table/RLS, staging, production durability, and project-specific override UI remain future evidence gates.
4. **Completed for 50 private tool identities:** exact confined operation plus canonical snapshot, funded reservation, lease, one-use dispatch, private artifact, QA, reconciliation, replay, and downstream verification.
5. **Completed for canonical bounded private review:** authenticated package orchestration advances dependency-ready jobs, persists exact blockers, reuses completed job evidence, and records content-addressed monotonic package-progress checkpoints behind an atomic latest pointer. A refreshed authenticated client can recover bounded counts and the next gate without receiving jobs, artifacts, paths, leases, dispatch grants, or execution authority. A five-job generated-fixture graph reaches approved trims, caption generation, final composition, downstream final-artifact QA, credential-free private-review assembly, and authenticated private download.
6. **Completed for bounded canonical review decisions:** one exact assembly/final-artifact-bound decision persists create-only and replay-safe. A structured revision request preserves the approved snapshot and creates no plan, estimate, reservation, render, or execution authority.
7. **Completed for bounded canonical replacement planning:** one exact unconsumed revision handoff publishes plan v2 plus a fresh estimate, while approval, wallet/reservation mutation, jobs, and execution remain blocked.
8. **Completed for synthetic revision approval:** atomic unused-prior release plus new-maximum reservation freezes snapshot v2 and derives jobs with wallet conservation, immutable prior evidence, and replay safety. No customer credit/billing authority exists.
9. **Completed for local/private scope:** project/edit browser and backend tenancy V2, including collision-safe scoped caches, live membership authorization, explicit invalidation, strict response ownership, authorization-before-idempotency, atomic/checksummed storage, and stale-write serialization/CAS. Real mounted Supabase revocation, reviewed RLS, and controlled staging remain blocked.
10. **Completed for bounded revision execution:** snapshot v2 executes through new final composition/QA authority and an accepted second private review without public delivery.
11. **Completed for private history/recovery:** canonical journey state exposes a hash-bound, credential-free authenticated-history descriptor after each persisted review decision, and fresh-service reads use those recovered descriptors to reopen current and superseded review bytes without restoring released execution or credit authority.
12. Expand destructive/negative QA for deployed tenancy, storage, idempotency, credit settlement, privacy retention, and operational recovery.
13. **Completed for authenticated local/private backend scope:** persist finalized upload order plus current Exact Edit Preference, Preference DNA application, Edit Brief, frame, and cleanup state as content-addressed private handoff authority; revalidate it through the internal publication route; and freeze its exact binding into canonical plan/snapshot lineage without approval, credit, tool, provider, or render side effects.
14. **Completed for authenticated local/private pre-consumption scope:** persist a cancellation-pending fence, terminally revoke/expire issued-but-unconsumed dispatch grants, release/expire never-started leases, atomically cancel the fully unused synthetic reservation, preserve immutable snapshot/job/package/dispatch/lease evidence, serialize against lease claim, dispatch authorization/consumption, and worker execution-fence begin/complete transitions, and deny future active package authority. Consumed-dispatch and started-execution compensation remain gated.
15. **Backend bridge and recovery complete through private-review acceptance; frontend consumption remains:** bind the browser journey to the authenticated canonical planning handoff, content-addressed publication-request candidate, and canonical journey recovery route without reviving legacy caller-authored authority. Submit/inspect, latest recovery, internal publish-from-candidate, plan-to-snapshot recovery, package execution, monotonic in-progress/blocked checkpoint recovery, restart-safe required-work completion, exact review-assembly readiness, first-review readiness, revision request, replacement-review readiness, accepted-review recovery, current/superseded private-history reopening, and exact-next-action state now pass local/private canonical evidence. Progress checkpoints are immutable and content-addressed; their checksum-protected latest pointer cannot be regressed by a different run key. The first package completion certificate is create-only across run keys and fails closed on checksum tampering. Stage/action/actor/method/route, required/forbidden summaries, package/snapshot identity, progress count partition, completion identity, review-decision pairs, and history-descriptor identities/hashes are schema-bound and fail closed on substitution. The response exposes only bounded identities, hashes, counts, statuses, authenticated route/query descriptors, and denied permissions—never credentials, signed URLs, private paths, job/artifact details, leases, dispatch grants, or execution/credit authority; no frontend call site is added by this backend-only task.
16. Keep all execution-stage inputs server-derived and re-authorize package ownership/workspace lineage at every runner, QA, artifact, and review transition.
17. Keep tool-cost events backend-authored and tenant-scoped; browser-authored
    usage or billability must never become wallet or settlement authority.
18. Build and attest the production worker images, pin Python dependencies and
    model manifests, then rerun intended-operation tests inside those exact
    images before changing any tool to product-ready.

The legacy backend-local edit-session, Edit Brief, and local-plan routers are now restored only for the explicit local/internal runtime. Their records are authenticated-owner/workspace scoped, and local-plan responses carry a machine-readable `legacy_local_preview_only` authority boundary. This restores the bounded testing seam without satisfying milestone 15 or bypassing the persisted canonical handoff.

## Validation Sources

- `npm run check:frontend-boundary`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- `npm run typecheck:server`
- `npm run qa:internal-pipeline`
- `npm run prod:beta:summary`
- `npm run prod:e2e:summary`

This matrix must be updated when a capability gains or loses executable evidence.
