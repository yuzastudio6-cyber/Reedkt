# Current End-to-End Capability Matrix

Status date: 2026-07-10
Authority: current checked-out branch and executable evidence in `/Volumes/backup/REeditpro`

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
| Project and named-edit creation | `ui_mock`; private-internal tenancy V2 is verified for the local/private boundary | Browser project flow, project/edit API contracts, authenticated workspace checks, user/workspace-scoped V2 persistence, collision and revocation smokes, stale-write CAS evidence, full Playwright coverage, and the aggregate private pipeline | This remains local/private evidence. Durable multi-user Supabase/RLS staging evidence is not proven. |
| Source upload | `private_executable` for the internal test path | Authenticated upload intent, private source artifact, checksums, source-order lineage | Real-user storage, deployed bucket policy, malware/privacy operations, and signed delivery remain blocked. |
| Edit Brief | `ui_mock` and planning-wired | After Footage Prep, a top-right `Edit Brief` action focuses the single existing inline brief. It reports Optional/Draft/Ready truthfully; opening it is non-mutating, while meaningful changes invalidate stale plan/approval state. | It is not a separate route, drawer, or persistent workspace tab, and it is not yet a complete durable, versioned project source of truth. |
| Edit Preferences | authenticated private-internal persistence; planning provenance is `contract_ready` | The signed-in Preferences flow uses a bounded non-production backend route with live workspace membership/role checks, per-user/workspace storage, checksums, atomic writes, compare-and-swap, and authorization-before-idempotency. Saved defaults flow into named-edit setup and planning-input provenance. | This is single-host local/private persistence only. No Supabase preference table, reviewed RLS, controlled staging, production durability, or per-project override claim is made. |
| Intent compilation and edit planning | `contract_ready`; deterministic mock output | Structured compiler, planning layers, approved snapshots, smoke and browser coverage | Real footage/transcript/model understanding is not executed. |
| Aspect ratio, timing, cleanup, plan, and credit approval gates | `contract_ready`; approval is browser-testable | Frame/timing/cleanup policies, credit estimate, immutable snapshot contracts, approval E2E | Real transcript/timing workers and transactional wallet reservation are not proven. |
| Private render and review | `private_executable` | Generated MP4 source upload through authenticated backend, approved snapshot and credit gate, FFmpeg render, manifest QA, private review | This is an internal/private test runtime, not public export delivery. |
| Revision and recovery | `private_executable` for the private test path | Revision re-render, persisted internal state, recovery, and private download smoke | Generic browser revision/export remains mock outside the gated private path. |
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

### 2026-07-10 executable-evidence audit

| Evidence | Current count | What it proves |
| --- | ---: | --- |
| Production registry | 72 | Named policy/ownership surface only. |
| Launch-core profiles | 24 | Intended first-wave tools, not readiness. |
| Hidden adapter names | 55 | Skill/planner references. |
| Bounded adapter contracts | 50 | Fixed backend contract exists. |
| Registered runner definitions | 50 / 50 | A bounded runner definition exists. |
| Static source-declared | 55 / 72 | Source declares a package, binary, API, or manifest lane. |
| Current-host import/API/binary probe ready | 14 / 50 | Import/API shape or binary presence only. |
| Production-container hydration proven | 0 / 50 | No production image has supplied execution evidence. |
| Intended media operations proven | 3 | FFmpeg, ffprobe, and fixed-template zero-network Playwright capture. |
| Product-ready | 0 / 72 | No registry tool meets production evidence gates. |
| Frontend-executable in practice | 0 | Tool execution stays off the browser. |

The 72-tool partition is: 3 intended-operation proven, 13 package/API-probe
only, 36 adapter-wired but blocked in the current runtime, 11 owner/readiness
lanes without a proven intended operation, and 9 registry-only backlog tools.
The nine backlog tools are `paddleocr`, `mediapipe`, `demucs`, `film`,
`soundtouch`, `rubber_band`, `essentia`, `cesium_js`, and `revideo`.

The current host is missing 29 Python imports, four registered binaries, and
three Node package families (`maplibre`, `@turf/*`, and `@deck.gl/*`). Python
worker requirements are not fully hash-pinned, production images are not built,
and Playwright is currently a dev dependency omitted by production worker
`npm ci --omit=dev`. Those are release blockers, not reasons to relax the
readiness label.

This is strong registry, policy, planning, snapshot, and readiness coverage. It is not proof that 50 tools perform their intended edit operation.

### Actual execution coverage

The private internal pipeline currently proves real media operations with:

- FFmpeg: source preparation, preview creation, overlays, concatenation/final render, transition/color treatment, captions/graphics composition where exercised, and audio loudness treatment.
- ffprobe: source and result metadata and stream validation.
- Playwright, only for the explicitly authorized fixed-template browser-capture fixture: a fixed 640x360 deterministic PNG with JavaScript disabled, all network aborted, no cookies/auth/downloads, and no user-provided URL, HTML, JavaScript, or CSS.

Other bounded adapters currently prove one or more of:

- package/import resolution,
- API-shape checks,
- binary-presence checks,
- readiness evidence,
- private JSON evidence artifacts,
- approved-snapshot lineage,
- render-manifest attachment.

Those adapter results explicitly do **not** prove media processing or product-runtime execution. A package probe must not be labeled as an edited output.

In particular, the legacy `actualToolPackageExecuted` evidence name can be true
for an import/API-shape or binary-presence probe. It must not be presented as an
intended edit operation. Likewise, `ready_for_render_preview` is not sufficient
when `mediaTransformOutputCount` is zero. Promotion must require operation-typed
output evidence and QA, not only package hydration.

Metadata currently needs reconciliation before release: architecture truth says
zero frontend-executable tools while one runtime-policy path still permits
Hyperframe; cost metadata marks 24 tools as externally beta-eligible while
runtime policy permits a broader set, even though executable readiness remains
0 / 72. The strictest evidence result wins until those surfaces are unified.

For every approved private run, evidence is accepted only when the operation, manifest fingerprint, snapshot, reservation, artifact identity, checksum, byte size, and duration/probe facts match. Final-delivery and private-download records carry all four core operation kinds; future/degraded operations carry no actual-work evidence.

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

The normal approved manifest has exactly four executable operation kinds:

1. FFmpeg private source processing.
2. ffprobe processed-media QA.
3. FFmpeg private final render.
4. ffprobe final-delivery QA.

An authorized fixed-template capture fixture may add exactly one conditional fifth operation: private Playwright capture. Promotion requires the approved `browser_capture_chain`, an exact source/template/settings allowlist, an unambiguous user-request authorization token, nonblocked linked work items, and server-owned approved-snapshot attestation. The backend reloads and rechecks that snapshot before capture; client-injected executable-looking snapshots fail closed. The PNG is signature, dimension, size, checksum, and deterministic-rerender verified, then re-read and re-hashed immediately before FFmpeg composition. Private local paths are stripped recursively from browser DTOs. The operation is nonbillable and creates no wallet, service-fee, or settlement event.

All other approved tool and adapter entries remain `degraded_planning_only`. They cannot claim media processing, production execution, or product readiness. Additional tool families should only graduate after they produce and verify their intended output through the same manifest/evidence contract.

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

`npm run qa:internal-pipeline` is the first-class internal proof command. It runs:

1. the auth runtime boundary smoke,
2. the approved tool-work manifest and real-media evidence smoke,
3. the conditionally authorized private fixed-template Playwright capture smoke,
4. the private internal edit upload-to-download E2E smoke,
5. the browser-to-backend full-stack private review smoke.

The proven path includes:

- generated MP4 test media,
- authenticated backend intent,
- private upload and source-order/checksum lineage,
- approved snapshot and credit-gate metadata,
- conditionally authorized, server-attested, zero-network/zero-JavaScript fixed-template PNG capture and FFmpeg composition evidence,
- private FFmpeg render,
- decision and artifact manifests,
- QA and review acceptance,
- revision re-render,
- server persistence/recovery,
- private download.

The same command does not prove live provider execution, real-user storage, public export, or paid production.

## Release State

| Release target | Current state | Reason |
| --- | --- | --- |
| Local browser/UI testing | available | Mock-safe browser flows and Playwright coverage exist. |
| Authenticated private internal pipeline | available | Explicit internal command and generated private media evidence pass. |
| Controlled staging with real users | blocked | Supabase/RLS, deployed workers/storage, identity/tenancy, privacy, and operational evidence remain. |
| External beta | blocked | Production readiness scenarios intentionally fail closed. |
| Paid production | blocked | Billing, settlement, real providers/tools, public delivery, security, and operations remain incomplete. |

## Truthful Product Language

Safe current description:

> ReeditPro has a complete deterministic planning surface and an authenticated private internal upload-to-review pipeline. Its tool architecture is registry-complete, planner-wired, snapshot-carried, backend-gated, and runner-probed; real private media execution is proven with FFmpeg and ffprobe, with one narrowly authorized fixed-template Playwright capture path under server-owned snapshot attestation. External beta, public delivery, live billing, Supabase/RLS tenancy, and the remaining tool operations are still gated.

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
4. **Completed for the proven private tools:** canonical approved tool-work manifest, FFmpeg/ffprobe operation evidence, and the conditionally authorized fixed-template Playwright capture slice.
5. **Completed for internal testing:** signed-in browser project journey through authenticated private upload, review, revision, download, and recovery.
6. **Completed for local/private scope:** project/edit browser and backend tenancy V2, including collision-safe scoped caches, live membership authorization, explicit invalidation, strict response ownership, authorization-before-idempotency, atomic/checksummed storage, and stale-write serialization/CAS. Real mounted Supabase revocation, reviewed RLS, and controlled staging remain blocked.
7. Expand destructive/negative QA for deployed tenancy, storage, idempotency, credit settlement, privacy retention, and operational recovery.
8. Graduate additional tool families only after each produces real output and QA evidence through the approved manifest contract.
9. Replace caller-supplied source-truth/model evidence with authoritative
   server lookup, and re-authorize package ownership/workspace lineage at every
   runner, QA, and artifact-integration transition.
10. Keep tool-cost events backend-authored and tenant-scoped; browser-authored
    usage or billability must never become wallet or settlement authority.
11. Build and attest the production worker images, pin Python dependencies and
    model manifests, then rerun intended-operation tests inside those exact
    images before changing any tool to product-ready.

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
