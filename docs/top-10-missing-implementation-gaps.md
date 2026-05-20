# Top 10 Missing Implementation Gaps

## 1. Supabase tables are not deployed or verified

Priority: critical

Why it matters: the app cannot become a real backend-backed product until the schema exists in the correct `reeditpro` project.

Evidence: `supabase/deployment-status.md` is `blocked`; `supabase --version` is unavailable; RP-FIX-03 added readiness docs; RP-FIX-04 reran the deploy gate and still did not run remote migration history, dry-run, backup, push, table verification, or type generation.

What is missing: CLI availability, exact `reeditpro` project confirmation, migration-chain validation, dry-run, schema backup, remote migration push, remote table verification.

What breaks if ignored: every real backend feature remains mock-only.

Fix milestone name: `RP-SUPABASE-FIX-01 — Install CLI, Confirm ReeditPro Project, Dry-Run, Deploy, Verify`

Suggested Codex prompt title: `RP-SUPABASE-FIX-01 - Install Supabase CLI, Confirm ReeditPro Project, Dry-Run, Deploy, Verify`

## 2. Generated Supabase database types are missing

Priority: high

Why it matters: backend and frontend code cannot safely type real table reads/writes.

Evidence: `src/backend/supabase/generated-database.types.ts` is missing; `database.types.ts` is a placeholder; `docs/generated-database-types-plan.md` documents future generation commands.

What is missing: generated types from a validated local database or confirmed linked `reeditpro` project.

What breaks if ignored: API/runtime work will drift from the actual schema.

Fix milestone name: `RP-SUPABASE-FIX-02 — Generate And Wire Database Types`

Suggested Codex prompt title: `RP-SUPABASE-FIX-02 — Generate Supabase Types After Verified Deployment`

## 3. Supabase client exists but real app persistence is not wired

Priority: high

Why it matters: the app now has a frontend-safe Supabase client factory, but product flows still do not read or write real Supabase data.

Evidence: RP-FIX-05 added `@supabase/supabase-js`, `supabase-config.ts`, and a safe `getSupabaseClient()` that returns a typed client or `null`. Generated database types are still missing and app flows remain mock/local.

What is missing: generated database types, auth/session bootstrap, persistence adapters, route/data wiring, and deployed/verified Supabase tables.

What breaks if ignored: auth, project loading, upload metadata, and approvals remain mock even when public Supabase env values are present.

Fix milestone name: `RP-SUPABASE-FIX-03 - Wire Supabase Client Into Auth And Persistence`

Suggested Codex prompt title: `RP-SUPABASE-FIX-03 - Wire Frontend-Safe Supabase Client After Deployment And Types`

## 4. Backend API/runtime boundary is missing

Priority: high

Why it matters: mock services exist, but there is no server/runtime layer that can safely own service-role access, credit mutations, worker orchestration, or provider calls.

Evidence: backend services are local TypeScript modules; `src/backend/supabase/supabase-admin-placeholder.ts` still throws by design; `docs/backend-runtime-boundary.md` documents the boundary but does not implement the runtime.

What is missing: secure API route/server runtime, request validation, auth context, real service-role isolation, and persistence adapters.

What breaks if ignored: real user operations would require unsafe frontend access or remain impossible.

Fix milestone name: `RP-BACKEND-FIX-01 — Backend API Runtime Boundary`

Suggested Codex prompt title: `RP-BACKEND-FIX-01 - Create Backend API Runtime Boundary For Supabase Service Access`

## 5. Auth, profile bootstrap, and workspace membership are not wired

Priority: high

Why it matters: RLS policies depend on auth/workspace context, but the app has no real auth bootstrap.

Evidence: migrations define auth-dependent tables and policies; routes have no auth guard; frontend uses mock data.

What is missing: sign-in/session bootstrap, profile creation, workspace membership provisioning, and user-scoped project loading.

What breaks if ignored: deployed tables would still be hard to use safely.

Fix milestone name: `RP-AUTH-FIX-01 — Auth And Profile Bootstrap`

Suggested Codex prompt title: `RP-AUTH-FIX-01 - Add Auth/Profile Bootstrap Plan And Mock-To-Real Boundary`

## 6. Storage/upload pipeline is schema-only

Priority: high

Why it matters: ReeditPro starts with uploaded media, but uploads are still mock.

Evidence: storage bucket/policy migration exists; upload UI remains mock; no real upload service is implemented.

What is missing: storage bucket verification, signed upload flow, media asset creation, source sequence persistence, thumbnail/transcode placeholders.

What breaks if ignored: real source media cannot enter the product.

Fix milestone name: `RP-STORAGE-FIX-01 — Storage Bucket And Upload Pipeline Readiness`

Suggested Codex prompt title: `RP-STORAGE-FIX-01 - Wire Supabase Storage Upload Metadata Safely`

## 7. Overlapping migration chains need validation before deployment

Priority: high

Why it matters: RP-FIX-02 fixed the stale migration order docs, but the actual SQL still contains overlapping `20260513` and `20260518` schema chains.

Evidence: `supabase/migration-audit.md` documents duplicate table names including `projects`, `workspaces`, `media_assets`, `edit_plan_segments`, `credit_estimates`, `generation_requests`, `generated_assets`, `qa_reports`, and `revision_requests`.

What is missing: local Supabase validation, disposable staging validation, or schema reconciliation proving that the full 18-file chain applies cleanly.

What breaks if ignored: `supabase db push` may fail mid-chain or create an unintended hybrid schema.

Fix milestone name: `RP-SUPABASE-FIX-00 - Validate Or Reconcile Overlapping Migration Chains Before Supabase Deploy`

Suggested Codex prompt title: `RP-SUPABASE-FIX-00 - Validate Or Reconcile The 20260513 And 20260518 Migration Chains`

## 8. Backend export smoke tests are still missing after RP-FIX-01

Priority: low

Why it matters: RP-FIX-01 now exposes the latest implemented backend modules, but future changes could regress the barrel without import-level smoke coverage.

Evidence: `src/backend/index.ts` now exports existing contracts, mock data, scenarios, namespace service modules, orchestrators, workers, providers, cloud, and Supabase placeholders. `src/backend/workers/index.ts` now exports render worker contracts and the mock render worker skeleton.

What is missing: lightweight import smoke tests for the backend barrel and documentation-only tracking for expected files that do not exist.

What breaks if ignored: future backend/API/runtime work could remove an export accidentally and only discover it late.

Fix milestone name: `RP-FIX-06 - Backend Barrel Import Smoke Tests`

Suggested Codex prompt title: `RP-FIX-06 - Add Backend Barrel Import Smoke Tests`

## 9. Real provider and worker execution remains mock-only

Priority: medium

Why it matters: Lyria, Mirelo, MMAudio, AI generation, SFX workers, and render workers cannot execute real jobs yet.

Evidence: provider adapters use mock clients or real-client placeholders; worker validation enforces mock-only.

What is missing: secure worker runtime, Secret Manager integration, provider credentials, approval/credit gates, storage outputs, retry/idempotency, and QA ingestion.

What breaks if ignored: premium features cannot produce real generated media.

Fix milestone name: `RP-WORKER-FIX-01 — Worker Queue And Provider Runtime Readiness`

Suggested Codex prompt title: `RP-WORKER-FIX-01 - Prepare Worker Runtime Boundary Without Real Provider Calls`

## 10. Legacy status docs are missing

Priority: medium

Why it matters: stakeholders lack a single older status trail for what is real, mock, deployed, or missing.

Evidence: missing `repo-audit.md`, `implementation-status.md`, `mock-vs-real-status.md`, `docs/next-implementation-plan.md`, and `docs/missing-systems-and-risks.md`.

What is missing: status consolidation or replacement references to the new audit docs.

What breaks if ignored: future prompts may repeat work or overstate readiness.

Fix milestone name: `RP-DOCS-FIX-01 — Consolidate Implementation Status Docs`

Suggested Codex prompt title: `RP-DOCS-FIX-01 - Create Current Implementation Status Index`
