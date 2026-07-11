# Mock Vs Real Status

> Current capability notice (2026-07-09): use `docs/current-end-to-end-capability-matrix.md` as the evidence-based source for current mock, contract, private-executable, staging, beta, and production states. This older cumulative list understates the authenticated private FFmpeg/ffprobe pipeline and contains historical registry counts; it must not be read as proof that 50 tools or paid production are ready.

## Repository Merge Status

RP-MERGE-AUDIT-00 is report-only. It identifies `path_divergence_risk` between `/Volumes/backup/REeditpro` and `/Users/macuser/Developer/REeditpro`; recent milestone files are split across local paths and many files remain staged, unstaged, or untracked. See `docs/repo-merge-integrity-audit.md` and `docs/repo-next-safe-staging-plan.md` before staging or PR work.

## Real / Implemented

- Frontend-safe Supabase public env detection.
- Lazy browser anon client creation.
- Supabase Auth session/user helpers.
- Auth/profile/workspace bootstrap services that use RLS-limited frontend operations.
- React hook for auth bootstrap state.
- Storage bucket constants using active bucket names.
- Upload validation, path planning, and upload plan helpers.
- Frontend-safe Supabase Storage helper functions that run only when explicitly called.
- Backend API route contracts, route registry, mock router, and frontend API client defaulting to mock mode.
- Credit runtime types, approval gate checks, mock reservations, and mock ledger spend/release/refund skeletons.
- Job runtime types, mock queue items, job gates, dependency chains, dispatch placeholders, events, retry/recovery, and chat summaries.
- Backend runtime and worker lease types, mock runtime envelopes, mock transport, mock lease lifecycle, stale recovery, idempotency helpers, and worker runtime registry metadata.
- Mock-only Node HTTP backend scaffold for future Cloud Run deployment with health, readiness, runtime status, route registry, and mock API transport endpoints.
- Project-level SoundSync SFX workflow wiring in mock mode, including SFX Director planning, provider routes, prompt plans, credit gates, mock generation requests, mock jobs, mock worker runs, mock provider adapter output, trim/hit alignment, mix, QA, project asset decisions, and editor chat status.
- SFX provider execution readiness reporting for future Mirelo SFX V1.5 and MMAudio V2 backend transport, including structured block reasons, Secret Manager reference checks, approval/credit/job checks, and safe next steps.
- RP-EDITLEVEL-00 documentation and smoke coverage for the future Normal/Premium/Ultra Premium edit-level contract and existing Basic/Pro/Premium surface audit.
- RP-EDITLEVEL-01 documentation and smoke coverage for the future Edit Level product contract, profile architecture, legacy basic/pro/premium compatibility, tool/Qwen/source/brief/preference/QA/estimate/fallback/UI/backend architecture, and RP-EDITLEVEL-02 handoff.
- RP-EDITLEVEL-02 mock-safe type contracts, deterministic Normal/Premium/Ultra Premium profile fixtures, source-aware legacy mappers, summary/recommendation fixtures, request/response-only contracts, scenarios, orchestrator, docs, and smoke coverage.
- RP-EDITLEVEL-03 mock-only Edit Level repository, MockDatabase collections, disabled Supabase skeleton, mock local planning-domain API route metadata/handlers, browser-safe client wrapper, scenarios, orchestrators, docs, and smoke coverage.
- RP-EDITLEVEL-04 visible mock/local Edit Level UI cards, deterministic recommendation display, mock selection save/update, selected summaries, estimate-only notices, boundary notices, docs, smoke, and focused Playwright coverage.
- RP-EDITLEVEL-05 mock/local Level-Aware Tool Capability Router with public types, deterministic capability packages, browser-safe summaries, backend mock services/contracts/scenarios/orchestrator, visible capability UI summaries, docs, smoke, and focused Playwright coverage.
- RP-EDITLEVEL-06 mock/local Level-Aware Source Video Understanding Routing with public types, deterministic source context packages, marker/Qwen context policy, browser-safe summaries, backend mock services/contracts/scenarios/orchestrator, visible source-depth UI summaries, docs, smoke, and focused Playwright coverage.
- RP-EDITLEVEL-07 mock/local Level-Aware Qwen Planning Profile with public types, deterministic Qwen reasoning/pass/context/output/fallback/estimate policies, browser-safe summaries, backend mock services/contracts/scenarios/orchestrator, visible Qwen planning UI summaries, docs, smoke, and focused Playwright coverage.
- RP-EDITLEVEL-08 mock/local Level-Aware QA Gates with public types, exactly 30 deterministic QA gates, baseline/premium/ultra strictness packages, browser-safe summaries, backend mock services/contracts/scenarios/orchestrator, visible QA gate UI summaries, docs, smoke, and focused Playwright coverage.
- RP-EDITLEVEL-09 mock/local Level-Aware Estimates with public types, 15 deterministic estimate items, 20-45/45-90/90-180 minute ranges, 1.0x/2.0x/4.0x multiplier-only credit estimates, future render/revision/variant budgets, browser-safe summaries, backend mock services/contracts/scenarios/orchestrator, visible estimate UI summaries, docs, smoke, and focused Playwright coverage.
- RP-CREDITPOLICY-01 policy/types/docs/constants for 1 credit = $0.10, 100 credits = $10, product edit-level service fee floors/percentages, no-silent-recovery billing rules, and policy-only tool-cost metering with `serviceFeeIncluded = false`.
- RP-RATECARD-01 mock-safe rate card and cost math for actual internal tool cost events, integer micros/cents/credits conversion, placeholder provider/runtime/deterministic rates, pricing snapshots with `serviceFeeIncluded = false`, and `smoke:rate-card` / `smoke:tool-cost-metering`.
- RP-TOOLCOST-01 mock-safe production tool cost coverage for all 49 production registry tools, estimate/event adapters, idempotent mock events, and provider/render/worker placeholder metadata with `serviceFeeIncluded = false`.
- RP-ESTIMATE-01 mock-safe edit credit estimate preview records, line items, lower-cost options, top-up summary, idempotent mock routes, and `smoke:credit-estimate`; estimates remain output-only and no credits are reserved or spent.

## Mock / Placeholder

- Mock auth bootstrap flow for local/demo contexts.
- Backend-required warnings for RLS-blocked profile/workspace/member creation.
- Optional auth status card is standalone and not wired into app routes.
- Mock upload scenarios and upload orchestrator.
- Mock media/reference/generated/audio/thumbnail storage metadata records.
- Source upload order flow preserving uploaded order as planning context.
- Backend-required API route placeholders for service-role writes, providers, payment, workers, rendering, admin, and signed storage.
- Mock credit runtime scenarios and orchestrator for allowed/blocked/spend/refund/demo flows.
- Credit policy helpers that calculate mock-safe integer policy values without reserving, spending, settling, or mutating wallets.
- Mock job runtime scenarios and orchestrator for queue, gate, dependency, dispatch, retry, recovery, and status-summary flows.
- Mock backend runtime and worker lease scenarios/orchestrators for envelope transport, lease claim, heartbeat, renew, release, complete, fail, stale recovery, idempotency conflict, and blocked real transport.
- Cloud Run API service plan, local runtime docs, deployment checklist, and backend Dockerfile scaffold.
- Project SFX integration scenarios and chat panel showing Mirelo SFX V1.5, MMAudio V2, internal library, and no-SFX routes.
- SFX provider readiness scenarios covering mock mode, disabled mode, frontend real-mode blocking, missing Secret Manager references, no-SFX routes, missing approval artifacts, and future transport readiness.
- Edit Level future runtime implementation remains disabled: `EditLevelProfile` fixtures and mappers exist, but current planners/UI still use legacy Basic/Pro/Premium runtime values.
- RP-EDITLEVEL-08 QA gates remain mock/local policy only: no QA tool execution, model calls, planner execution, media worker, render/export, Supabase, file-byte read, external fetch, or credit operation occurs.
- RP-EDITLEVEL-09 estimates remain mock/local policy only: no credit reservation, credit spend, credit record, real planner, provider/model call, media worker, progress, render/export, Supabase, file-byte read, external fetch, or runtime edit-level migration occurs.
- RP-CREDITDATA-01 mock settlement/revision/receipt data foundation, including `CreditSettlementRecord`, `CreditRevisionActionRecord`, `EditCreditCostSummary`, read-only settlement preview, validation, mock in-memory idempotency, mock-only routes, and `smoke:credit-data`.
- RP-RATECARD-01 settlement-preview bridge remains mock-only: billable events are summarized from actual internal tool cost, non-billable events are visible as absorbed cost, and ReEditPro service fee is added separately by credit policy math.
- RP-TOOLCOST-01 production tool cost adapters remain mock-only: estimates and events report prerequisite status and internal tool cost metadata, but no provider, worker, render, wallet, reservation, ledger, settlement, or export side effect occurs.
- RP-ESTIMATE-01 edit credit estimate preview remains mock-only: production tool estimates and service-fee math create preview payloads, but no approval, reservation, wallet mutation, ledger write, provider call, worker, render/export, checkout, or export unlock occurs.

## Not Implemented

- Deployed backend runtime or live API transport.
- Deployed Cloud Run service, Secret Manager bindings, service account IAM, request auth, monitoring, and rate limits.
- Service-role backend handlers.
- Full auth screens.
- Real storage uploads and deployed bucket policy validation.
- Production transactional credit ledger runtime.
- Live billing, Stripe checkout/webhooks, credit purchase settlement, export lock enforcement, and production service-fee settlement.
- Production worker queue, leases, heartbeat enforcement, and cloud dispatch.
- Deployed backend runtime transport, transactional worker leases, durable idempotency, and cloud lease recovery.
- Real provider integrations. Mirelo/MMAudio are wired into the project flow in mock mode and have readiness reporting only; live provider transport remains future backend work.
- Rendering/export workers.
- Remote Supabase migration or validation.
- Runtime Normal/Premium/Ultra Premium migration, durable production edit-level persistence, live Qwen 3.7 or Qwen2.5-VL execution, real Edit Preference/DNA resolver, level-aware production Qwen planning execution, level-aware production tool execution, level-aware QA execution, and level-aware worker execution.
- Live credit settlement, Stripe/payment flows, wallet mutation, reservation spend/release/refund, ledger writes, export unlock/lock enforcement, and Supabase-backed credit data persistence.
