# Current End-to-End Capability Matrix

Status date: 2026-07-13
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
| Project and named-edit creation | `ui_mock`; private-internal tenancy V2 is verified for the local/private boundary | Browser project flow, project/edit API contracts, authenticated workspace checks, user/workspace-scoped V2 persistence, collision and revocation smokes, stale-write CAS evidence, full Playwright coverage, and the aggregate private pipeline. Project and exact internal edit-state registries now preserve their existing hashed paths/checksummed envelopes through the shared `0700`/`0600`, atomic, no-follow, symlink-refusing persistence and registry-listing boundary. The older edit-session, Edit Brief, and local-plan testing routes are restored only inside the explicit local/internal runtime and now isolate records by authenticated owner plus workspace. | This remains local/private evidence. The restored legacy testing routes are not mounted in production/cloud runtime and grant no canonical execution authority. Durable multi-user Supabase/RLS staging evidence is not proven. |
| Source upload | `private_executable` for the internal test path | Authenticated upload intent, private source artifact, checksums, source-order lineage, project-scoped authority revision/checksum, cross-project non-invalidation, and same-project change invalidation. Separate incremental upload batches now derive collision-resistant source-sequence identities from their upload-plan/source identity instead of reusing a batch-local ordinal, and finalized backend media-asset identity is preserved into planning rather than replaced by a mock identity. Local and GCS source/reference probing reopen bytes through the storage adapter, bind GCS to the verified generation/ETag, stage through random scope-hashed create-only `0700`/`0600` private attempts, enforce exact size plus SHA-256, and remove only the exact owned attempt identity before finalization returns. | This remains single-process/local evidence. Real-user storage, deployed bucket policy, GCS orphan lifecycle, malware scanning, parser/subprocess isolation, privacy operations, and signed delivery remain gated. |
| Upload-to-planning authority handoff | `private_executable` for authenticated local/private backend scope | Named-edit creation/save idempotently initializes server-owned Exact Edit Preferences. Before canonical save, the browser strictly reads and synchronizes explicit current-edit values, then rebuilds canonical components with the server baseline/revision. The strict handoff verifies finalized upload lineage and exact source order before deriving source-preparation and frame-confirmation evidence server-side, records that evidence in the exact authority, and returns the exact source/planning binding used by publication. Exact duration-preserving ordered source sequences can compile into the bounded source-sequence graph; a distinct two-source fixture passes canonical execution through final QA/replay. | The normal two-source/rich named-edit scenario still stops before presentation/approval because its multiple captions, transitions, SFX/ducking, color/audio, provider, expanded timing, and segment operations are not yet exact work items. Real-user Supabase/storage, deployed identity/tenancy, and production operations remain blocked. |
| Edit Brief | `ui_mock` and planning-wired | After Footage Prep, a top-right `Edit Brief` action focuses the single existing inline brief. It reports Optional/Draft/Ready truthfully; opening it is non-mutating, while meaningful changes invalidate stale plan/approval state. The backend-local testing record is owner/workspace scoped when the explicit internal runtime is enabled. | It is not a separate route, drawer, or persistent workspace tab, and it is not yet a complete durable, versioned project source of truth. |
| Edit Preferences | authenticated private-internal persistence; exact canonical synchronization is `contract_ready` | Saved defaults use live workspace membership/role checks, per-user/workspace storage, checksums, atomic writes, compare-and-swap, and authorization-before-idempotency. Named-edit save initializes a server-owned immutable baseline; canonical save strictly reads/updates the exact current values, binds the returned preference revision into plan components, and lets only the backend promote verified source/frame evidence. | This is single-host local/private persistence only. No Supabase preference table, reviewed RLS, controlled staging, production durability, or collaborative multi-device claim is made. |
| Intent compilation and edit planning | `contract_ready`; deterministic mock output | Structured compiler, planning layers, approved snapshots, smoke and browser coverage | Real footage/transcript/model understanding is not executed. |
| Aspect ratio, timing, cleanup, plan, and credit approval gates | `contract_ready`; exact canonical approval is browser-testable for local/private scope | Frame/timing/cleanup policies, exact visible-total reconciliation, authenticated frontend-safe approval, immutable snapshot creation, synthetic private-test reservation, derived-job counts, replay/concurrency checks, and Playwright E2E | No execution starts from approval. Real transcript/timing workers, customer-wallet mutation, billing, settlement, and distributed transaction evidence are not proven. |
| Canonical private job execution | `private_executable` for one immutable job and one exact ordered two-source composition | Authenticated job-only route derives the approved work item, output, tool, operation, lease, dispatch, private artifact, QA, reconciliation, and replay from server authority. Before approval, a content-addressed plan-time manifest now reconciles planner declarations and work items with stable identities and proof hashes from the server catalog. Exact multi-source trim, source-bound Remotion sequence composition, and dependency-bound final-QA jobs pass through the adapter. | Product, beta, and production flags remain false. The executed proof contains two sources; the two-through-eight contract is not eight-source runtime evidence. A plan-time identity manifest does not replace package, lease, dispatch, artifact, QA, or deployment evidence. |
| Canonical private work graph | `private_executable` for run-to-blocked, bounded failure/retry recovery, one bounded complete graph, and one grouped controlled-tool chain | Authenticated package route derives topological order, executes only dependency-ready jobs, persists exact per-job outcomes, and reuses completed jobs. Before plan hashing and approval, a server-owned compiler can now decompose an explicitly described grouped planner node into deterministic one-tool/one-output jobs while conserving dependencies, operations, required outputs, and maximum credit budget. A D3-to-ECharts fixture now proves an idempotent pre-execution failure, independent-branch continuation, descendant isolation, and a fresh-run attempt-two recovery before passing the full atomic snapshot, reservation, lease, one-use dispatch, private artifact, QA, reconciliation, replay, downstream-readback, and progress lifecycle. The graph also commits content-addressed immutable package-progress checkpoints as completed/resolved state advances; a checksum-protected atomic latest pointer prevents weaker/new-run-key state from replacing stronger progress. A five-job fixture completes snapshot validation, source-trim validation, caption generation, final composition, and independent final QA. Required completion produces one private create-only, checksum-verified, package/snapshot-bound certificate that survives fresh service instances and advances journey recovery to review assembly. | This is generated-fixture, single-process/single-host evidence, not arbitrary plan/provider-chain coverage, a distributed scheduler, or a deployed worker claim. Retries remain same-operation and immutable-attempt bounded; fallback changes still require approved policy or user/new approval. Grouped provider work, grouped terminal render/final QA, and tool-free multi-output work remain behind separately named authority gates. No job IDs, artifact identities/bytes, paths, leases, or dispatch authority are exposed by progress recovery. |
| Private render and review journey | `private_executable` for bounded internal fixtures including exact ordered two-source composition | The canonical graph applies approved trims and captions, renders the exact private H.264/AAC MP4, independently probes that exact dependency, proves lease/artifact lineage, reconciles and replays safely, and supports authenticated private download. The Remotion image must carry the aggregate SHA-256 of its current reviewed source tree before activation. | The legacy upload-to-render route remains disabled. Rich plan semantics, browser package/execution/review mutations, deployed real-user storage/workers, public delivery, and production promotion are not connected. |
| Revision and recovery | `private_executable` through bounded failed-attempt retry, completed-execution adapter recovery, accepted second review, superseded-history recovery, and quiescent cancellation/compensation | A started runner failure or timeout becomes an immutable failed fence without commit/completion authority; exact adapter replay cannot rerun it, and a new run can use only the remaining approved attempt allowance. A historical completed fence is now checked before any fresh claim: exact artifact/QA/reconciliation/dispatch/cost evidence can reconstruct the missing adapter completion without execution, while incomplete evidence blocks without another attempt. An exact review-bound revision completes snapshot-v2 execution/acceptance. Canonical journey recovery returns a hash-bound, credential-free authenticated-history descriptor for each completed decision; fresh history-service instances use those recovered descriptors to reopen both current and superseded QA-passed MP4 bytes. The restart-safe pre-execution cancellation saga fences unconsumed dispatch/never-started leases. A separate post-dispatch saga preserves consumed grants, failed/completed fences, committed and partial artifact/QA/reconciliation evidence, and internal-cost evidence; terminally fences remaining quiescent grants/leases; and releases only a fully unused synthetic reservation. | The descriptor contains no bearer token, signed URL, local path, bytes, or restored execution/credit authority. An actively `started` fence or a `completed` fence still missing artifact, QA, reconciliation, dispatch, or required cost evidence fails closed. Post-commit recovery never retries the runner. Distributed worker death detection/quiescence, spent-credit settlement/refunds, deployed disaster recovery/retention, and real-user/browser handoff remain gated. |
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
- Project/edit browser and backend tenancy V2 has passed its focused smokes, direct private-registry symlink attacks, full Playwright suite, and aggregate private pipeline for the local/private boundary; it must not be treated as a deployed tenancy claim.

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
| Canonical plan tool-identity authority | 50 / 50 in the complete fixture | All required full-fixture tools are declared by strategy, bound to exact operations, frozen with stable identity/operation/proof hashes before approval, and revalidated before execution packaging. |
| Canonical pre-approval payload authority | 50 unique tools across 19 runner families in the complete fixture | Exact structured payload, source/cleanup/dependency binding, output role/content type, and offline policy are validated before plan approval, frozen in content-addressed lineage, revalidated before packaging, and reused at dispatch. |
| Job-only canonical adapter | 15 runner classes implemented; 52 adapter paths executed; 50 exact tool identities recorded | Snapshot authority, dependency-bound source trim, and every canonical private E2E tool identity now prove server-derived adapter execution. The proof includes D3 plus dependency-bound Sharp, DuckDB, source-bound PyAV, DeepFilterNet with attempt-cost evidence, controlled libass, source-bound FFmpeg, exact Remotion final composition, and dependency-bound final ffprobe QA. |
| Product-ready | 0 / 72 | No registry tool meets production evidence gates. |
| Frontend-executable in practice | 0 | Tool execution stays off the browser. |

The authoritative identity source is `server/tool-execution/proven-tool-identity-catalog.ts`, evidence revision `2026-07-12.28`. Every one of its 50 `canonical_e2e_verified` identities performs an exact confined operation, passes the complete private canonical lifecycle, and has exact server-derived job-adapter proof. Canonical publication now derives `canonical-tool-execution-authority-v1` from that catalog and the compiled work graph; required tools without both proof dimensions fail before approval. This is private single-host evidence, not distributed-worker, external-beta, or production evidence.

### Actual execution coverage

The 50 canonical identities span deterministic Node/Python operations, FFmpeg/ffprobe, Remotion, libass, fixed browser graphics, bounded AI-capability fixtures, native image/audio processing, container/package validation, VapourSynth, AudioFlux, rembg, and DeepFilterNet. Exact output content types include JSON, SVG, PNG, WAV, NUT, and private MP4 artifacts according to the approved operation contract. The conditionally authorized fixed-template Playwright capture now persists through the shared root-confined create-only/no-follow boundary: concurrent identical attempts reuse only exact bytes, different-byte collisions never overwrite, and target/ancestor symlinks fail without external mutation. This does not authorize URLs, navigation, arbitrary HTML, authenticated capture, or public browser execution.

For every accepted private run, evidence is valid only when operation identity, snapshot, work item, reservation, lease attempt, expected output, private artifact identity, checksum, byte length, QA, reconciliation, replay, and downstream dependency readback agree. DeepFilterNet additionally has attempt-level internal production-cost evidence using integer micros and the versioned rate card. That evidence contains no customer price, customer credits, service fee, wallet, settlement, or charging authority.

Failed attempts are now distinct from accepted private runs. A failed fence has no commit/completion timestamps, is immutable and content-hashed, and can authorize only the same approved operation when an unused `maxAttempts` allowance remains. Exact failure replay performs no second execution; post-commit failures require reconciliation recovery.

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

The newer canonical plan-time tool execution authority is a separate earlier gate. It reconciles `toolStrategyPlan`, the compiled canonical work graph, exact operation IDs, and the proven identity catalog before plan hashing. The complete fixture freezes all 50 required identities and their operation/identity/proof hashes. It rejects undeclared tools, missing exact operations, required tools without canonical lifecycle plus job-adapter evidence, input mutation, and content-addressed manifest tampering.

The canonical payload authority is the next pre-approval gate. It applies the 19 exact runner-family validators to compiled atomic work, verifies source/cleanup/dependency cardinality and proven artifact content types, and permits final-artifact ownership only for the exact private Remotion final-composition profile. Its content-addressed manifest is reloaded before synthetic reservation and execution packaging. Dispatch calls the same shared validator, eliminating the former plan-versus-dispatch payload-rule duplication. Malformed structured payloads, unsupported bindings, output-type substitution, and manifest tampering fail before expensive execution authority can be issued.

The job-only adapter accepts only workspace, project, edit-session, canonical job, purpose, and idempotency identity. It rejects caller-supplied snapshots, reservations, tools, operations, outputs, paths, URLs, commands, providers, prices, and credits. It supports one server-owned expected output and either one approved canonical tool or one of the exact tool-free authority profiles. The final Remotion profile requires one source, one cleanup decision, and exactly two lease-selected dependencies (source-trim JSON and caption PNG). A grouped controlled-tool planner item may now carry an exact atomic descriptor; the authenticated backend validates and compiles it before plan hashing, approval, snapshot, and job derivation, so the runtime still receives only one tool, one operation, and one output per job. Grouped provider work, grouped terminal render/final QA, tool-free multi-output work, and arbitrary caller-authored execution remain explicitly gated.

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

The legacy upload journey still reports its historical fail-closed seam, and the legacy standalone-credit browser journey remains blocked. Separately, the authenticated local/private canonical path now preserves unique incremental source identity and finalized media identity, synchronizes current Exact Edit Preferences into server authority, derives verified source/frame evidence, and can present and approve an exactly representable source-and-caption plan through frontend-safe coordinators. The exact compiler now supports bounded duration-preserving source sequences, and a dedicated two-source fixture completes snapshot, synthetic reservation, lease, one-use dispatch, private composition, final QA, reconciliation, replay, downstream verification, and private download. The normal two-source/rich named-edit aggregate scenario still exits successfully with `blocked_by_exact_multi_source_and_rich_work_item_compilation`; it does not silently simplify the plan or approve it. Browser package/execution/review mutations for the named-edit journey and deployed real-user infrastructure remain required.

The aggregate command does not prove a complete upload-to-review journey, live provider execution, real-user storage, public export, or paid production.

## Release State

| Release target | Current state | Reason |
| --- | --- | --- |
| Local browser/UI testing | available | Mock-safe browser flows and Playwright coverage exist. |
| Authenticated canonical single-job execution | available | Server-derived private route, exact runner execution, QA/reconciliation, durable service replay, and downstream verification pass. |
| Authenticated private upload-to-review pipeline | narrow exact plan presentation/approval connected; exact ordered multi-source backend lifecycle proven; rich compilation remains blocked | The authenticated backend persists a checksum-protected tenant-scoped planning handoff and content-addressed publication candidate, then presents one server-owned canonical plan only when the plan is exactly representable by the bounded source-and-caption graph. Exact one-source and duration-preserving sequence candidates can be compiled; a two-source backend fixture passes the complete private canonical lifecycle. The named-edit browser binds the visible plan version/hash and estimate identity/hash/maximum to a frontend-safe approval coordinator, where approval derives jobs but starts no execution. | Normal rich multi-source work-item compilation, named-edit package request/execution advancement, review mutations, and deployed real-user operations remain blocked. |
| Controlled staging with real users | blocked | Supabase/RLS, deployed workers/storage, identity/tenancy, privacy, and operational evidence remain. |
| External beta | blocked | Production readiness scenarios intentionally fail closed. |
| Paid production | blocked | Billing, settlement, real providers/tools, public delivery, security, and operations remain incomplete. |

## Truthful Product Language

Safe current description:

> ReeditPro has deterministic planning and canonical approval authority plus 50 exact private tool lifecycles. Its bounded compiler can publish one exact source or a duration-preserving ordered source sequence with one approved caption; a two-source fixture passes the complete canonical private lifecycle through final QA, reconciliation, replay, and private download. The normal rich multi-source editor plan remains approval-blocked because its captions, transitions, audio/SFX/ducking, color, provider, and segment operations are not silently discarded. Named-edit execution/review mutations, deployed real-user infrastructure, external beta, public delivery, live billing, Supabase/RLS tenancy, distributed workers, and production promotion remain gated.

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
3. **Completed for authenticated local/private identity/workspace scope:** single-host Saved Edit Preference persistence plus server-owned exact-edit initialization and canonical-save synchronization with live membership/role authorization, checksum/atomic storage, compare-and-swap, optimistic revision, deterministic idempotency, strict response parsing, and backend-derived source/frame evidence. Supabase table/RLS, staging, production durability, and collaborative multi-device behavior remain future evidence gates.
4. **Completed for 50 private tool identities:** exact confined operation plus canonical snapshot, funded reservation, lease, one-use dispatch, private artifact, QA, reconciliation, replay, and downstream verification. The complete canonical plan fixture now freezes all 50 required identities from the server proof catalog and validates their exact payloads across 19 runner families before approval, then revalidates both authorities before packaging. One grouped D3-to-ECharts planner node compiles before approval into two atomic jobs with exact dependency, operation, output, budget, evidence, and progress lineage; this is bounded controlled-tool evidence, not arbitrary provider-chain readiness.
5. **Completed for canonical bounded private review and exact ordered two-source composition:** authenticated package orchestration advances dependency-ready jobs, persists exact blockers, reuses completed job evidence, and records content-addressed monotonic package-progress checkpoints behind an atomic latest pointer. A refreshed authenticated client can recover bounded counts and the next gate without receiving jobs, artifacts, paths, leases, dispatch grants, or execution authority. A five-job generated-fixture graph reaches approved trims, caption generation, final composition, downstream final-artifact QA, credential-free private-review assembly, and authenticated private download. A separate two-source proof preserves exact source order/ranges and audio through snapshot, synthetic reservation, lease, dispatch, source-bound Remotion execution, private persistence, final QA, reconciliation, replay, downstream verification, and private download.
6. **Completed for bounded canonical review decisions:** one exact assembly/final-artifact-bound decision persists create-only and replay-safe. A structured revision request preserves the approved snapshot and creates no plan, estimate, reservation, render, or execution authority.
7. **Completed for bounded canonical replacement planning:** one exact unconsumed revision handoff publishes plan v2 plus a fresh estimate, while approval, wallet/reservation mutation, jobs, and execution remain blocked.
8. **Completed for synthetic revision approval:** atomic unused-prior release plus new-maximum reservation freezes snapshot v2 and derives jobs with wallet conservation, immutable prior evidence, and replay safety. No customer credit/billing authority exists.
9. **Completed for local/private scope:** project/edit browser and backend tenancy V2, including collision-safe scoped caches, live membership authorization, explicit invalidation, strict response ownership, authorization-before-idempotency, atomic/checksummed storage, and stale-write serialization/CAS. Real mounted Supabase revocation, reviewed RLS, and controlled staging remain blocked.
10. **Completed for bounded revision execution:** snapshot v2 executes through new final composition/QA authority and an accepted second private review without public delivery.
11. **Completed for private history/recovery:** canonical journey state exposes a hash-bound, credential-free authenticated-history descriptor after each persisted review decision, and fresh-service reads use those recovered descriptors to reopen current and superseded review bytes without restoring released execution or credit authority.
12. Expand destructive/negative QA for deployed tenancy, storage, idempotency, credit settlement, privacy retention, and operational recovery.
13. **Completed for authenticated local/private backend scope:** preserve unique incremental source identities and finalized media identity; synchronize current Exact Edit Preferences to server authority; derive source-preparation and frame-confirmation evidence only after source validation; persist that exact state with Preference DNA, Edit Brief, frame, and cleanup as content-addressed handoff authority; revalidate it through internal publication; and freeze its exact binding into plan/snapshot lineage without approval, credit, tool, provider, or render execution side effects.
14. **Completed for authenticated local/private pre-consumption and quiescent post-dispatch scope:** persist an exact-request-owned cancellation-pending fence; terminally revoke/expire issued-but-unconsumed dispatch grants; release/expire active `not_started` or fully adapter-completed leases; preserve consumed dispatch, completed execution, create-only adapter completion, snapshot/job/package, artifact/QA/reconciliation, and internal-cost evidence; atomically cancel the fully unused synthetic reservation with wallet conservation; serialize behind the active work-graph package lock and then against lease claim, dispatch authorization/consumption, and worker execution-fence begin/complete transitions; and deny future active package authority. Active `started` fences and completed fences without adapter-completion evidence fail without mutation; spent-credit settlement/refund and distributed quiescence remain gated.
15. **Backend bridge and recovery complete through private-review acceptance; named-edit planning, bounded sequence presentation eligibility, and exact approval now connected:** bind the browser journey to exact preference synchronization, authenticated planning handoff, content-addressed publication candidate, server-owned plan-presentation coordinator, exact approval coordinator, and read-only journey recovery without reviving caller-authored authority. The browser saves rich-plan components but requests presentation only for the proven source-and-caption graph, which now includes exact duration-preserving ordered sequences; the normal two-source/rich scenario is still visibly gated at `publication_request_required` and creates no snapshot or reservation. For an exactly representable plan, approval requires the exact presented project/edit/version/plan hash/estimate identity/hash/visible maximum, derives revision and idempotency authority server-side, and atomically creates or replays one immutable snapshot, synthetic private-test reservation, and ready/blocked jobs. It starts no package, job, tool, provider, render, billing, wallet, or delivery action. Package request, execution advancement, review assembly/decision, revision submission, and history opening remain separate frontend mutation milestones.
16. Keep all execution-stage inputs server-derived and re-authorize package ownership/workspace lineage at every runner, QA, artifact, and review transition.
17. Keep tool-cost events backend-authored and tenant-scoped; browser-authored
    usage or billability must never become wallet or settlement authority.
18. Build and attest the production worker images, pin Python dependencies and
    model manifests, then rerun intended-operation tests inside those exact
    images before changing any tool to product-ready.
19. **Completed for local/private failed-attempt recovery:** terminalize started runner exceptions and lease timeouts as immutable failed fences, persist exact adapter failure replay, isolate dependent work while independent branches continue, permit only a fresh-key same-operation retry within the approved attempt ceiling, require reconciliation instead of retry after commit, and treat failed fences as quiescent compensation evidence while preserving failed internal-cost records.
20. **Completed for local/private post-commit adapter recovery:** inspect historical completed fences before any new claim; require exact immutable artifact, passed QA, reconciliation, consumed dispatch, and scoped internal-cost evidence; persist a credential-free create-only recovery record; reconstruct the job-level adapter completion without a new lease, dispatch, runner, artifact, QA, reconciliation, or cost write; and keep incomplete completed attempts blocked as `server_reconciliation_required` instead of retrying them.

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
