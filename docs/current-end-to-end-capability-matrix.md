# Current End-to-End Capability Matrix

Status date: 2026-07-21
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
| Sign-in and session | local-test UI is `ui_mock`; Google/Supabase and private gateway handoffs are `contract_ready` | Dedicated Google-first sign-in page, guarded app routes, exact same-origin/base-path callback construction, sanitized return paths, accessible email/password fallback, provider-error confidentiality, tab-scoped loopback-only local identity, Supabase session helpers, direct server bearer verification, safe frontend API-origin validation, Google API Gateway issuer/JWKS/audience contract, gateway/token/Supabase-user claim matching, exact noncredentialed CORS, focused smoke, and intercepted browser OAuth coverage. The guarded deployment chain now includes immutable gateway evidence, same-SHA Pages binding, credential-free CI readiness, an owner-local headed session verifier, and same-SHA profile/workspace provision/readback workflows. Those backend workflows require a Google-linked identity, confirmed email, and prior Auth sign-in, accept only the verifier's email hash as input, and log only hashed record identities; the browser verifier separately proves the live session used Google. | No live Gmail session has passed. The new bootstrap/readback workflows are source-only and have not accessed Supabase. Supabase Google-provider enablement, Google and Supabase callback allowlists, asymmetric signing-key compatibility, reviewed hosted deployment, API Gateway enablement/IAM, protected-route reload/sign-out readback, canonical RLS tenancy/two-user isolation, and real browser-to-staging API authorization remain open. |
| Project and named-edit creation | `ui_mock`; private-internal tenancy V2 is verified for the local/private boundary | Browser project flow, project/edit API contracts, authenticated workspace checks, user/workspace-scoped V2 persistence, collision and revocation smokes, stale-write CAS evidence, full Playwright coverage, and the aggregate private pipeline. Project and exact internal edit-state registries now preserve their existing hashed paths/checksummed envelopes through the shared `0700`/`0600`, atomic, no-follow, symlink-refusing persistence and registry-listing boundary. The older edit-session, Edit Brief, and local-plan testing routes are restored only inside the explicit local/internal runtime and now isolate records by authenticated owner plus workspace. | This remains local/private evidence. The restored legacy testing routes are not mounted in production/cloud runtime and grant no canonical execution authority. Durable multi-user Supabase/RLS staging evidence is not proven. |
| Source upload | `private_executable` for small internal sources and two resumable-sized 4K private lifecycles, including one canonical execution; live-cloud and genuinely huge transport remain `contract_ready` | Authenticated upload intent, private source artifact, checksums, source-order lineage, project-scoped authority revision/checksum, cross-project non-invalidation, and same-project change invalidation. Separate incremental upload batches derive collision-resistant source-sequence identities from upload-plan/source identity, and finalized backend media-asset identity survives into planning. Local and GCS source/reference probing reopen bytes through the storage adapter, bind GCS to verified generation/ETag, stage through random create-only `0700`/`0600` private attempts, enforce exact size plus SHA-256, and remove only the owned attempt identity. Source policy admits up to 1 TiB source/250 GiB reference video, selects create-only resumable GCS transport above 16 MiB, resumes from provider-confirmed offsets, and avoids browser whole-file hashing/auth leakage. Resumable sources use checksum-protected enqueue/poll authority with domain idempotency, one active lease, bounded retries, fresh-instance recovery, expired-lease reclamation, and canonical final read; browser code never invokes the internal worker route. Before lease claim, the full-stage worker proves space for one source copy plus 8 GiB/10% headroom. A real 27,109,799-byte 3840x2160 FFV1 source crosses four 8 MiB-or-smaller chunks, recovers a lost committed-chunk response, passes backend hash and generation-bound probe/finalization, survives restart/replay, and creates a checksum-bound 1920x1080 Rec.709 analysis proxy. A separate valid 18,874,505-byte 3840x2160 MP4 follows resumable upload and background finalization into canonical approval, source-bound voice/color, private 4K composition, final QA, replay, and download. Exact source authority is verified before and after proxy or canonical work; the proxy is explicitly final-render-ineligible while the immutable original remains render authority. Declared HDR/wide-gamut sources remain withheld from the ordinary SDR path. | Both proofs are short byte-representative fixtures, not long-duration or genuinely huge-object tests. The worker still performs full hash traversal plus private staging per attempt; canonical source execution is MP4-only; source-bound Python, FFmpeg outputs, and canonical dependency artifacts retain bounded buffered contracts. Remotion v2 selected inputs and final output stream without whole-media base64 but remain capped at 208 MiB combined input and 256 MiB output. Distributed dispatch, durable byte progress, live resumable CORS/IAM/session behavior, sustained worker disk/I/O, real 50 GiB/250 GiB/ceiling uploads, broad professional codec/timecode/VFR/multichannel/damaged-input suites, and an executed color-managed HDR transform remain unverified. Real-user storage, GCS orphan lifecycle, malware scanning, parser/subprocess isolation, privacy operations, and signed delivery remain gated. |
| Distributed large-media finalization | `contract_ready`; hosted runtime remains blocked | One server-derived pre-plan technical-ingest seed and a 48-check database-neutral conformance fixture prove exact upload identity, no fabricated snapshot/reservation, capacity-before-attempt, one lease, generation-bound retry, monotonic byte/phase checkpoints, fresh-adapter replay/resume, cancellation, terminal exclusivity, private create-only completion readback, timeout-at-expiry, versioned attempt-level internal infrastructure cost, and a V1 contract that cannot self-promote even if every future live-evidence flag is asserted. | This is source/in-memory contract evidence only. No durable Postgres adapter, multi-replica transaction, Cloud dispatch, live GCS byte traversal, deployed worker, huge-object benchmark, or production authority exists. `distributed` mode and hosted uploads above 16 MiB remain fail-closed. |
| Upload-to-planning authority handoff | `private_executable` for authenticated local/private backend scope | Named-edit creation/save idempotently initializes server-owned Exact Edit Preferences. Before canonical save, the browser strictly reads and synchronizes explicit current-edit values, then rebuilds canonical components with the server baseline/revision. The strict handoff verifies finalized upload lineage and exact source order before deriving source-preparation and frame-confirmation evidence server-side, records that evidence in the exact authority, and returns the exact source/planning binding used by publication. Exact duration-preserving ordered source sequences with one full-duration caption or two through seven ordered, non-overlapping captions can compile into the bounded source-sequence graph. An exact fixed voice-delivery plan can additionally compile one source-bound FFmpeg WAV per source and replace source audio in final composition, but publication fails closed before approval unless every bound source has probed audio. A bounded one-source plan can compile an exact `clean_natural` or `premium_clean` subtle/balanced FFmpeg color work item. Exact two-through-eight-source source-only plans can additionally compile first-source-reference shot matching: source one produces the QA-passed baseline Matroska and every later source depends directly on that exact artifact before bounded matching. All paths require matching operation sets, trims, captions, replacement voice, frame, and 4K estimate authority. The maximum publication profile now naturally preserves eight source/timing boundaries while consolidating only mock caption presentation into seven contiguous cues. The focused standalone runtime remains a three-source continuity fixture; the signed-in browser completes the maximum eight-source/eight-voice/eight-color/final-master lifecycle. A separate one-source color regression remains intact. | A named edit completes only when its requirements fit the exact bounded profile. Unsupported transitions, SFX, music ducking, richer audio, missing source audio, unsupported segment operations, or color behavior outside the fixed first-source-reference profile still block before approval. The eight-source proof uses short synthetic SDR inputs; arbitrary source counts, representative production media, arbitrary reference selection, broader color workflows, real-user Supabase/storage, deployed identity/tenancy, and production operations remain blocked or unproven. |
| Edit Brief | `private_executable` for exact local/private planning-to-review binding; browser presentation remains local-test UI | After Footage Prep, a top-right `Edit Brief` action focuses the single existing inline brief. It reports Optional/Draft/Ready truthfully; opening it is non-mutating, while meaningful changes invalidate stale plan/approval state. The backend-local record is owner/workspace scoped. A signed-in maximum eight-source browser run compiled the Brief into plan v1, reopened the same inline Brief, invalidated the stale plan after a goal change, published and approved plan v2, and preserved that exact goal through accepted private review. | It is not a separate route, drawer, or persistent workspace tab. The evidence is single-host/local-test only, not deployed multi-user Supabase durability or a production UI claim. |
| Edit Preferences | `private_executable` for authenticated local/private exact-edit synchronization | Saved defaults use live workspace membership/role checks, per-user/workspace storage, checksums, atomic writes, compare-and-swap, and authorization-before-idempotency. Named-edit save initializes a server-owned immutable baseline; canonical save strictly reads/updates the exact current values, binds the returned preference revision into plan components, and lets only the backend promote verified source/frame evidence. Repeated internal edit-state saves reuse the existing exact-edit record instead of replaying obsolete initialization authority, and the signed-in browser path completes through persisted review acceptance without an idempotency-replay error. | This is single-host local/private persistence only. No Supabase preference table, reviewed RLS, controlled staging, production durability, or collaborative multi-device claim is made. |
| Edit Reference application to planning authority | `contract_ready`; local compatibility remains `private_executable` and non-promotable | Planning now resolves reusable preference guidance through one server-only `planning-preference-application-authority-port-v1`. An injected canonical reader is exclusive; `not_selected`, `connected`/planner `applied`, and durable `cleared` remain distinct; canonical failure or clear never falls through to the legacy store. Expectation creation and later binding/revalidation use the same selection policy, exact identity/version/hash checks fail stale, and the real HTTP runtime preserves only the server-injected port. The existing private Preference Intelligence store is isolated behind an explicit local/internal compatibility adapter instead of remaining a direct shared-planner read authority. | No live `read_exact_edit_reference_application_state_v2` or `mutate_edit_reference_application_lifecycle_v3` repository/RPC adapter is mounted. Hosted/cloud and production runtimes reject an absent or compatibility authority; production additionally rejects a fixture, noncanonical, or non-verified authority. The required gate is `server_only_application_and_planning_read_rpc_adapters_verified`. Supabase/RLS transaction evidence, durable apply/replace/remove atomicity, cross-device recovery, and same-source website execution remain blocked. |
| Intent compilation and edit planning | `contract_ready`; deterministic mock output | Structured compiler, planning layers, approved snapshots, smoke and browser coverage | Real footage/transcript/model understanding is not executed. |
| Aspect ratio, timing, cleanup, plan, and credit approval gates | `contract_ready`; exact canonical approval is browser-testable for local/private scope | Frame/timing/cleanup policies, exact visible-total reconciliation, authenticated frontend-safe approval, immutable snapshot creation, synthetic private-test reservation, derived-job counts, replay/concurrency checks, and Playwright E2E | No execution starts from approval. Real transcript/timing workers, customer-wallet mutation, billing, settlement, and distributed transaction evidence are not proven. |
| Bounded single-source slicing | `private_executable` for one signed-in 22-second/660-frame source; planning contract verified through 3,840 frames | The additive V3 `canonical_private_4k_source_slice_mezzanine_finalize_3840_frames_v3` profile keeps V2's exact two-through-sixteen balanced 24–240-frame slice authority, then compatibility-checks the H.264 chunks, stream-copies video, and encodes the one approved continuous source-audio range once. Exact lineage, 8/8 jobs, three independently QA-reconciled/replayed chunks, same-operation retry, one 31,931,596-byte 660-frame 4K H.264/AAC master, full BT.709 VUI, PCM boundary checks, private download, final QA, review assembly/replay, and four successful plus one failed-attempt internal-cost records passed while reusing the original approved 4K estimate/reservation. | The actual proof is 22 seconds and one synthetic SDR source; 3,840 frames is planning/mutation evidence only. V3 blocks slice-local voice/color work. Representative codecs, visually lossless mezzanine/HDR evidence, multi-hour media, distributed workers/object finalization, cloud benchmarks, public delivery, billing, and production remain unproven or blocked. |
| Canonical private job execution | `private_executable` for one immutable job, one exact ordered three-source standalone continuity composition, one maximum eight-source signed-in composition, one exact source-bound professional-color regression, and one over-16-MiB 4K source regression | Authenticated job-only routes derive approved work items, outputs, tools, operations, leases, one-use dispatch, private artifacts, QA, reconciliation, and replay from server authority. Before approval, a content-addressed plan-time manifest reconciles planner declarations and work items with stable identities and proof hashes from the server catalog. The focused fixture proves three ordered trims, two caption artifacts, three source-bound voice WAVs, one baseline plus two directly reference-bound color intermediates, two hard cuts, objective boundary continuity, composition, and independent final QA. The signed-in maximum profile expands the same bounded compiler/adapter path to eight trims, seven caption artifacts, eight voices, one baseline plus seven direct reference matches, seven hard cuts, composition, and final QA inside a 27-work-item/27-job graph. The large-source regression privately stages and stream-reverifies one 18,874,505-byte 3840x2160 MP4 for source-bound voice, color, and original-source composition authority before producing and independently verifying one 19,140,634-byte QA-passed 4K master in the same canonical attempt. | Product, beta, and production flags remain false. The maximum runtime proof uses eight two-second synthetic audio-bearing SDR sources under the fixed first-source-reference profile, and the large-source proof is only eight seconds. Those canonical attempts do not prove source counts above eight, long or heterogeneous production media, large upstream intermediates, or canonical outputs materially larger than the retained 19,140,634-byte master. A separate confined Remotion runtime/persistence/QA attempt proves one 52,766,594-byte UHD output, but it is not a canonical job-lifecycle claim. Rich audio, arbitrary filters/references, skin-tone isolation, HDR delivery, distributed execution, and public export remain unproven. A plan-time identity manifest does not replace package, lease, dispatch, artifact, QA, or deployment evidence. |
| Canonical private work graph | `private_executable` for run-to-blocked, bounded failure/retry recovery, bounded complete voice and color graphs, and one grouped controlled-tool chain | Authenticated package route derives topological order, executes only dependency-ready jobs, persists exact per-job outcomes, and reuses completed jobs. Before plan hashing and approval, a server-owned compiler can now decompose an explicitly described grouped planner node into deterministic one-tool/one-output jobs while conserving dependencies, operations, required outputs, and maximum credit budget. A D3-to-ECharts fixture now proves an idempotent pre-execution failure, independent-branch continuation, descendant isolation, and a fresh-run attempt-two recovery before passing the full atomic snapshot, reservation, lease, one-use dispatch, private artifact, QA, reconciliation, replay, downstream-readback, and progress lifecycle. The graph also commits content-addressed immutable package-progress checkpoints as completed/resolved state advances; a checksum-protected atomic latest pointer prevents weaker/new-run-key state from replacing stronger progress. A five-job fixture completes snapshot validation, source-trim validation, caption generation, final composition, and independent final QA; a separate seven-job fixture adds exact replacement voice and source-bound professional color before composition. Required completion produces one private create-only, checksum-verified, package/snapshot-bound certificate that survives fresh service instances and advances journey recovery to review assembly. | This is generated-fixture, single-process/single-host evidence, not arbitrary plan/provider-chain coverage, a distributed scheduler, or a deployed worker claim. Retries remain same-operation and immutable-attempt bounded; fallback changes still require approved policy or user/new approval. Grouped provider work, grouped terminal render/final QA, and tool-free multi-output work remain behind separately named authority gates. No job IDs, artifact identities/bytes, paths, leases, or dispatch authority are exposed by progress recovery. |
| Canonical package attempt, dispatch outbox, and terminal reconciliation | `private_executable` for cooperative cross-process process-restart consistency on one host; distributed database/cloud remain blocked | The package queue selects the attempt server-side. One package-scoped `0600` cooperative lock serializes queue and outbox access across Node processes. One checksum-protected WAL commits the queue claim plus exact opaque dispatch entry; separate versioned terminal WALs commit exactly one accepted-worker completion, bounded pre-commit failure release, or accepted-worker timeout release plus its terminal receipt. Completion, failure, and timeout are mutually exclusive. An expired accepted worker fences later Cloud-dispatch attempts until controller-authenticated timeout reconciliation; retry/exhaustion is derived from immutable `maxAttempts` and never starts automatically. DeepFilterNet, Remotion 4K slice, and FFmpeg 4K finalization persist one exact create-only runtime-cost start before execution. A controller-owned package scan selects expired attempts without caller-provided job identity, finalizes internal cost through immutable lease expiry, and invokes the existing atomic timeout transaction. The additive database-neutral port and locked seven-function server RPC adapter reject caller-selected state/cost, enforce exact replay and no hidden retries, and pass the v16 aggregate without activating SQL or a live client. Missing, tampered, unsupported, or mismatched evidence fails without queue/outbox mutation. | This is cooperative single-host plus database-neutral contract evidence only. It does not prove hostile same-UID resistance, host-power/filesystem-failure durability, real Postgres constraints/rollback, shared-filesystem or multi-replica locking, production metering profiles beyond the three named workloads, a distributed database transaction, a deployed worker-death observer/sweeper, Cloud Tasks creation, Cloud Run invocation/termination, live worker execution/callbacks, deployment, or production authority. |
| Cloud dispatch receiver identity | `private_executable` for a cryptographic contract fixture and mutually exclusive terminal completion/failure/timeout contracts; supported Google verifier adapter is source-verified; live cloud remains blocked | A bounded server-owned JWKS snapshot verifies RS256 signatures, a 2048-bit RSA key with the standard public exponent, exact Google issuer, audience, service-account email, subject, issue/expiry/not-before time, and token lifetime before producing a process-branded identity capability. An additive server-only adapter now accepts only one bounded Authorization Bearer JWT, preflights canonical RS256 headers before key lookup, calls `google-auth-library` with the exact server-owned audience/lifetime, independently rechecks canonical issuer/principal/audience/timing, times out, and emits the same token-free process brand. Controller and worker receivers reject caller-authored or structured-cloned evidence, bind the exact principal to durable receipts, persist no bearer token, and preserve mutually exclusive completion/failure/timeout reconciliation plus internal-cost evidence without customer commercial authority. A fresh accepted-worker identity is also required for the new durable attempt-start boundary. | The live-adapter smoke stubs only the Google verifier method and performs no live key/token/IAM operation. No receiver HTTP route is mounted. The same-host claim, attempt-start, and terminal reconciliation stores are not distributed transactions. No controlled Google token/key-cache evidence, Cloud Tasks IAM, Cloud Run invocation, distributed database queue/outbox/start/terminal transaction, deployed worker-death observer, deployment, or production identity evidence exists yet. Cloud dispatch, worker execution, and live terminal callbacks remain unauthorized. |
| Private render and review journey | `private_executable` for bounded internal fixtures, an exact three-source standalone continuity master, and one complete signed-in maximum eight-source local-test named-edit journey | The canonical graph applies approved trims and exact caption frame ranges, executes the fixed source-bound voice-delivery recipe, verifies private WAV dependencies, and replaces source audio only under the approved replacement policy. For color, it executes source-bound analysis/correction, persists lossless VP9 BT.709/yuv420p Matroska intermediates without source audio, and verifies their pixels and lineage. The focused three-source fixture proves that sources two and three depend directly on the exact QA-passed first-source reference and pass objective continuity at both hard cuts. The signed-in regression creates the exact snapshot/reservation/package, completes its 27-work-item/27-job maximum graph through only immutable approved-attempt retries, reads and probes the non-passthrough sixteen-second 3840x2160 review through authenticated no-store bytes with integrity headers, confirms all eight source-bound audio identities remain in approved order, reads sanitized journey state, and persists acceptance. Canonical final composition now injects exact selected source/caption/voice streams, persists the raw output create-only, independently stream-probes it, and serves authenticated full or single-range bytes without whole-artifact buffering. The exact professional-color canonical attempt proves one 19,140,634-byte QA-passed 4K master above the legacy 16-MiB output boundary; a separate runtime/persistence/QA fixture proves a 52,766,594-byte UHD MP4 outside canonical job lifecycle. The Remotion image must carry the aggregate SHA-256 of its current reviewed source tree before activation. Its canonical-private Docker tag, build context, and authority root remain isolated from Motion Studio runtime work while image-change checks fail closed. | The legacy upload-to-render route remains disabled. The signed-in browser proof uses eight short synthetic audio-bearing SDR sources and loopback local-test identity; it is not evidence for arbitrary source counts, long duration, broad codecs, large upstream intermediates, deployed tenancy, or canonical job outputs materially larger than 19,140,634 bytes. Rich music/SFX/ducking, nonzero-duration transitions, arbitrary reference selection, masks/skin-tone isolation, HDR color, unsupported segment operations, structural preference-changing revisions, deployed real-user storage/workers, public delivery, and production promotion remain unproven or blocked. |
| Professional long-form customer-delivery review | `private_executable` for one bounded two-chunk synthetic 4K package, exact named-edit discovery, canonical-journey client recovery, browser transport, actual Chromium MediaSource playback with authenticated evicted backward-seek recovery, and private/local durable watch-gated acceptance | The separate immutable nine-job delivery graph completes H.264 transcodes, independent probes, one stream-copy/AAC mux, full decoded-video and decoded-audio/sync QA, explicit authenticated acceptance, private-download reconciliation, restart-safe replay, and attempt-level internal cost while reusing the original approved 4K estimate/reservation. A create-only tenant/project/edit/snapshot pointer is published only after exact package, placement, and queue readback. The signed-in discovery route resolves the hidden package ID, reports bounded 8/9 then 9/9 progress, embeds the strict review/accepted-download receipt, and denies missing or cross-tenant identity. After private-review acceptance, the one canonical journey client preserves the safe approved-snapshot identity, recovers that strict delivery result through the existing hook, and auto-refreshes advancing delivery without weakening an accepted edit when the package is absent. The frontend-safe delivery client rejects foreign or extra internal fields, verifies authenticated ranges, records exact idempotent watch checkpoints, and blocks acceptance until refreshed completed watch evidence is present. The playback adapter appends one bounded range at a time, applies rolling-buffer backpressure/eviction, parses bounded streaming ISO-BMFF initialization/track/fragment metadata without retaining media payload bytes, resolves exact time-to-byte fragment windows, serializes all SourceBuffer mutations, rejects authority/codec/range/index discontinuity, and tracks seek-aware plausible frame coverage. Actual Chromium uses the bearer-authenticated frontend client, binds exact workspace/snapshot/review/master authority, saves frame-zero progress, completes one real 36-second fragmented H.264 High/AAC MP4 from multiple 64 KiB ranges without a whole-file browser `Blob`, evicts the opening buffer, re-fetches the exact indexed window for a backward seek to time 1.0, resumes decode, and submits exact merged coverage. The private/local server hash-chains monotonic evidence, enforces a server-observed maximum 2x elapsed-time ceiling, repairs interrupted pointer publication on exact replay, survives restart, rejects instant/stale/tampered evidence, and binds acceptance to the exact completed hash. | Both browser fixtures are deleted, so there is no retained review URL or user-viewable video. Visible named-edit UI/player mounting, distributed database-backed watch durability, representative long footage, distributed storage/workers, deployed Google sign-in, GCS/Supabase, public delivery, customer settlement, and production remain blocked. Client-observed coverage alone is not acceptance authority. Export never creates a second estimate, charge, or credit prompt. |
| Revision and recovery | `private_executable` through bounded failed-attempt retry, completed-execution adapter recovery, accepted second review, superseded-history recovery, and quiescent cancellation/compensation; browser decision/history and exact bounded plan-v2 continuation are connected for local/private scope | A started runner failure or timeout becomes an immutable failed fence without commit/completion authority; exact adapter replay cannot rerun it, and a new run can use only the remaining approved attempt allowance. A historical completed fence is checked before any fresh claim: exact artifact/QA/reconciliation/dispatch/cost evidence can reconstruct the missing adapter completion without execution, while incomplete evidence blocks without another attempt. An exact review-bound revision completes snapshot-v2 execution/acceptance. Canonical journey recovery returns a hash-bound, credential-free authenticated-history descriptor for each completed decision; the named-edit browser consumes it to reopen the exact current or superseded QA-passed MP4. For an exactly representable revision, a frontend-safe coordinator reloads the decision and injects revision authority server-side, preserves the prior snapshot/review and locked preferences, presents plan v2 with a fresh estimate, and requires a separate fresh approval. The restart-safe pre-execution cancellation saga fences unconsumed dispatch/never-started leases. A separate post-dispatch saga preserves consumed grants, failed/completed fences, committed and partial artifact/QA/reconciliation evidence, and internal-cost evidence; terminally fences remaining quiescent grants/leases; and releases only a fully unused synthetic reservation. | Browser requests and responses contain no raw revision authority, bearer token, signed URL, local path, bytes, jobs, tools, or restored execution/credit authority. An actively `started` fence or a `completed` fence still missing artifact, QA, reconciliation, dispatch, or required cost evidence fails closed. Post-commit recovery never retries the runner. Rich/structural browser revision continuation, distributed worker death detection/quiescence, spent-credit settlement/refunds, deployed disaster recovery/retention, and deployed real-user handoff remain gated. |
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

### 2026-07-21 executable and boundary-evidence audit

| Evidence | Current count | What it proves |
| --- | ---: | --- |
| Production registry | 72 | Named policy/ownership surface only. |
| Launch-core profiles | 24 | Intended first-wave tools, not readiness. |
| Hidden adapter names | 55 | Skill/planner references. |
| Bounded adapter contracts | 50 | Fixed backend contract exists. |
| Registered runner definitions | 50 / 50 | A bounded runner definition exists. |
| Callable candidates | 60 / 72 | Operation contract is executable in principle and is not assigned a non-executable worker-runtime disposition. |
| Intentionally non-executable | 12 / 72 | Planning, future, evaluation, policy-only, or explicit integration-boundary lane; no tool call is permitted. |
| Confined runner verified | 53 | Exact bounded operation ran in its approved offline runtime profile. |
| Canonical private E2E identities | 50 | Exact approved snapshot/work item, funded reservation, lease, one-use dispatch, private persistence, QA, reconciliation, replay, and downstream verification passed. |
| Canonical non-executable boundary contracts | 1 / 72 (`hyperframe`) | Exact approved-timeline handoff and browser-safe projection are deterministic and tamper-evident. This is not runner, job, render, export, external-runtime, or release evidence. |
| Canonical plan tool-identity authority | 50 / 50 in the complete fixture | All required full-fixture tools are declared by strategy, bound to exact operations, frozen with stable identity/operation/proof hashes before approval, and revalidated before execution packaging. |
| Approved work-item resource placement authority | 50 / 50 tool identities have exact catalog placement; each approved graph freezes only its exact work items | CPU/GPU/render/control-plane class, accelerator, worker cap, global cap, tool identity/proof, and blocked-provider disposition are content-addressed before approval and hash-bound through readiness, lease, dispatch, and scheduling. This is private/local authority, not deployed cloud capacity. |
| Canonical pre-approval payload authority | 50 unique tools across 19 runner families in the complete fixture | Exact structured payload, source/cleanup/dependency binding, output role/content type, and offline policy are validated before plan approval, frozen in content-addressed lineage, revalidated before packaging, and reused at dispatch. |
| Job-only canonical adapter | 15 runner classes implemented; 52 complete-matrix adapter paths plus 1 dedicated professional-color path executed; 50 exact tool identities recorded | Snapshot authority, dependency-bound source trim, and every canonical private E2E tool identity now prove server-derived adapter execution. The proof includes D3 plus dependency-bound Sharp, DuckDB, source-bound PyAV, DeepFilterNet with attempt-cost evidence, controlled libass, exact source-bound FFmpeg trim, voice-delivery, and professional-color recipes, exact Remotion final composition with approved voice replacement and selected color bytes, and dependency-bound final ffprobe QA. The additional color path reuses the already-counted FFmpeg identity; it is not a 51st tool. |
| Automatic observed CPU/memory cost lifecycle | 31 / 50 canonical identities | All 28 structured Node/Python operations, generic FFmpeg, generic FFprobe, and canonical Remotion retain exact embedded/cgroup observations and create-only internal infrastructure-cost evidence under the same snapshot/package/job/lease/dispatch/artifact/QA/reconciliation lifecycle. The other 19 canonical identities still have lifecycle proof but not this automatic observation class. Specialized long-form, deployed-cloud, official-rate, provider, and commercial metering remain separate gates. |
| Canonical provider lifecycle contracts | 4 private-injected executable contracts: Lyria V1, Storytelling Speech V2, synchronized Foley V3, and visual calibration V4 | Every provider operation reuses the same funded package queue, claim/lease, one-use provider dispatch, private create-only storage, terminal/replay/unknown-reconciliation, provider-cost, observed worker-resource-cost, and compact receipt authorities. Speech retains its ordered MP3 plus alignment set; Foley retains its 17-request async ceiling; visual calibration binds exact Motion/style/scenario/reference/frame/continuity authority to a primary-only Gemini Omni Flash MP4 lifecycle with a 15-request ceiling and expiring official-public-pricing snapshot. All four are non-promotable, perform zero live provider requests in retained proof, and leave immutable model revision, account/rate qualification, Secret Manager payload access, provider transport, cloud persistence, selection, billing, and production promotion closed. |
| Product-ready | 0 / 72 | No registry tool meets production evidence gates. |
| Frontend-executable in practice | 0 | Tool execution stays off the browser. |

The authoritative identity source is `server/tool-execution/proven-tool-identity-catalog.ts`, evidence revision `2026-07-21.31`, schema `proven-tool-identity-catalog-v2`. Every one of its 50 `canonical_e2e_verified` identities performs an exact confined operation, passes the complete private canonical lifecycle, and has exact server-derived job-adapter proof. Canonical publication now derives `canonical-tool-execution-authority-v2` from that catalog and the compiled work graph; it embeds the exact approved work-item resource-placement authority before approval, and required executable tools without both proof dimensions fail before approval. Hyperframe is the one separately measured `canonical_boundary_contract_verified` identity: it hands off an already-approved private timeline through `tool.hyperframe.handoff_approved_preview_timeline.v1` without invoking an external Hyperframes runtime, processing source media, or claiming a runner/job/release. Historical revision `.30` recorded FFmpeg's additional verified `video/x-matroska` artifact contract plus its revision-isolated `8.1.2-color-v1-local` runtime identity. Neither revision increases the 50-tool executable count or promotes product readiness. This is private single-host/source-contract evidence, not distributed-worker, external-beta, or production evidence.

### Actual execution coverage

The 50 canonical identities span deterministic Node/Python operations, FFmpeg/ffprobe, Remotion, libass, fixed browser graphics, bounded AI-capability fixtures, native image/audio processing, container/package validation, VapourSynth, AudioFlux, rembg, and DeepFilterNet. Exact output content types include JSON, SVG, PNG, WAV, NUT, lossless private Matroska, and private MP4 artifacts according to the approved operation contract. The conditionally authorized fixed-template Playwright capture now persists through the shared root-confined create-only/no-follow boundary: concurrent identical attempts reuse only exact bytes, different-byte collisions never overwrite, and target/ancestor symlinks fail without external mutation. This does not authorize URLs, navigation, arbitrary HTML, authenticated capture, or public browser execution.

For every accepted private run, evidence is valid only when operation identity, snapshot, work item, reservation, lease attempt, expected output, private artifact identity, checksum, byte length, QA, reconciliation, replay, and downstream dependency readback agree. DeepFilterNet plus the V3 Remotion chunk and FFmpeg finalizer workloads retain their scoped attempt-level internal production-cost evidence. In addition, all 28 structured Node/Python operations and generic FFmpeg/FFprobe now automatically retain exact observed CPU/memory and internal infrastructure-cost evidence using integer micros and the versioned rate card. Failed started V3 attempts are retained as ReEditPro-absorbed internal cost. Terminal review verifies and hash-commits the scoped records. That evidence contains no customer price, customer credits, service fee, wallet, settlement, or charging authority.

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

## Professional Long-Form Planning Boundary

The additive
`canonical_professional_4k_object_chunk_graph_6h_v1` server contract now plans
frame-exact object-backed work for 129 seconds through six hours, up to 512
approved source ranges, rational professional frame rates, and up to 124
balanced technical chunks. Its 30-minute/24-source and six-hour/512-range
fixtures preserve approved hard cuts separately from continuous technical
splits, require every chunk's QA before finalization, keep audio continuous,
require color-continuity QA, reuse the original approved 4K estimate, and store
no signed URL as canonical truth. The maximum fixture expands to 255 child
work items with at most 127 dependencies, inside the existing 256/128 canonical
ceilings. A separate server-only bridge now verifies that the exact seed,
plan, estimate, timing, reservation, controller input, and expanded child graph
belong to one approved snapshot and rejects substitution or self-promotion.
The canonical follow-up now persists the exact seed and one blocked controller
through real local/private plan publication and approval, reloads both from the
approved snapshot, and persists a deterministic content-addressed 255-child
manifest after approval. A specialized server-only follow-up persists the
immutable child package and placement manifest and atomically publishes one
exact 255-job private queue. The ordinary execution-package service refuses
this snapshot. The dependency-root snapshot-validation child now completes
through exact authority, one lease/attempt, private artifact, QA,
reconciliation, versioned internal-cost evidence, terminal queue commit, and
restart replay. The second topological private-source-authority child now
separately completes the same one-use lifecycle and validates all 512 exact
source checksum/size/generation, cleanup, segment, and gap-free frame-range
bindings. Its reconciliation records 124 render dependents plus continuous
audio without authorizing them. The third bounded child now validates the exact
approved Master Timing component set, rational frame base, 512 structured
segments, 18 timing categories, timing-priority rules, and approved estimate
metadata through a separate QA-worker lease, one-use attempt, private artifact,
QA, 126-dependent reconciliation, internal cost, terminal completion, and
restart replay. The server-selected first object render and its paired
independent QA now also complete through separate persisted authorizations,
leases, one-use dispatches, create-only private media/evidence artifacts,
attempt-level internal costs, reconciliation, terminal completion, tamper
refusal, and exact replay. That bounded operation assembled 5,226 frames
(`174.2` seconds) from five approved slices across five approved 4K objects
into one 220,341-byte video-only H.264 Matroska object; FFprobe separately
reopened and verified it. The separate continuous-program-audio child now also
completes through one exact queue authorization, lease, durable heartbeat,
one-use dispatch, exact staging of eight private 4K sources and 512 approved
ranges, fixed lossless FLAC execution, create-only persistence, independent
metadata and decoded-sample QA, separate FFmpeg and FFprobe internal-cost
records, reconciliation, tamper refusal, and exact replay. The maximum fixture
produced a 1,144,083,803-byte six-hour FLAC with exactly 1,036,800,000 decoded
stereo sample frames while reusing the approved 4K reservation without a
second estimate or charge. Eight of 255 jobs are complete and the remaining 247
children are capability-blocked. They include the other 122 render/QA pairs,
cross-chunk color, finalization, and final QA. The exercised inputs are
synthetic constant-color H.264/AAC MP4 fixtures with a narrow 30-fps profile;
this does not prove diverse many-angle footage, arbitrary professional
codecs/HDR/VFR/surround audio, complete long-form editing, object storage, a
distributed database, or Google Cloud execution.

The retained six-hour queue now also proves one bounded started-attempt
recovery before chunk 2 completes. Attempt 1 expires without artifact or
completion authority, receives immutable failed internal-cost evidence, is
reopened after process-state reset, and replays its reconciliation without a
second cost or delivery attempt. Only a fresh queue claim starts approved
attempt 2, which then completes the same server-selected render and paired QA.
This adds recovery evidence, not another completed job: the graph remains
8/255 complete with 247 queued and nine total delivery attempts. Distributed
worker death detection/termination, Postgres-backed atomicity, GCS, Cloud Run,
and the remaining six-hour executions are still unverified.

A separate retained 129-second/two-chunk customer-delivery graph now completes
all 9 of its jobs: exact passed-review promotion, two private 4K H.264 High
encodes, two independent chunk probes, one H.264-stream-copy/one-time
FLAC-to-AAC private MP4 mux, one full decoded-video QA job, one full
decoded-audio/sync QA job, and one separately authorized private-download
reconciliation. Every attempt has immutable authorization, lease, one-use
dispatch, private create-only evidence, reconciliation, internal-cost evidence,
and restart-safe exact replay. The resulting private master SHA-256 is
`dbb8329f33fc78e208f390262b6551388deaa887d9343b32ef43608f841897e3`.
Both objective QA outcomes remain honestly `needs_user_review`; a deterministic
synthetic authenticated attestation binds the exact review packet, master, QA
evidence, known warnings, approved intent, and no-speech disposition before it
can authorize the ninth job. Exact whole-file and byte-range reads pass through
the authenticated workspace boundary, another user is denied, and process-state
restart replays the same immutable decision/download evidence without another
attempt. A create-only exact-edit/snapshot discovery pointer and actual Express
route resolve the package without caller-supplied package identity, return 8/9
review-ready progress, and recover 9/9 accepted-download authority. The smoke
deletes its fixture workspace. A separate actual-Chromium check decodes and
plays a real 36-second fragmented H.264/AAC MP4 through multiple bounded range
responses, reaches contiguous client-observed full-program coverage, evicts the
opening buffer, re-fetches the exact indexed fragment window for a backward
seek to time 1.0, resumes decode, and also deletes its temporary fixture.
Together these prove local browser transport, playback, and exact authenticated
backward-seek recovery, but not a named-edit UI mount, retained review link, or
deployed persistence. Private/local durable server watch authority is proven
separately; distributed database-backed watch durability is not.
This 9/9 delivery result is independent from, and must not be described as
progress on, the six-hour 255-job review graph. It is single-host synthetic SDR
evidence, not multi-hour throughput, distributed cloud, product, or production
proof.

## Private Pipeline Evidence

`npm run qa:canonical-private-pipeline` is the authoritative bounded canonical audit command. It verifies exact source, Edit Preferences, Edit Brief, a real resumable-sized 4K private ingest/proxy lifecycle, an over-16-MiB 4K canonical source execution, 4K estimate/export policy, browser-safe publication/approval/package/preparation/review/recovery clients, real local backend authority, bounded first-source-reference multi-source voice/color execution, bounded one-source professional-color regression, one separately labeled above-16-MiB Remotion runtime/persistence/QA output proof, active named-edit Playwright states, and the versioned proven-tool identity report. The current `npm run qa:internal-pipeline` adds auth/runtime, project/edit tenancy, approved tool-manifest, private Playwright capture, and the signed-in named-edit workflow. On 2026-07-15, its exact-code v3 24-phase run completed all 24 phases in 1,029,183 ms with exit code 0. The focused backend/runtime phase produced one private 4K master from three ordered sources, three exact source-bound voice deliveries, one baseline plus two independently first-reference-bound color intermediates, and two approved hard cuts; objective continuity passed at both boundaries before final QA, download, and replay. The final browser phase created a project and named edit, uploaded and probed the maximum eight distinct private audio-bearing sources, synchronized exact Edit Preferences, created and revised the inline Edit Brief, preserved the confirmed frame, approved one 4K-ceiling estimate, requested the immutable package separately, completed the 27-work-item/27-job private work graph, loaded and downloaded the integrity-bound non-passthrough eight-second 3840x2160 MP4, confirmed all eight source-bound tones in approved order, read sanitized journey state, and persisted acceptance. The same run regenerated evidence revision `2026-07-15.30` with exactly 50 private canonical/job-adapter identities and kept provider activation, live billing/wallet mutation, remote Supabase, public delivery, deployment, external beta, and paid production false. The earlier exact-code v2 24-phase run completed in 947,417 ms with the then-current three-source signed-in path; v3 supersedes that maximum-count browser evidence. The earlier 580,973 ms canonical run proved the then-current two-source reference match, the prior 604,446 ms canonical run predates reference matching, and the 719,518 ms 22-phase full run remains a historical fail-closed baseline. A separate complete `npm run smoke:canonical-private-tool-dispatch` execution passed with exit code 0 and reverified all 50 exact private canonical/job-adapter identities, including dynamic grant-set tamper/restore preservation. Both aggregate commands stop on the first failure and emit a machine-readable step report; a zero exit code means every included assertion passed, including assertions that unavailable or production-only behavior stays blocked.

The v32 run on 2026-07-21 UTC is the current bounded aggregate verdict for this
branch. It passed `43/43` stages with exit code `0`; its final tool report was
generated at `2026-07-21T03:00:20.253Z`. It added the exact two-output
Storytelling Speech private-injected lifecycle in `1,507 ms`, reverified the
complete 50-tool canonical lifecycle in `911,426 ms`, covered 74 tool/provider
resource contracts, and retained exactly 50 canonical E2E plus 50 job-adapter
tool identities. The six-hour graph remains honestly at eight of 255 jobs and
two of 124 object-chunk pairs. The separate customer-delivery graph,
three-source composition, professional-color path, UHD Remotion streaming
proof, and all 11 named-edit browser tests passed. A final focused
post-aggregate guard now also refuses observed provider-worker infrastructure
cost above the immutable attempt ceiling or resource evidence ending after the
terminal; the Speech adversarial smoke, historical Lyria smoke, and server
typecheck passed afterward. Every tool's product/external-beta/production
readiness, specialized long-form and Remotion resource observation, deployed
Google Cloud, distributed database, providers, billing, remote Supabase,
public delivery, external beta, and paid production remain false. Earlier v31,
v30, v29, and v24 runs remain historical evidence and are superseded by v32
for the bounded aggregate verdict.

The prior exact-code v22 full run is historical pre-first-object-chunk
evidence. It started at `2026-07-18T12:52:16.698Z`, finished at
`2026-07-18T13:23:50.164Z`, and passed `37/37` stages in `1,893,466 ms`.
The 30-minute/six-hour long-form planning-contract stage passed 27 adversarial
checks in `434 ms`, the approved-snapshot binding bridge passed 22 checks in
`736 ms`, and the canonical post-approval/promotion/root/source-authority/
master-timing stage passed 80 checks in `24,569 ms`. The database-neutral
distributed package-state port passed in `713 ms`, its locked server-only RPC
adapter passed in `484 ms`, the single-host package transaction passed in
`18,477 ms`, and the timeout-aware receiver passed in `2,417 ms`. Three-source
composition passed in `632,678 ms`, professional color in `637,463 ms`, and the
final stage completed the exact eight-source, 27-job, 16-second `3840x2160`
private-review journey in `426,251 ms`. Exactly 50 canonical E2E and 50
job-adapter identities remained
verified. Canonical long-form publication now persists the exact seed and one
blocked controller; after approval, a fresh service revalidates that authority
and persists the deterministic 255-child bridge/manifest, immutable specialized
package, placement authority, and exact private queue. Ordinary package
creation remains refused. The root snapshot-validation, private source-
authority, and strict master-timing children each complete through separate
authority, lease, one-use attempt, internal cost, private artifact, QA,
reconciliation, terminal commit, and replay lifecycles. The source child
validates all 512 exact ranges; the timing child validates the exact approved
timing components, rational frame base, all 512 segments, 18 validation
categories, approved estimate coverage, and 126 downstream dependencies. The
remaining 252 child leases, chunk tool-cost authority, dispatch, long-form media
execution, and object storage remain blocked. No canonical package-state SQL function was
executed and no live RPC client was activated. Distributed database
queue/outbox/terminal atomicity, deployed worker-death detection, live Google
identity/IAM and cloud execution, providers, customer billing/wallet mutation,
remote Supabase, deployment, public delivery, external beta, and paid
production remained false. The v21 aggregate remains historical pre-master-
timing-execution evidence, v20 remains historical pre-source-authority-
execution evidence, and v18 remains historical pre-root-execution evidence.

The v19 aggregate remains historical pre-reservation-expiry-hardening evidence.

The v22 aggregate also reverified the private Docker execution transport after
credential-helper deadlock hardening. Server-side private Docker subprocesses
receive a fresh intentionally absent configuration path and inherit no Docker
credential config, context, or host; builds use a reviewed local Buildx binary
with local image loading, while push, remote-output, secret, SSH, and builder
overrides fail closed. This is local/private execution evidence only, not live
Artifact Registry, Google IAM, cloud-worker, deployment, or production proof.

The preceding exact-code v12 run passed `32/32` stages and remains historical
pre-Docker-transport-hardening evidence. Its timeout-aware receiver completed
in `1,577 ms`, and its final maximum-eight-source review completed in
`382,429 ms`.

The preceding exact-code v11 full run passed `32/32` stages in `1,686,223 ms`,
including the
single-host cross-process package claim/outbox transaction and mutually
exclusive accepted-worker queue/outbox completion/failure transactions,
50-tool cloud-target contract, cryptographic service-identity verifier, and
terminal-reconciliation-aware durable outbox receivers. The final stage
completed the exact eight-source, 27-job, 16-second `3840x2160` private-review
journey and persisted acceptance. Exactly 50 canonical E2E and 50 job-adapter
identities remained verified. Versioned failed-attempt internal-cost evidence
stayed separate from customer price, credits, service fee, wallet, billing, and
settlement. Distributed database queue/outbox/completion/failure atomicity,
live Google identity/IAM and cloud execution, providers, customer
billing/wallet mutation, remote Supabase, deployment, public delivery, external
beta, and paid production remained false. It remains historical
pre-timeout-reconciliation evidence; the v10 runs remain historical
pre-failure-reconciliation evidence.

The fresh exact-code full internal run on 2026-07-16 completed all 27 phases in
1,985,135 ms with exit code 0. It retained the large-source, professional-color,
oversized-streaming, named-edit, and 50-tool evidence, then independently
completed the maximum signed-in eight-source journey in 425,312 ms. That final
phase uploaded and probed eight two-second sources, approved one 4K-ceiling
estimate, completed all 27 server-derived jobs across three approved-attempt
graph passes, produced and downloaded a non-passthrough 16-second 3840x2160
review, preserved all eight source-bound tones, and persisted acceptance. The
first two graph passes retained only exact attempt-one
`failed_retry_available` outcomes; the third completed the graph. No job
exceeded its immutable attempt allowance, and no user-review, fallback, or
post-commit state was bypassed. Provider, remote Supabase, customer
billing/wallet, deployment, public-delivery, external-beta, and paid-production
gates remained false.

The post-change exact-code v4 full run on 2026-07-15 completed all 24 phases in
1,075,984 ms with exit code 0. In addition to the existing maximum-count browser
evidence, it passed the 27,109,799-byte resumable 4K ingestion/proxy fixture and
the separate 18,874,505-byte 4K MP4 through resumable recovery, background
finalization, immutable approval, attempt-scoped source staging, streamed
size/SHA-256 reverification, voice and professional-color execution, private 4K
composition, final QA, replay, and download. The run retained evidence revision
`2026-07-15.30` with exactly 50 canonical/job-adapter identities and kept all
provider, remote Supabase, customer billing/wallet, deployment, public-delivery,
external-beta, and paid-production gates false. This v4 run supersedes v3 for
the exact-code aggregate verdict; the earlier results remain historical evidence.

The exact-code v5 full run on 2026-07-15 completed all 25 phases in
1,135,934 ms with exit code 0. It retained the v4 large-source and maximum-count
evidence while moving canonical Remotion composition to bounded v2
server-injected input/output streams. Its separate output-boundary phase
produced and independently verified a 52,766,594-byte 3840x2160 H.264/AAC MP4,
35,989,378 bytes above the former 16 MiB ceiling, through confined rendering,
pre-commit create-only persistence, full rehash, exact range read, and streamed
FFprobe QA. The three-source canonical phase passed in 563,989 ms, the
over-16-MiB canonical source/color phase in 74,055 ms, the separately labeled
large-output phase in 105,985 ms, all 11 named-edit browser tests in 19,857 ms,
and the final signed-in eight-source accepted-review phase in 342,303 ms. It
re-reported exactly 50 canonical/job-adapter identities at evidence revision
`2026-07-15.30`. Product, provider, billing/wallet, remote Supabase, deployment,
public-delivery, external-beta, and paid-production gates remain false. This v5
run supersedes v4 for the exact-code aggregate verdict.

The additive focused V3 source-slice finalization run on 2026-07-16 completed
its signed-in eight-job/660-frame private graph in 379,285 ms with exit code 0.
It rendered three independently QA-reconciled 4K chunks, compatibility-checked
and stream-copied H.264 video, encoded the one continuous source-audio range
once, and produced a 31,931,596-byte 4K H.264/AAC master with complete BT.709
VUI. Private download, final QA, review assembly/replay, and five attempt-cost
records passed. This focused result does not replace the aggregate verdict or
prove cloud throughput, multi-hour media, public delivery, or production.

The historical private-upload smoke remains a fail-closed regression for the retired caller-authored execution route; it is no longer the aggregate pipeline verdict. The authenticated local/private canonical path preserves unique incremental source identity and finalized media identity, synchronizes current Exact Edit Preferences into server authority, derives verified source/frame evidence, and can present and approve an exactly representable source-and-caption plan through frontend-safe coordinators. The named-edit browser can request or recover one exact private execution handoff from the approved snapshot without starting execution, then explicitly request backend-owned private preparation from that exact package. The preparation coordinator reloads immutable authority, derives the dependency-ready work graph server-side, and returns only bounded progress/blocker counts or private-review readiness; it does not accept or expose jobs, tools, commands, paths, credentials, providers, or prices. It may start a follow-up graph run only for exact `failed_retry_available` outcomes with remaining immutable attempts; completed siblings replay, while user-review, fallback, exhausted-attempt, and post-commit states stop the coordinator fail-closed. The browser integrity-checks the exact private review bytes, records acceptance or a structured revision, refreshes into persisted decision state, reopens immutable history, and can submit an exactly representable replacement candidate. The exact signed-in maximum eight-source scenario now completes this path instead of stopping at publication. It succeeds because the current Brief/compiler output fits the approved eight-source/seven-caption/eight-voice/eight-color profile; source-bound voice compilation fails before approval when a probed source lacks audio. Plans requiring unsupported transitions, music/SFX/ducking, richer audio, broader color behavior, or unsupported segment operations remain visibly blocked rather than silently simplified. Rich/structural revision compilation and deployed real-user infrastructure remain required.

The aggregate command now proves one short local-backed 27,109,799-byte 4K
ingestion/proxy lifecycle plus one separate 18,874,505-byte 4K MP4 through
canonical approval, source-bound execution, final QA, replay, and download. It
also proves bounded v2 Remotion transport plus a separate 52,766,594-byte
runtime/persistence/QA output. The same large-output attempt does not carry the
canonical job lifecycle. The aggregate does not prove live GCS, long-duration
or genuinely huge media, large upstream intermediates, a deployed real-user
upload-to-review journey, live provider execution, public export, or paid
production.

## Release State

| Release target | Current state | Reason |
| --- | --- | --- |
| Local browser/UI testing | available | Mock-safe browser flows and Playwright coverage exist. |
| Authenticated canonical single-job execution | available | Server-derived private route, exact runner execution, QA/reconciliation, durable service replay, and downstream verification pass. |
| Authenticated bounded source-slice execution | available for one local/private 241–3,840-frame preserve-source plan; actual proof is 660 frames | Exact V3 slice lineage, per-chunk 4K execution/QA/recovery, H.264 stream-copy plus one continuous source-audio encode, final QA, replay, terminal-review cost reconciliation, private download, and exercised PCM continuity pass. This is not long-program, distributed-cloud, public-delivery, or production readiness. |
| Authenticated private upload-to-review pipeline | available for the bounded signed-in local-test maximum eight-source profile; broader product, beta, and production paths remain blocked | The authenticated backend persists a checksum-protected tenant-scoped planning handoff and content-addressed publication candidate, then presents one server-owned canonical plan only when it is exactly representable. The named-edit browser now proves eight distinct private uploads and probes, exact Edit Preferences and Edit Brief compilation/revision, plan v2, one 4K-ceiling approval, separate immutable handoff, 27-work-item/27-job private execution with bounded approved-attempt recovery, authenticated integrity-bound sixteen-second 3840x2160 playback/download, sanitized journey readback, and persisted acceptance. Approval and handoff creation start no execution; raw package/jobs/tools/artifact/revision authority remain backend-only. | The proof uses loopback local-test auth and eight short synthetic SDR sources. Unsupported rich compilation, arbitrary or representative long production media, structural preference-changing revisions, deployed real-user operations, external beta, public delivery, and production remain blocked. |
| Controlled staging with real users | blocked; guarded gateway activation, same-SHA Pages/readiness, owner-interactive Google session, and Google-first profile/workspace bootstrap/readback source are ready | The existing Cloud Run API remains IAM-private. Source now defines a gateway-authenticated browser bridge with backend Supabase revalidation, rollback-aware activation with immutable sanitized evidence, a same-SHA Pages consumer, credential-free Google-session readiness, and an owner-local headed verifier for exact callback, Google identity, protected reload, authenticated gateway readback, and sign-out. If a first Google login lacks ReEditPro tenancy, guarded same-SHA backend workflows separately require Admin readback of an already Google-linked user, confirmed email, and prior Auth sign-in, bind the protected email to the owner verifier's hash, create/reuse only profile/workspace/membership staging rows, perform a mutation-free readback, and then require a fresh owner-interactive Google-session verifier run. None of these workflows has been pushed or run; API Gateway remains disabled and no live Gmail, canonical Supabase/RLS, GCS, distributed worker, privacy, or operational edit journey has passed. |
| External beta | blocked | Production readiness scenarios intentionally fail closed. |
| Paid production | blocked | Billing, settlement, real providers/tools, public delivery, security, and operations remain incomplete. |

## Truthful Product Language

Safe current description:

> ReeditPro has deterministic planning and canonical approval authority plus 50 exact private tool lifecycles. Its bounded compiler can publish one exact source or a duration-preserving ordered sequence of two through eight sources with one full-duration caption or two through seven ordered, non-overlapping captions. When the approved audio request exactly matches the fixed professional voice-delivery recipe, it emits one source-bound FFmpeg WAV per source and requires verified audio on every bound source before approval. Multi-source color uses one QA-passed first-source reference and makes every later color job depend directly on those exact bytes. The focused continuity fixture composes three sources through explicit boundary-continuity QA; the strongest signed-in runtime proof reaches the current maximum with eight sources, seven caption cues, eight source-bound voices, one baseline plus seven directly matched color intermediates, seven hard cuts, a 27-work-item/27-job graph, bounded approved-attempt recovery, final QA, authenticated private download, and all eight audio identities in approved order. A separate one-source fixture preserves the exact bounded color regression. Every initial approved estimate uses the universal 3840x2160 4K UHD cost basis; 1080p, 2K, and 4K exports of that same approved deliverable do not create a second estimate. The signed-in local-test browser proves project/edit creation, private upload and probing, exact Edit Preferences and Edit Brief revision, plan v2, one 4K-ceiling approval, separate immutable handoff, integrity-bound sixteen-second 3840x2160 private playback/download, sanitized journey readback, and persisted acceptance. Confirmed frame authority survives cross-platform Brief context, and operational upload metadata no longer fabricates captions, visuals, privacy cuts, or silence cleanup. Plans outside the bounded profile and rich/structural revisions remain approval-blocked. Deployed real-user infrastructure, external beta, public delivery, live billing, Supabase/RLS tenancy, distributed workers, and production promotion remain gated.
>
> The connected private ingest evidence carries one real 27,109,799-byte 3840x2160 source above the resumable threshold through interrupted-upload recovery, backend checksum/finalization, immutable-source verification, and a source-bound analysis proxy. A separate valid 18,874,505-byte 3840x2160 MP4 continues through canonical approval, source-bound voice and color, private 4K composition, final QA, replay, and download. Both are short local-backed fixtures, not evidence for live cloud transport, long-duration media, large upstream intermediates, or genuinely huge objects.
>
> Canonical final composition now uses bounded server-injected source/caption/voice streams, create-only streamed output persistence, independent streamed FFprobe QA, and authenticated full or single-range reads. A separate confined runtime/persistence/QA attempt produced a valid 52,766,594-byte 3840x2160 MP4, 35,989,378 bytes above the old 16 MiB output ceiling. That large-output attempt is not a canonical job-lifecycle or production claim.
>
> An additive single-source v2 profile now preserves one approved range across exact technical render slices. Its fresh signed-in proof rendered three 220-frame chunks and a 660-frame 4K master, recovered one chunk inside its approved attempt ceiling, reused completed work, and passed PCM continuity at both slice boundaries. The profile is bounded to 3,840 planning frames, one source, and preserve-source audio/color; it is not evidence for a 30-minute output, multi-hour raw footage, distributed cloud workers, or slice-local professional audio/color processing.

Do not claim:

- “50 tools are production-ready.”
- “The full provider pipeline is live.”
- “Credits are transactionally charged.”
- “Exports are publicly delivered.”
- “Real AI footage understanding is complete.”
- “The product is ready for external beta.”
- “Arbitrary long-form or multi-hour editing is ready.”

## Immediate Evidence-Gated Milestones

1. **Completed in source for local/internal testing and the guarded Google/private-API staging handoff:** frontend sign-in/session/route guards, local-test failure boundaries, Google-first OAuth callback construction, safe return handling, hosted-base-path routing, fallback disclosure, provider-error confidentiality, safe API-origin validation, API Gateway Supabase-JWT policy generation, exact gateway/token/user matching, and canonical upload/approval/review client header wiring. A confirmation-gated activation workflow binds exact SHA/revision/secret versions, uploads immutable sanitized gateway evidence only after IAM-private route proof, and rolls back without deletion on failure. The same-SHA Pages workflow derives its gateway origin only from that artifact. Credential-free CI revalidates the exact successful Pages run without tester credentials, while the owner-local headed verifier keeps Google account entry under owner control and requires exact callback, Google identity, protected reload, authenticated `/v1/projects` readback, and sign-out. For a first-login workspace gap, the same-SHA protected provisioning workflow refuses Auth creation/invitation and all writes until Admin readback proves the existing user has Google identity, confirmed email, and a prior sign-in; it accepts only the verifier's email hash as input, reuses compatible profile/owned-workspace state, logs only hashed identifiers, and is followed by a mutation-free readback plus a fresh owner-interactive verifier run. These workflows are not pushed or run, so this is not a live Gmail-session, Supabase, or gateway claim; remote provider/callback configuration, asymmetric-key compatibility, API Gateway/IAM activation, deployment, canonical RLS/two-user evidence, and real browser readback remain gated.
2. **Completed at contract/mock level:** cumulative planning-input resolution, preference provenance, and approval invalidation.
3. **Completed for authenticated local/private identity/workspace scope:** single-host Saved Edit Preference persistence plus server-owned exact-edit initialization and canonical-save synchronization with live membership/role authorization, checksum/atomic storage, compare-and-swap, optimistic revision, deterministic idempotency, strict response parsing, and backend-derived source/frame evidence. Supabase table/RLS, staging, production durability, and collaborative multi-device behavior remain future evidence gates.
4. **Completed for 50 private tool identities:** exact confined operation plus canonical snapshot, funded reservation, lease, one-use dispatch, private artifact, QA, reconciliation, replay, and downstream verification. The complete canonical plan fixture now freezes all 50 required identities from the server proof catalog and validates their exact payloads across 19 runner families before approval, then revalidates both authorities before packaging. One grouped D3-to-ECharts planner node compiles before approval into two atomic jobs with exact dependency, operation, output, budget, evidence, and progress lineage; this is bounded controlled-tool evidence, not arbitrary provider-chain readiness.
5. **Completed for canonical bounded private review, exact ordered three-source standalone continuity composition, maximum eight-source signed-in composition, and exact one-source professional color:** authenticated package orchestration advances dependency-ready jobs, persists exact blockers, reuses completed job evidence, and records content-addressed monotonic package-progress checkpoints behind an atomic latest pointer. The focused three-source graph reaches snapshot validation, approved trims, two caption artifacts, three exact source-bound FFmpeg voice-delivery WAVs, a QA-passed first-source color reference, two independently dependency-bound match artifacts, final composition with ordered color/voice replacement and two approved hard cuts, objective continuity at both boundaries, downstream final-artifact QA, reconciliation, replay, and authenticated private download. The signed-in browser now proves the maximum bounded journey with eight trims, seven captions, eight voices, eight color artifacts, seven hard cuts, 27 completed jobs across bounded approved-attempt graph runs, and an authenticated sixteen-second 4K review. The separate seven-job color graph preserves the one-source regression. Preserve-source composition remains supported under its separate policy. Rich music/SFX/ducking, arbitrary audio processing/reference selection, representative long production media, HDR delivery, distributed execution, and public export remain blocked or unproven.
6. **Completed for bounded canonical review decisions:** one exact assembly/final-artifact-bound decision persists create-only and replay-safe. A structured revision request preserves the approved snapshot and creates no plan, estimate, reservation, render, or execution authority.
7. **Completed for bounded canonical replacement planning:** one exact unconsumed revision handoff publishes plan v2 plus a fresh estimate, while approval, wallet/reservation mutation, jobs, and execution remain blocked.
8. **Completed for synthetic revision approval:** atomic unused-prior release plus new-maximum reservation freezes snapshot v2 and derives jobs with wallet conservation, immutable prior evidence, and replay safety. No customer credit/billing authority exists.
9. **Completed for local/private scope:** project/edit browser and backend tenancy V2, including collision-safe scoped caches, live membership authorization, explicit invalidation, strict response ownership, authorization-before-idempotency, atomic/checksummed storage, and stale-write serialization/CAS. Real mounted Supabase revocation, reviewed RLS, and controlled staging remain blocked.
10. **Completed for bounded revision execution:** snapshot v2 executes through new final composition/QA authority and an accepted second private review without public delivery.
11. **Completed for private history/recovery:** canonical journey state exposes a hash-bound, credential-free authenticated-history descriptor after each persisted review decision, and fresh-service reads use those recovered descriptors to reopen current and superseded review bytes without restoring released execution or credit authority.
12. Expand destructive/negative QA for deployed tenancy, storage, idempotency, credit settlement, privacy retention, and operational recovery.
13. **Completed for authenticated local/private backend scope:** preserve unique incremental source identities and finalized media identity; synchronize current Exact Edit Preferences to server authority; derive source-preparation and frame-confirmation evidence only after source validation; persist that exact state with Preference DNA, Edit Brief, frame, and cleanup as content-addressed handoff authority; revalidate it through internal publication; and freeze its exact binding into plan/snapshot lineage without approval, credit, tool, provider, or render execution side effects.
14. **Completed for authenticated local/private pre-consumption and quiescent post-dispatch scope:** persist an exact-request-owned cancellation-pending fence; terminally revoke/expire issued-but-unconsumed dispatch grants; release/expire active `not_started` or fully adapter-completed leases; preserve consumed dispatch, completed execution, create-only adapter completion, snapshot/job/package, artifact/QA/reconciliation, and internal-cost evidence; atomically cancel the fully unused synthetic reservation with wallet conservation; serialize behind the active work-graph package lock and then against lease claim, dispatch authorization/consumption, and worker execution-fence begin/complete transitions; and deny future active package authority. Active `started` fences and completed fences without adapter-completion evidence fail without mutation; spent-credit settlement/refund and distributed quiescence remain gated.
15. **Backend bridge and recovery complete through one signed-in maximum eight-source accepted review plus exact bounded revision-plan continuation:** bind the browser journey to exact preference synchronization, authenticated planning handoff, content-addressed publication candidate, server-owned plan-presentation coordinator, exact approval coordinator, bounded execution-package request coordinator, bounded private-preparation coordinator, exact private-review media/decision coordinators, revision-plan presentation coordinator, and journey recovery without reviving caller-authored authority. The current signed-in scenario compiles its Edit Brief into the proven source/caption/voice/color graph, invalidates and republishes plan v2 after a meaningful Brief change, atomically creates or replays one immutable snapshot and synthetic private-test reservation, requests the package separately, advances the server-derived 27-work-item/27-job graph through only remaining immutable attempts, assembles and integrity-checks the exact sixteen-second 3840x2160 no-store MP4, verifies all eight source-bound audio identities in approved order, reads sanitized journey state, and persists acceptance. Approval starts no package or execution. The browser receives no raw jobs, tools, artifact identity, commands, paths, credentials, providers, prices, billing, wallet, public-delivery, deployment, or production authority. Plans outside the bounded graph remain gated at publication; rich/structural revision compilation remains a separate milestone.
16. Keep all execution-stage inputs server-derived and re-authorize package ownership/workspace lineage at every runner, QA, artifact, and review transition.
17. Keep tool-cost events backend-authored and tenant-scoped; browser-authored
    usage or billability must never become wallet or settlement authority.
18. Build and attest the production worker images, pin Python dependencies and
    model manifests, then rerun intended-operation tests inside those exact
    images before changing any tool to product-ready.
19. **Completed for local/private failed-attempt recovery:** terminalize started runner exceptions and lease timeouts as immutable failed fences, persist exact adapter failure replay, isolate dependent work while independent branches continue, permit only a fresh-key same-operation retry within the approved attempt ceiling, require reconciliation instead of retry after commit, and treat failed fences as quiescent compensation evidence while preserving failed internal-cost records.
20. **Completed for local/private post-commit adapter recovery:** inspect historical completed fences before any new claim; require exact immutable artifact, passed QA, reconciliation, consumed dispatch, and scoped internal-cost evidence; persist a credential-free create-only recovery record; reconstruct the job-level adapter completion without a new lease, dispatch, runner, artifact, QA, reconciliation, or cost write; and keep incomplete completed attempts blocked as `server_reconciliation_required` instead of retrying them.
21. **Completed for bounded private Remotion transport:** replace whole-media base64 input/output in canonical final composition with an exact server-injected stream manifest, generated container-local paths, independently rehashed source/caption/voice frames, raw MP4 output streaming, pre-commit create-only verification, independent streamed FFprobe QA, and authenticated single-range reads. One canonical professional-color attempt now proves a 19,140,634-byte QA-passed 4K master above the former 16 MiB output ceiling, while a separate 52,766,594-byte UHD runtime/persistence/QA proof establishes the wider transport ceiling outside canonical job lifecycle. Upstream large intermediates, representative duration, materially larger canonical outputs, distributed recovery, public delivery, and production remain gated.
22. **Completed for bounded single-source slice v2:** compile one exact 241–3,840-frame approved cleanup range into two through sixteen balanced technical chunks, freeze exact source/global slice lineage and no-cut continuity into the approved graph, execute a fresh signed-in 660-frame/three-chunk private 4K lifecycle, isolate and recover one retryable chunk without rerunning completed work, merge only QA-passed dependencies, and verify final hash/media plus PCM continuity at both boundaries. Slice-aware voice/color processing, a distributed mezzanine/object finalizer, representative long media, cloud throughput/SLO evidence, and actual 3,840-frame execution remain future gates.
23. **Completed in source with zero-network adapter-path evidence:** construct the canonical Google service-identity verifier only from server-owned mechanism, service-account principal, audience, lifetime, and timeout; accept only one bounded Bearer JWT; reject unsafe key-source headers before lookup; call the supported Google Auth Library path; independently recheck canonical claims; return only the existing process-local token-free identity capability; and fail all request errors generically. The focused smoke stubs the Google method and does not prove a live token, live key/cache rotation, IAM, HTTP receiver, distributed transaction, Cloud Tasks, Cloud Run, deployed workers, or any tool execution.

The legacy backend-local edit-session, Edit Brief, and local-plan routers are now restored only for the explicit local/internal runtime. Their records are authenticated-owner/workspace scoped, and local-plan responses carry a machine-readable `legacy_local_preview_only` authority boundary. This restores the bounded testing seam without satisfying milestone 15 or bypassing the persisted canonical handoff.

## Validation Sources

- `npm run check:frontend-boundary`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- `npm run typecheck:server`
- `npm run smoke:professional-long-form-customer-delivery-mp4-fragment-index`
- `npm run smoke:professional-long-form-customer-delivery-media-source`
- `npm run qa:professional-long-form-customer-delivery-media-source`
- `npm run smoke:canonical-live-google-service-identity-verifier`
- `npm run smoke:offline-remotion-streaming-output`
- `npm run qa:internal-pipeline`
- `npm run prod:beta:summary`
- `npm run prod:e2e:summary`

This matrix must be updated when a capability gains or loses executable evidence.
