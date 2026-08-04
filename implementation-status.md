# Implementation Status

> Current capability notice (2026-07-09): this historical milestone ledger does not by itself describe the strongest executable local/private path or current production blockers. Use `docs/current-end-to-end-capability-matrix.md` for the current evidence-based status. The authenticated private upload-to-review pipeline is executable with FFmpeg/ffprobe test media; external beta, paid production, live billing/providers, and the remaining tool operations remain gated.

## RP-MERGE-AUDIT-00

Status: report-only audit added; implementation merge state is not clean or fully merged.

The active audit path is `/Volumes/backup/REeditpro`, but `/Users/macuser/Developer/REeditpro` also exists as a separate divergent checkout/copy. The current status is `path_divergence_risk`: branches, HEADs, migration counts, dirty counts, and milestone file presence differ. See `docs/repo-merge-integrity-audit.md`, `docs/repo-path-divergence-audit.md`, `docs/repo-milestone-file-presence-audit.md`, and `docs/repo-next-safe-staging-plan.md`.

No staging, commit, cleanup, migration execution, Supabase CLI command, provider/model call, worker, render/export, or credit action is authorized by this audit.

## RP-FIX-06

Status: partially fixed.

The repository now includes a safe auth/profile/workspace bootstrap foundation:

- `src/types/auth-bootstrap.ts`
- `src/backend/auth/auth-client-service.ts`
- `src/backend/auth/profile-bootstrap-service.ts`
- `src/backend/auth/workspace-bootstrap-service.ts`
- `src/backend/auth/auth-bootstrap-orchestrator.ts`
- `src/hooks/useAuthBootstrap.ts`
- `src/components/auth/AuthBootstrapStatusCard.tsx`

The implementation handles missing Supabase env values, signed-out users, profile bootstrap, workspace bootstrap, membership bootstrap, and current workspace context without using service-role credentials in browser code.

## Remaining Blockers

- Backend service-role bootstrap fallback.
- Full auth UI and route/session integration.
- Deployed storage/upload runtime and signed URL delivery.
- Supabase local/staging validation.
- Credit, provider, worker, rendering, Stripe, and mobile implementation.

## RP-FIX-07

Status: partially fixed.

The repository now includes a safe Storage + Upload Pipeline foundation:

- `src/types/upload.ts`
- `src/backend/storage/storage-buckets.ts`
- `src/backend/storage/storage-path-builder.ts`
- `src/backend/storage/upload-validation-service.ts`
- `src/backend/storage/storage-client-service.ts`
- `src/backend/storage/upload-plan-service.ts`
- `src/backend/storage/media-asset-service.ts`
- `src/backend/storage/source-upload-flow-service.ts`
- `src/backend/mock/mock-upload-scenarios.ts`
- `src/backend/orchestrators/mock-upload-orchestrator.ts`
- `supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql`

The implementation validates files, maps upload purposes to active buckets, builds workspace/project paths, creates mock records, preserves source upload order, and safely handles missing Supabase env values. It does not upload files automatically or deploy storage policies.

## RP-FIX-08

Status: partially fixed.

The repository now includes a safe backend API/runtime boundary foundation:

- `src/backend/api/api-runtime-contracts.ts`
- `src/backend/api/api-route-registry.ts`
- `src/backend/api/api-response.ts`
- `src/backend/api/backend-runtime-config.ts`
- `src/backend/api/mock-api-router.ts`
- `src/backend/api/frontend-api-client.ts`
- `src/backend/api/routes/*`

The implementation defines frontend-safe, mock-ready, backend-required, and disabled routes across the major ReeditPro backend domains. The frontend API client defaults to the local mock router, and backend-required routes are blocked instead of calling providers, workers, payment services, service-role database operations, signed storage, or rendering.

It does not deploy a backend, implement live HTTP transport, call provider APIs, call Stripe, start workers, render media, or use backend secrets.

## RP-FIX-09

Status: partially fixed.

The repository now includes a safe credit runtime and approval gate foundation:

- `src/types/credit-runtime.ts`
- `src/backend/services/credit-estimate-runtime-service.ts`
- `src/backend/services/credit-approval-gate-service.ts`
- `src/backend/services/credit-reservation-runtime-service.ts`
- `src/backend/services/credit-ledger-runtime-service.ts`
- `src/backend/services/generation-credit-gate-service.ts`
- `src/backend/mock/mock-credit-runtime-scenarios.ts`
- `src/backend/orchestrators/mock-credit-runtime-orchestrator.ts`

The implementation creates mock estimates, checks approved plan/estimate/reservation gates, creates mock reservations after approval, supports mock spend/release/refund ledger entries, and exposes mock API gate routes for generation, render, music, and SFX.

It does not integrate Stripe, create purchases, deploy backend code, mutate a remote ledger, call provider APIs, start workers, or render media.

## RP-FIX-10

Status: partially fixed.

The repository now includes a safe job runtime and worker queue readiness foundation:

- `src/types/job-runtime.ts`
- `src/backend/services/job-gate-service.ts`
- `src/backend/services/job-queue-runtime-service.ts`
- `src/backend/services/job-dependency-runtime-service.ts`
- `src/backend/services/worker-dispatch-service.ts`
- `src/backend/services/job-event-runtime-service.ts`
- `src/backend/services/job-retry-runtime-service.ts`
- `src/backend/services/job-status-chat-summary-service.ts`
- `src/backend/mock/mock-job-runtime-scenarios.ts`
- `src/backend/orchestrators/mock-job-runtime-orchestrator.ts`

The implementation creates mock queue items, checks worker gates, builds dependency chains, dispatches only local mock workers/placeholders, records job events, models retry/recovery, and creates user-facing status summaries.

It does not deploy Google Cloud, enqueue real workers, call providers, render media, mutate remote Supabase, integrate Stripe, or use service-role credentials.

## RP-FIX-11

Status: partially fixed.

The repository now includes a safe backend runtime transport and worker lease foundation:

- `src/types/backend-runtime.ts`
- `src/types/worker-lease.ts`
- `src/backend/runtime/backend-runtime-envelope-service.ts`
- `src/backend/runtime/backend-runtime-transport-service.ts`
- `src/backend/runtime/worker-lease-service.ts`
- `src/backend/runtime/worker-lease-recovery-service.ts`
- `src/backend/runtime/idempotency-service.ts`
- `src/backend/runtime/worker-runtime-registry.ts`
- `src/backend/mock/mock-backend-runtime-scenarios.ts`
- `src/backend/mock/mock-worker-lease-scenarios.ts`
- `src/backend/orchestrators/mock-backend-runtime-orchestrator.ts`
- `src/backend/orchestrators/mock-worker-lease-orchestrator.ts`
- `supabase/migrations/202605200002_worker_leases_runtime_transport.sql`

The implementation creates mock runtime envelopes, mock transport results, backend/cloud transport placeholders, mock lease claim/heartbeat/renew/release/complete/fail/cancel flows, stale lease recovery, idempotency conflict checks, worker runtime registry metadata, and API route handlers.

It does not deploy Google Cloud, call Pub/Sub, call Supabase Edge Functions, run real workers, call providers, render media, mutate remote Supabase, integrate Stripe, or use service-role credentials.

## RP-FIX-12

Status: partially fixed.

The repository now includes a mock-only production backend runtime scaffold:

- `src/server/server-runtime-config.ts`
- `src/server/server-env.ts`
- `src/server/server-response.ts`
- `src/server/server-router.ts`
- `src/server/server.ts`
- `src/server/index.ts`
- `tsconfig.server.json`
- `vite.server.config.ts`
- `Dockerfile.backend`

Cloud Run API service is selected as the first backend runtime target. The scaffold exposes health, readiness, runtime status, route registry, and mock API transport endpoints without deploying Cloud Run or enabling real backend-required handlers.

It does not deploy Google Cloud, configure Secret Manager, run migrations, call providers, call Stripe, run workers, run FFmpeg/Remotion, render media, mutate remote Supabase, or use service-role credentials.

## RP-FIX-14

Status: partially fixed.

The repository now wires project-level SoundSync SFX into the editing workflow:

- `src/backend/services/edit-project-sfx-integration-service.ts`
- `src/backend/services/edit-project-sfx-status-service.ts`
- `src/backend/orchestrators/edit-project-sfx-orchestrator.ts`
- `src/backend/mock/mock-edit-project-sfx-scenarios.ts`
- `src/components/editor/sfx/ProjectSFXIntegrationPanel.tsx`
- `docs/edit-project-sfx-integration.md`

The implementation connects SFX Director planning, provider routes, prompt plans, credit estimate/approval/reservation gates, mock generation requests, mock SFX jobs, the mock worker skeleton, the mock provider adapter, generated asset metadata, trim/hit alignment, mix plans, QA reports, project asset/library decisions, API mock routes, and editor chat status.

It does not call real Mirelo or MMAudio, add provider keys, deploy Cloud Run, connect to Supabase, upload storage files, spend real credits, call Stripe, process audio, render media, or build mobile screens.

## RP-FIX-15

Status: partially fixed.

The repository now includes readiness reporting for future real Mirelo SFX V1.5 and MMAudio V2 execution:

- `src/backend/services/sfx-provider-readiness-service.ts`
- `src/backend/orchestrators/mock-sfx-provider-readiness-orchestrator.ts`
- `src/backend/mock/mock-sfx-provider-readiness-scenarios.ts`
- `docs/real-sfx-provider-execution-readiness.md`

The implementation reports provider mode, backend/frontend runtime safety, Secret Manager reference readiness, approval/credit/request/job prerequisites, storage/provenance readiness, block reasons, warnings, required backend capabilities, and safe next steps. It also adds `sfx.providerReadiness.check` to the mock route surface.

It does not call real Mirelo or MMAudio, add provider SDKs, add raw keys, resolve Secret Manager values, deploy Cloud Run, connect to Supabase, upload audio, spend credits, call Stripe, process audio, render media, or build mobile screens.

## RP-EDITLEVEL-00

Status: docs/report/smoke audit completed.

The repository now includes a report-only Edit Level surface audit for the future Normal, Premium, and Ultra Premium beta contract:

- `docs/edit-level-existing-surface-audit.md`
- `docs/edit-level-product-contract-audit.md`
- `docs/edit-level-tool-routing-audit.md`
- `docs/edit-level-project-setup-audit.md`
- `docs/edit-level-edit-session-integration-audit.md`
- `docs/edit-level-edit-brief-integration-audit.md`
- `docs/edit-level-edit-preference-dna-audit.md`
- `docs/edit-level-source-video-understanding-audit.md`
- `docs/edit-level-qwen-routing-audit.md`
- `docs/edit-level-qa-credit-render-audit.md`
- `docs/edit-level-reuse-vs-new-build-plan.md`
- `docs/edit-level-implementation-blockers.md`
- `docs/edit-level-beta-decision-register.md`
- `docs/edit-level-milestone-roadmap.md`
- `server/smoke/edit-level-surface-audit-smoke.ts`

The audit documents that the current runtime still uses `basic | pro | premium` and that future Normal/Premium/Ultra Premium mapping remains a product-value and implementation decision. It does not add Edit Level TypeScript runtime types, create routes, create repositories, change UI behavior, run providers/workers, render/export, run migrations, or reserve/spend credits.

## RP-EDITLEVEL-01

Status: docs/status/smoke architecture completed.

The repository now includes the future Edit Level architecture source of truth:

- `docs/edit-level-product-contract.md`
- `docs/edit-level-profile-architecture.md`
- `docs/edit-level-legacy-alias-compatibility.md`
- `docs/edit-level-tool-routing-architecture.md`
- `docs/edit-level-qwen-routing-architecture.md`
- `docs/edit-level-source-video-understanding-policy.md`
- `docs/edit-level-edit-brief-policy.md`
- `docs/edit-level-edit-preference-dna-policy.md`
- `docs/edit-level-qa-profile-architecture.md`
- `docs/edit-level-estimate-budget-architecture.md`
- `docs/edit-level-fallback-degraded-capability-policy.md`
- `docs/edit-level-ui-recommendation-architecture.md`
- `docs/edit-level-backend-service-architecture.md`
- `docs/edit-level-integration-map.md`
- `docs/edit-level-internal-testing-plan.md`
- `docs/edit-level-next-types-fixtures-plan.md`
- `server/smoke/edit-level-architecture-smoke.ts`

The architecture defines the Normal, Premium, and Ultra Premium contract, the future `EditLevelProfile`, legacy basic/pro/premium compatibility, level-aware tool routing, Qwen 3.7 and Qwen2.5-VL policy, source understanding, Edit Brief, Edit Preference/DNA, QA profile, credit estimate only and render budget future metadata, fallback/degraded capability policy, UI recommendation architecture, backend service architecture, and RP-EDITLEVEL-02 as the next implementation prompt.

It remains report-only. No runtime edit-level behavior, TypeScript profile implementation, repositories, API routes, UI behavior, migrations, provider/model calls, media workers, render/export, progress, or credit spend were added.

## RP-EDITLEVEL-02

Status: mock-safe types/profiles/fixtures completed.

The repository now includes the typed foundation for future Edit Level implementation:

- `src/types/edit-level.ts`
- `src/lib/mock-edit-level-profiles.ts`
- `src/lib/edit-level-compatibility-mappers.ts`
- `src/lib/edit-level-profile-mappers.ts`
- `src/lib/edit-level-summary-mappers.ts`
- `src/lib/edit-level-recommendation-fixtures.ts`
- `src/backend/contracts/edit-level-contracts.ts`
- `src/backend/mock/mock-edit-level-scenarios.ts`
- `src/backend/orchestrators/mock-edit-level-orchestrator.ts`
- `server/smoke/edit-level-types-smoke.ts`

It defines canonical `normal | premium | ultra_premium` profile fixtures, legacy `basic | pro | premium` source-aware mapping, Qwen/tool/source/Edit Brief/Edit Preference/QA/estimate/fallback/UI card models, deterministic recommendation fixtures, request/response-only contracts, at least 72 scenarios, and mock orchestrator flows.

It does not change the existing runtime `EditLevel = 'basic' | 'pro' | 'premium'`, add UI behavior, run providers/workers, render/export, run migrations, start progress, or reserve/spend credits. RP-EDITLEVEL-03 has now added the mock-only repository/API/client layer; RP-EDITLEVEL-04 UI Cards + Recommendation is the next default prompt.

## RP-EDITLEVEL-03

Status: complete as a mock-only repository/API/client layer.

The repository now includes a mock Edit Level persistence and transport boundary for future Normal/Premium/Ultra Premium selection:

- shared repository types and side-effect flags;
- MockDatabase collections for profiles, selections, recommendations, readiness, and application logs;
- fixture-backed mock repository operations;
- disabled Supabase repository skeleton;
- mock local planning-domain API route metadata and handlers;
- transport-agnostic browser-safe client helpers plus a separated mock adapter;
- repository, route, and client scenarios/orchestrators;
- docs and smoke scripts for repository, API route, and API client coverage.

It does not change current runtime `basic | pro | premium` behavior, wire UI/planners, create production HTTP routes, run migrations, call Supabase, call providers/models, process media, start workers/progress, render/export, or reserve/spend credits. RP-EDITLEVEL-04 UI Cards + Recommendation is the next default prompt.

## RP-EDITLEVEL-04

Status: complete as visible mock/local UI Cards + Recommendation.

The repository now includes a product-facing Edit Level UI layer:

- browser-safe UI adapter over the RP-EDITLEVEL-03 mock client;
- Normal, Premium, and Ultra Premium card components;
- recommendation banner, selected summary, tool-depth summary, estimate notice, and boundary notice;
- `/projects/new` setup placement;
- existing editor setup card updated through `InlineEditLevelCard` without modifying `ChatNativeEditor`;
- planning context display of the public selected level, while Edit Brief summary stays focused on optional user direction;
- docs, smoke coverage, and a focused Playwright spec.

It does not change current runtime `basic | pro | premium` behavior, live planner/tool routing, Qwen/Qwen2.5-VL runtime behavior, production routes, migrations, Supabase, providers/models, media workers, render/export, progress, or credit spend.

## RP-EDITLEVEL-05

Status: complete as a mock/local Level-Aware Tool Capability Router.

The repository now includes:

- public tool-router types and side-effect flags;
- browser-safe deterministic router rules, UI adapter models, and summaries;
- backend mock registry, routing, readiness, fallback, validation, summary services, contracts, scenarios, and orchestrator;
- visible capability summary/list/fallback components in available Edit Level UI surfaces;
- docs, smoke coverage, and focused Playwright coverage.

It resolves capability packages for Normal, Premium, and Ultra Premium without executing tools or changing runtime `basic | pro | premium` behavior. It does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers/models, media extraction, transcript/Whisper, SoundSync workers, ffmpeg/ffprobe, render/export, progress, Supabase, migrations, or credit reservation/spend. RP-EDITLEVEL-06 Level-Aware Source Video Understanding Routing is the next default prompt.

## RP-EDITLEVEL-06

Status: complete as mock/local Level-Aware Source Video Understanding Routing.

The repository now includes:

- public source-understanding types, side-effect flags, and no-execution constants;
- deterministic source layer definitions and Normal/Premium/Ultra Premium policy packages;
- marker context windows, future Qwen context policy, fallback policy, and source-depth summaries;
- backend mock registry, routing, marker, Qwen, fallback, validation, summary services, contracts, scenarios, and orchestrator;
- visible source-understanding summary/list/marker/fallback UI in available Edit Level surfaces;
- docs, smoke coverage, and focused Playwright coverage.

It resolves source context packages without executing tools or changing runtime `basic | pro | premium` behavior. It does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers/models, media extraction, transcript/Whisper, SoundSync workers, ffmpeg/ffprobe, render/export, progress, Supabase, uploads, external fetches, file-byte reads, migrations, or credit reservation/spend.

## RP-EDITLEVEL-07

Status: complete as mock/local Level-Aware Qwen Planning Profile policy.

The repository now includes:

- public Qwen planning types, side-effect flags, and no-execution constants;
- deterministic Qwen reasoning, planning pass, prompt context, structured output, Marker Chat, Preference DNA, QA explanation, fallback, and estimate-only policies by level;
- browser-safe Qwen planning UI adapter models and summaries;
- backend mock registry, profile, prompt policy, structured output, fallback, usage estimate, validation, summary services, contracts, scenarios, and orchestrator;
- visible Qwen planning summary/dimension/fallback/usage-estimate UI in available Edit Level surfaces;
- docs, smoke coverage, and focused Playwright coverage.

It resolves future Qwen planning profile packages without executing Qwen or changing runtime `basic | pro | premium` behavior. It does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers/models, planners, edit-plan creation, media extraction, transcript/Whisper, SoundSync workers, ffmpeg/ffprobe, render/export, progress, Supabase, uploads, external fetches, file-byte reads, migrations, or credit reservation/spend.

## RP-EDITLEVEL-08

Status: complete as mock/local Level-Aware QA Gates policy.

The repository now includes:

- public QA gate types, side-effect flags, and no-execution constants;
- exactly 30 deterministic QA gate definitions and Normal/Premium/Ultra Premium packages;
- browser-safe QA gate UI adapter models and summaries;
- backend mock registry, routing, readiness, fallback, validation, summary services, contracts, scenarios, and orchestrator;
- visible QA summary/list/readiness/fallback UI in available Edit Level surfaces;
- docs, smoke coverage, and focused Playwright coverage.

It resolves future QA gate packages without executing QA tools or changing runtime `basic | pro | premium` behavior. It does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers/models, planners, edit-plan creation, media extraction, transcript/Whisper, SoundSync workers, ffmpeg/ffprobe, render/export, progress, Supabase, uploads, external fetches, file-byte reads, migrations, or credit reservation/spend. RP-EDITLEVEL-09 completed the estimate-policy follow-up.

## RP-EDITLEVEL-09

Status: complete as mock/local Level-Aware Estimates policy.

The repository now includes:

- public estimate types, 15 deterministic estimate items, side-effect flags, and no-execution constants;
- Normal/Premium/Ultra Premium packages with 20-45, 45-90, and 90-180 minute ranges;
- multiplier-only 1.0x/2.0x/4.0x credit estimate placeholders with `needsProductValue`;
- future render/revision/variant/storage/worker budget metadata;
- browser-safe estimate summaries and UI adapter models;
- backend mock item registry, package, time, credit, render, revision, fallback, validation, summary services, contracts, scenarios, and orchestrator;
- visible estimate summary/item/credit/render/revision/boundary UI in available Edit Level surfaces;
- docs, smoke coverage, and focused Playwright coverage.

It resolves future estimate policy without executing billing or runtime work. It does not reserve credits, spend credits, create credit records, start progress, execute planners, create edit plans, call providers/models, process media, create workers, render/export, run Supabase, add migrations, upload/read file bytes, fetch external URLs, or change runtime `basic | pro | premium` behavior. RP-EDITLEVEL-10 End-to-End Internal Testing + Playwright Coverage is the next default prompt.

## RP-CREDITPOLICY-01

Status: complete as policy/types/docs/constants only.

The repository now includes the external-beta credit policy lock:

- canonical credit value constants for 1 credit = $0.10 and 100 credits = $10;
- product edit-level service fee floors and percentage protection for `normal`, `premium`, and `ultra_premium`;
- helper functions for cent conversion, service fee calculation, final charge calculation, and 60+ minute custom estimate detection;
- policy-only tool-cost metering rate card entries with `serviceFeeIncluded = false`;
- revised estimate, export lock, reservation, and no-silent-recovery billing copy;
- docs and smoke coverage.

It does not add live billing, Stripe, Supabase migrations, wallet mutation, production settlement, provider/model calls, media workers, render/export charging, credit reservation/spend execution, or runtime edit-level migration.

## RP-CREDITDATA-01

Status: mock-safe data/contracts foundation only.

The repository now includes `CreditSettlementRecord`, `CreditRevisionActionRecord`, `EditCreditCostSummary`, read-only settlement preview contracts, validation schemas, mock in-memory idempotency, mock-only credit data routes, and `smoke:credit-data`.

It reuses RP-CREDITPOLICY-01 credit value, service fee math, revised-credit copy, export top-up copy, and tool-cost `serviceFeeIncluded = false` policy. It does not add live billing, Stripe, Supabase migrations, wallet mutation, reservation spend/release/refund, ledger writes, provider/model calls, workers, render/export execution, or export unlock.

## RP-RATECARD-01

Status: mock-safe rate card and cost math hardening only.

The repository now keeps one canonical mock-safe rate card for provider/runtime/deterministic placeholder rates, integer micros/cents/credits conversion, pricing snapshots with `serviceFeeIncluded = false`, actual internal tool cost event math, estimate ranges, and the read-only settlement-preview bridge. `smoke:rate-card` and the `smoke:tool-cost-metering` alias cover this layer.

It does not add live billing, Stripe/payment, Supabase migrations, wallet mutation, reservation spend/release/refund, ledger writes, provider/model calls, workers, render/export execution, production persistence, or export unlock.

## RP-TOOLCOST-01

Status: mock-safe production tool cost coverage only.

The repository now derives one metering profile for each of the 49 production registry tools, exposes `estimateProductionToolCost` and `emitProductionToolCostEvent`, keeps product edit levels separate from runtime compute levels, and attaches cost metadata to existing mock-safe provider, render, and production worker placeholder paths. `smoke:production-tool-cost` covers registry/profile count equality, prerequisite statuses, idempotency, billable vs non-billable aggregation, settlement-preview service-fee separation, and boundary metadata.

It does not add live billing, Stripe/payment, Supabase migrations, wallet mutation, reservation spend/release/refund, ledger writes, provider/model calls, worker execution, render/export execution, production persistence, settlement execution, staging, or package-lock changes.

## RP-ESTIMATE-01

Status: mock-safe edit credit estimate preview only.

The repository now aggregates production tool estimates into user-facing `CreditEstimateRecord` and line-item previews, keeps ReEditPro service/edit fee separate from tool costs, supports idempotent mock-only estimate preview routes, and adds `smoke:credit-estimate`.

It does not approve estimates, reserve/spend/release/refund credits, mutate wallets, write ledgers, call providers/models, run workers, render/export, run Supabase migrations, create live persistence, stage, or change package-lock.
