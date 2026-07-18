# Backend Readiness Gap Report

## Updated Gap Status

| Gap | Status | Notes |
| --- | --- | --- |
| Auth/profile/workspace bootstrap missing | Partially fixed | Google-first Supabase OAuth handoff, exact same-origin/base-path callback construction, protected-route recovery, email/password fallback, and local browser regression evidence now exist. The browser-to-private-Cloud-Run source contract adds safe API-origin validation, Google API Gateway JWT validation, a dedicated original-token revalidation header, exact gateway/token/Supabase-user matching, and noncredentialed exact-origin CORS. A confirmation-gated, rollback-aware staging activation workflow proves exact source/revision/secret-version inputs, asymmetric JWKS preflight, keyless gateway identity, exclusive service-level invocation, immutable image/config evidence, and route probes. Only after strict readiness can it upload a sanitized attempt-specific activation artifact. The Pages workflow accepts only the same successful run/SHA, validates that artifact, derives the exact gateway origin from it, locally verifies the compiled `/Reedkt/` sign-in surface, deploys, and rechecks the hosted route. A credential-free same-SHA CI lane then verifies the exact successful Pages run and Google-first surface without accepting a tester password or creating a session. The owner-local headed verifier clicks only ReEditPro's Google action and requires exact callback, expected identity, protected reload, authenticated private-gateway `/v1/projects` readback, sign-out, and post-sign-out route denial without exporting credentials, tokens, browser storage, traces, screenshots, or video. None of these workflows has been pushed or dispatched. A read-only 2026-07-17 check still finds the hosted app stale, the Cloud Run API private, and API Gateway disabled. Google provider/callback allowlists, live asymmetric signing-key compatibility, real Gmail session, gateway/IAM deployment, canonical RLS-backed profile/workspace provisioning, and two-user staging readback remain unproven. Backend/admin fallback is still needed for RLS-blocked creation. |
| Backend runtime missing | Partially fixed | API route contracts, registry, mock router, frontend client, IAM-private Cloud Run target, fail-closed Google API Gateway browser transport/OpenAPI source, sanitized live readiness verifier, and a protected staging activation workflow exist. The current Cloud Run service is not a proven reviewed gateway revision, API Gateway remains disabled, the activation workflow has not run, and no signed-in browser-to-staging route has passed. |
| Storage/upload runtime missing | Partially fixed | Upload validation, bucket mapping, path planning, mock metadata, source order flows, and local policy readiness exist. Real uploads still need deployed buckets/RLS and likely signed backend routes. |
| Dormant legacy Edit Brief local-upload harness | Blocked by owned UI reintegration | A direct adversarial run proved the old harness expects the retired `/projects/:projectId/edits/:editSessionId/brief` route and an obsolete public-health payload. The current app intentionally mounts the named edit at `/projects/:projectId/edits/:editSessionId`; `ProjectEditBriefWorkspace` is not mounted there. Reconnecting or replacing that surface would touch `src/App.tsx`, `ProjectEditBriefWorkspace`, and Edit Brief integration tests, which remain owned by the coordinated Edit Preferences/Edit Reference task. No competing route was added. The canonical private-workspace/maximum-eight-source pipeline remains the current local backend evidence instead. |
| Credit runtime missing | Partially fixed | Mock-safe estimates, approval gates, reservations, spend/release/refund skeletons, generation/render/provider gate checks, and RP-CREDITPOLICY-01 policy constants exist. Real transactional ledger execution, live billing, Stripe, settlement, and export lock enforcement remain backend-required. |
| Worker/job queue runtime missing | Partially fixed | The canonical private package queue is checksum-protected and restart-readable. Its server-selected claim plus outbox insert, accepted-worker completion, accepted-worker pre-commit failure, and accepted-worker lease timeout each use cooperative cross-process same-host write-ahead commits with real process-exit recovery and exact replay. Completion, failure, and timeout are mutually exclusive. An expired accepted worker fences every later Cloud-dispatch attempt until the same accepted controller principal atomically reconciles timeout; retry/exhaustion is derived from the immutable attempt ceiling and never starts automatically. Timeout reconciliation loads the exact persisted failed-attempt cost record under the package lock and rejects caller-supplied hashes; missing, tampered, or attempt-mismatched records fail closed without mutation. Terminal receipts exclude customer price/credits/service fee/wallet/billing authority. A durable attempt-start/cost binding and controller timeout finalizer, distributed database transaction, deployed worker-death/heartbeat observer, live Cloud Tasks/Cloud Run dispatch and terminal callbacks, worker execution, and production operations remain open. |
| Private Docker execution transport | Privately verified | All server-side private Docker subprocesses now use a shared credential-isolated CLI boundary with a fresh intentionally absent Docker config, no inherited Docker host/context, direct reviewed local Buildx for image builds, local image loading, and fail-closed push/remote-output/secret/SSH/builder overrides. The focused browser-graphics execution smoke and the full v13 `32/32` internal pipeline passed. This is local/private evidence only; Artifact Registry, Google IAM, cloud build/worker execution, deployment, and production authority remain open. |
| Backend runtime transport and worker leasing missing | Partially fixed | Mock runtime envelopes, transport placeholders, lease claim/heartbeat/renew/release/complete/fail/cancel, stale recovery, idempotency helpers, route handlers, and a local lease migration exist. Real backend/cloud lease enforcement remains open. |
| Production backend runtime not chosen or scaffolded | Partially fixed | Cloud Run API service is selected and a mock-only Node HTTP scaffold exists with health/readiness/runtime/routes/mock endpoints. No deployment, Secret Manager, service-role handlers, providers, Stripe, workers, or render execution exists. |
| Provider integrations missing | Partially reduced | Project SFX now reaches mock Mirelo/MMAudio/internal-library routing and includes readiness reporting for future real SFX transport. Real AI, Lyria, Mirelo, MMAudio, Stripe, and rendering calls are still not added. |
| Edit Level runtime architecture missing | Evidence-gated mock router layers added | RP-EDITLEVEL-02 adds type contracts and deterministic fixtures; RP-EDITLEVEL-03 adds mock repository/API/client; RP-EDITLEVEL-04 adds visible mock/local UI cards and recommendation; RP-EDITLEVEL-05 adds mock/local level-aware tool capability routing; RP-EDITLEVEL-06 adds mock/local source video understanding routing; RP-EDITLEVEL-07 adds mock/local Qwen planning profile policy; RP-EDITLEVEL-08 adds mock/local QA gate policy; RP-EDITLEVEL-09 adds mock/local estimate policy. Runtime migration, production persistence, workers, and real execution now graduate through explicit Edit Level production readiness evidence gates rather than a permanent blanket block. |
| Supabase production validation missing | Open | No remote migration, local Supabase test, staging test, or advisor review was run. |

## RP-FIX-06 Result

The auth bootstrap foundation is safe to import in the frontend and safe when Supabase env values are missing. It is not a production backend.

## RP-FIX-07 Result

The storage/upload foundation is safe to import and mock-friendly. It does not upload files automatically, deploy storage policies, or create production delivery URLs.

## RP-FIX-08 Result

The backend API boundary foundation is safe and mock-friendly. It defines route contracts and blocks backend-required routes, but it does not deploy a backend or implement real provider, payment, render, worker, signed storage, or service-role behavior.

## RP-FIX-09 Result

The credit runtime foundation is safe and mock-friendly. It defines the approval/reservation gate before expensive work and can demonstrate allowed/blocked/spend/refund flows locally. It does not implement Stripe, production purchases, transactional backend ledger mutation, provider calls, worker execution, or rendering.

## RP-CREDITPOLICY-01 Result

Credit policy is now locked for external beta as policy/types/docs/constants only. The repo documents and exports 1 credit = $0.10, 100 credits = $10, product edit-level service fee floors and percentages, no-silent-recovery overage rules, revised estimate/export-lock copy, and tool-owner cost metering with `serviceFeeIncluded = false`.

This adds no live billing, no Stripe, no Supabase migration, no wallet mutation, no provider call, no render/export charging, no reservation/spend execution, and no production settlement.

## RP-FIX-10 Result

The job runtime foundation is safe and mock-friendly. It defines queue readiness, dependency chains, worker dispatch placeholders, job events, retry/recovery, chat summaries, and API mock handlers. It does not deploy a backend queue, start Cloud Run workers, call providers, render media, mutate remote Supabase, or use service-role credentials.

## RP-FIX-11 Result

The backend runtime transport and worker lease foundation is safe and mock-friendly. It defines runtime envelopes, mock transport, backend/cloud transport placeholders, mock lease lifecycle, stale lease recovery, idempotency helpers, a worker runtime registry, mock scenarios, mock orchestrators, route handlers, and a local-only migration for future lease tables. It does not deploy Cloud Run, call Pub/Sub, call Supabase Edge Functions, mutate remote Supabase, call providers, render media, integrate Stripe, or use service-role credentials.

## RP-FIX-12 Result

The first backend runtime target is selected and scaffolded. A mock-only Node HTTP server can expose health, readiness, runtime status, route registry, and mock API transport endpoints for a future Cloud Run API service. It does not deploy Cloud Run, configure Secret Manager, run migrations, call providers, call Stripe, run workers, render media, mutate remote Supabase, or use service-role credentials.

## RP-FIX-14 Result

Project SFX integration is partially fixed. The repo now wires SFX Director planning, provider routing, prompt planning, credit estimate/approval/reservation gates, mock generation requests, mock job queue items, the SFX worker skeleton, mock Mirelo/MMAudio/internal-library adapter output, trim/hit alignment, mix planning, QA, project asset decisions, and chat status into one project editing flow.

Real Mirelo/MMAudio execution remains disabled. Provider keys, Secret Manager, Cloud Run worker execution, remote Supabase writes, storage uploads, real audio files, Stripe, and rendering remain future backend work.

## RP-FIX-15 Result

Real SFX provider execution readiness is partially fixed. The repo now has a backend-only readiness service, readiness scenarios, a mock readiness orchestrator, and the `sfx.providerReadiness.check` route. The readiness output explains runtime blocks, provider mode, missing Secret Manager reference names, approval/credit/request/job gaps, source-footage approval requirements, storage/provenance requirements, warnings, and safe next steps.

This is readiness-only. Real Mirelo/MMAudio transport, Secret Manager value resolution, Cloud Run workers, Supabase writes, storage uploads, real audio generation, Stripe, and rendering remain future backend work.

## RP-EDITLEVEL-00 Result

Edit Level beta planning is audited only. The repo still uses the existing `basic | pro | premium` runtime values, while the audit documents the future Normal/Premium/Ultra Premium product contract, missing legacy docs, reuse/new-build decisions, Qwen 3.7 and Qwen2.5-VL routing expectations, and blocker/product-value decisions. No runtime implementation, backend route, migration, provider call, worker, render/export, or credit operation was added.

## RP-EDITLEVEL-01 Result

Edit Level beta architecture is documented only. The repo now has a product contract, future `EditLevelProfile` architecture, legacy basic/pro/premium compatibility, level-aware Qwen/tool/source/Edit Brief/Edit Preference/QA/estimate/fallback/UI/backend architecture, integration map, internal testing plan, and RP-EDITLEVEL-02 next types/fixtures plan. No runtime type implementation, repository, API route, UI behavior, migration, provider/model call, media worker, render/export, progress, or credit operation was added.

## RP-EDITLEVEL-07 Result

Level-aware Qwen planning profile policy is mock/local only. The repo now has typed Qwen planning dimensions, deterministic Normal/Premium/Ultra Premium packages, browser-safe summaries, backend mock services/contracts/scenarios/orchestrator, visible Qwen planning UI summaries, docs, smoke, and focused Playwright coverage.

This adds no Qwen call, no Qwen2.5-VL call, no DeepSeek call, no provider call, no real planner execution, no edit plan creation, no worker, no render/export, no Supabase migration or read/write, no file-byte read, no external fetch, and no credit reservation/spend.

## RP-EDITLEVEL-08 Result

Level-aware QA gate policy is mock/local only. The repo now has public QA gate types, exactly 30 deterministic gates, Normal/Premium/Ultra Premium strictness packages, browser-safe summaries, backend mock services/contracts/scenarios/orchestrator, visible QA gate UI summaries, docs, smoke, and focused Playwright coverage.

This adds no QA tool execution, no Qwen call, no Qwen2.5-VL call, no DeepSeek call, no provider call, no real planner execution, no edit plan creation, no media worker, no render/export, no Supabase migration or read/write, no file-byte read, no external fetch, and no credit reservation/spend.

## RP-EDITLEVEL-09 Result

Level-aware estimate policy is mock/local only. The repo now has public estimate types, exactly 15 deterministic estimate items, Normal/Premium/Ultra Premium time ranges, multiplier-only credit estimate placeholders, future render/revision/variant budgets, degraded capability notices, browser-safe summaries, backend mock services/contracts/scenarios/orchestrator, visible estimate UI summaries, docs, smoke, and focused Playwright coverage.

This adds no credit reservation, no credit spend, no credit record, no real planner execution, no edit plan creation, no provider/model call, no media worker, no progress, no render/export, no Supabase migration or read/write, no file-byte read, and no external fetch.

## RP-EDITLEVEL-02 Result

Edit Level beta type/profile fixtures are mock-safe only. The repo now has `EditLevelProfile` types, Normal/Premium/Ultra Premium fixtures, source-aware legacy basic/pro/premium compatibility mappers, summary and recommendation fixtures, request/response-only contracts, mock scenarios, an orchestrator, docs, and smoke coverage. No runtime behavior, repository, API route, UI behavior, migration, Supabase command, provider/model call, media worker, render/export, progress, or credit operation was added.

## RP-EDITLEVEL-03 Result

Edit Level beta repository/API/client access is mock-safe only. The repo now has repository types, MockDatabase collections, fixture-backed mock repository operations, a disabled Supabase skeleton, mock local planning-domain API route metadata/handlers, browser-safe client helpers, scenarios, orchestrators, docs, and smoke coverage. No runtime migration, visible UI behavior, production route, Supabase read/write, migration, provider/model call, media worker, render/export, progress, or credit operation was added.

## RP-EDITLEVEL-04 Result

Edit Level beta UI is visible but mock/local only. The repo now has Normal/Premium/Ultra Premium cards, deterministic recommendation display, mock selection save/update, selected summaries, estimate-only notices, boundary notices, docs, smoke coverage, and focused Playwright coverage. No runtime migration, live planner/tool routing, production route, Supabase read/write, migration, provider/model call, media worker, render/export, progress, or credit operation was added.

## RP-EDITLEVEL-05 Result

Edit Level beta tool capability routing is mock/local only. The repo now has public router types, deterministic capability packages, browser-safe summaries, backend mock services/contracts/scenarios/orchestrator, visible capability UI summaries, docs, smoke coverage, and focused Playwright coverage. No runtime migration, production route, Supabase read/write, migration, provider/model call, media worker, render/export, progress, or credit operation was added.

## RP-EDITLEVEL-06 Result

Edit Level beta source video understanding routing is mock/local only. The repo now has public source-understanding types, deterministic source context packages, marker context windows, future Qwen context policy, fallbacks, browser-safe summaries, backend mock services/contracts/scenarios/orchestrator, visible source-depth UI summaries, docs, smoke coverage, and focused Playwright coverage. No runtime migration, production route, Supabase read/write, migration, provider/model call, transcript/media/audio/graphic worker, render/export, progress, upload, external fetch, file-byte read, or credit operation was added.
