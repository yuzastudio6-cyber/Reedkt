# Project Edit Brief Internal Testing Entrypoint

## Decision

`project_edit_brief_internal_testing_entrypoint_passed_ready_for_repeated_internal_testing`

## Summary

RP-EDITBRIEF-23 adds the missing `/internal-testing` app route as a production-shaped mock/internal testing console. The route uses the existing `internalTestingScenarios` registry, links to the Project Home, Edit Chat, Edit Brief, and source-video Brief test paths, summarizes scenario readiness, and records browser-local feedback that can be exported as JSON for follow-up PRs.

This is not a shortcut or throwaway testing surface. It keeps the same project/session and route seams that later release work can graduate through evidence, owner approval, persistence, and runtime gates.

## Connected Routes

- `/internal-testing`
- `/sign-in?redirect=%2Fprojects%2Fmock-project-edit-chat-foundation%2Fedits%2Fedit-session-youtube-wide%2Fbrief`
- `/projects/mock-project-edit-chat-foundation`
- `/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/chat`
- `/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief`
- `/edit-preferences`

## Preference Video Limits Closeout

The formerly blocked `preference-video-mock-only-limits` scenario is now classified as `mock_local` because the internal testing route exposes an explicit Preference Video limits panel and `/edit-preferences` is mounted as a browser-safe mock/local preference library.

This closeout only proves that internal testers can see and verify the boundaries. It does not authorize reference upload, URL fetch, real media analysis, Qwen/DeepSeek/provider calls, workers, render/export, credit movement, Supabase persistence, external beta, paid production, or product-ready behavior.

## Source Video Testing Path

The internal testing route now exposes a first-class signed source-video test path that sends testers through `/sign-in` and returns them to the Edit Brief source video picker. Browser-local source video preview, playback timeline sync, source-time marker creation, local metadata capture, export setting recommendations from browser metadata, Qwen 3.7 Max Marker Chat readiness labels, and visual-context fallback checks are allowed for repeated internal testing.

Backend-local source video upload is a separate internal gate. The upload control is shown only when `VITE_REEDITPRO_API_BASE_URL` is configured and `VITE_REEDITPRO_SOURCE_VIDEO_BACKEND_UPLOAD=true`; it records canonical source-video metadata for backend-local testing only. It does not authorize FFmpeg/FFprobe, providers, workers, render/export, credit movement, external beta, paid production, or product-ready behavior.

When the local runner sets `VITE_REEDITPRO_INTERNAL_TEST_AUTH=true`, the source-video panel links to `/sign-in?redirect=%2Fprojects%2Fmock-project-edit-chat-foundation%2Fedits%2Fedit-session-youtube-wide%2Fbrief`. That route creates a browser-local mock auth session, returns to Brief, then allows backend-local upload and `Run local edit preview` to produce preview-only evidence after mock approval/reservation and approved-snapshot gates. This is internal testing only and does not contact Supabase Auth.

## Approval And Credit Gate Readiness

The `approval-credit-gate-readiness` scenario is classified as `mock_local` because the internal testing route now exposes the approved snapshot and credit gate contract directly. Internal testers can verify that future expensive work must carry `approvedPlanSnapshotId`, `creditEstimateId`, and `creditReservationId` before backend workers, providers, render/export, or tool execution can proceed.

This readiness panel is evidence for repeated local testing only. It does not authorize credit spend, ledger writes, Stripe, provider calls, worker dispatch, media processing, render/export, Supabase persistence, external beta, paid production, or product-ready behavior.

## Credit Lifecycle Readiness

The `credit-lifecycle-readiness` scenario is classified as `mock_local` because the internal testing route now explains the post-reservation lifecycle that future backend runtime must enforce after a job outcome. Successful work spends the reserved credit record, cancelled or blocked work releases unused reserved credits, and ReEditPro-side failed work records a credit refund.

This lifecycle panel is evidence for repeated local testing only. It does not authorize real credit spend, wallet mutation, ledger writes, Stripe, provider calls, worker dispatch, media processing, render/export, Supabase persistence, external beta, paid production, or product-ready behavior.

## Repeated Local Operator Harness

The `repeated-local-operator-harness` scenario is classified as `mock_local` because the internal testing route now gives testers one source-truth loop: run `npm run qa:internal-testing`, open the mock project/session route family, verify approval and credit lifecycle gates, record browser-local notes, and export JSON evidence for the next PR.

This harness is evidence for disciplined repeated local testing only. It does not authorize live backend calls, tool execution, media processing, real billing, Supabase persistence, external beta, paid production, or product-ready behavior.

## Auth Project Access Readiness

The `auth-project-access-readiness` scenario is classified as `mock_local` because the internal testing route now checks frontend-safe Supabase Auth status and browser session state before authenticated testing graduates. The check is read-only and keeps the mock project/session route family visible for repeated local testing.

This readiness panel does not run profile/workspace bootstrap, read or write Supabase project/profile/workspace tables, create Storage objects, issue signed URLs, mutate credits, dispatch workers, process media, render/export, or mark the product ready.

## Browser Auth Bootstrap Readiness

The `browser-auth-bootstrap-readiness` scenario is classified as `mock_local` because the internal testing route now shows whether the signed-in tester's profile, workspace, and membership bootstrap is ready. It uses the same browser-safe Supabase anon-client bootstrap as `/sign-in`; when RLS blocks setup, it reports `backend_required` so the backend-only provisioning/readback workflows can finish the account setup.

This readiness panel allows only signed-in profile/workspace bootstrap through the Supabase anon client when RLS permits it. It does not expose service-role keys, admin clients, password readback, project/session writes, Storage objects, signed URLs, SQL, migrations, worker dispatch, media processing, render/export, credit spend, external beta, paid production, or product-ready behavior.

## Auth Project Session Membership Policy

The `auth-project-session-membership-policy` scenario is classified as `mock_local` because Project Home, Edit Chat, and Edit Brief now display a shared project/session access policy notice. Mock route access remains allowed for repeated local testing, while durable authenticated project/session access stays blocked until signed-in user, workspace membership, project membership, edit-session access, RLS policy, explicit Data API grant, and backend persistence evidence all exist.

This policy panel does not run profile/workspace bootstrap, read or write Supabase tables, create Storage objects, issue signed URLs, mutate credits, dispatch workers, process media, render/export, or mark the product ready.

## Durable Auth Project Session Backend Persistence Plan

The `durable-auth-project-session-backend-persistence-plan` scenario is classified as `mock_local` because the internal testing route now records the future server-side membership contract. The next backend skeleton must verify Supabase Auth server-side, join workspace membership to project and edit-session access, require explicit Data API grants plus RLS, and preserve audit/idempotency metadata before durable table-backed access can pass.

This plan does not run migrations, SQL, Supabase table reads/writes, Storage, signed URLs, service-role browser code, profile/workspace bootstrap writes, workers, media, render/export, credits, external beta, paid production, or product-ready behavior.

## Mock-Safe Durable Project Session Backend Skeleton

The `mock-safe-durable-project-session-backend-skeleton` scenario is classified as `mock_local` because the internal testing route now exposes the server-shaped access evaluator. Seeded mock route access can pass with auth user, workspace, project, edit session, request id, and idempotency key. Durable Supabase access still fails closed until RLS, explicit Data API grants, migration, and backend-only service-role evidence exist.

This skeleton does not run Supabase Data API table reads/writes, SQL, migrations, Storage, signed URLs, service-role browser code, profile/workspace bootstrap writes, workers, media, render/export, credits, external beta, paid production, or product-ready behavior.

## Durable Project Session Backend Route Integration

The `durable-project-session-backend-route-integration` scenario is classified as `mock_local` because Project Edit Session and Project Edit Brief mock routes now return `projectSessionAccess` metadata from the backend skeleton. Internal testers can verify the exact route-level project/session access decision before durable Supabase persistence is enabled.

This route integration does not run Supabase Data API table reads/writes, SQL, migrations, Storage, signed URLs, service-role browser code, profile/workspace bootstrap writes, workers, media, render/export, credits, external beta, paid production, or product-ready behavior.

## Durable Project Session Backend Readback QA

The `durable-project-session-backend-readback-qa` scenario is classified as `mock_local` because Project Edit Session and Project Edit Brief mock route responses now have readback QA coverage for both success and failure envelopes. Internal testers can verify `projectSessionAccess` metadata is present in successful `data` payloads and failed `error.details` payloads before durable Supabase route contracts are planned.

This readback QA does not run Supabase Data API table reads/writes, SQL, migrations, Storage, signed URLs, service-role browser code, profile/workspace bootstrap writes, workers, media, render/export, credits, external beta, paid production, or product-ready behavior.

## Durable Project Session Supabase Route Contract Plan

The `durable-project-session-supabase-route-contract-plan` scenario is classified as `mock_local` because the internal testing route now records the future Supabase route contract for Project Home, Project Edit Session, and Project Edit Brief. Each route must authorize through `workspace_members` and `auth.uid()`, and future durable access must prove explicit Data API grants plus authenticated-role RLS before table-backed route reads can pass.

This contract plan does not run Supabase Data API table reads/writes, SQL, migrations, Storage, signed URLs, service-role browser code, profile/workspace bootstrap writes, workers, media, render/export, credits, external beta, paid production, or product-ready behavior.

## Durable Project Session Supabase Schema/RLS Draft

The `durable-project-session-supabase-schema-rls-draft` scenario is classified as `mock_local` because the internal testing route now records the future table, index, RLS, Data API grant, and verification contract before any migration SQL is written. It names the core `profiles`, `workspaces`, `workspace_members`, `projects`, and `edit_sessions` chain plus route data inheritance for Brief rows.

This schema/RLS draft does not write migration SQL, apply migrations, run local Supabase reset, validate a remote project, generate types, run Supabase Data API table reads/writes, create Storage objects, issue signed URLs, mutate credits, dispatch workers, process media, render/export, or mark the product ready.

## Durable Project Session Supabase Migration SQL Draft

The `durable-project-session-supabase-migration-sql-draft` scenario is classified as `mock_local` because the internal testing route now records a review-only SQL draft under `database/migration-drafts/024_internal_testing_durable_project_session_access.draft.sql`. It keeps the draft outside `supabase/migrations`, preserves the `workspace_members` and `auth.uid()` access chain, and leaves route data table select grants pending migration review.

This migration SQL draft does not apply migrations, run local Supabase reset, validate a remote project, generate types, run Supabase Data API table reads/writes, create Storage objects, issue signed URLs, mutate credits, dispatch workers, process media, render/export, or mark the product ready.

## Durable Project Session Supabase Migration Review

The `durable-project-session-supabase-migration-review` scenario is classified as `mock_local` because the internal testing route now records review acceptance for the draft-only route data select grants and RLS policies. The reviewed draft covers `edit_briefs`, `edit_cues`, and `edit_session_export_settings` through the same `edit_sessions -> projects -> workspace_members -> auth.uid()` chain.

This migration review does not create an executable migration, apply migrations, run local Supabase reset, validate a remote project, generate types, implement table-backed routes, run Supabase Data API table reads/writes, create Storage objects, issue signed URLs, mutate credits, dispatch workers, process media, render/export, or mark the product ready.

## Durable Project Session Supabase Local Migration Dry-Run Plan

The `durable-project-session-supabase-local-migration-dry-run-plan` scenario is classified as `mock_local` because the internal testing route now records the exact future local-only dry-run recipe. The plan names the temp root, future Supabase command groups, synthetic fixture assertions, cleanup policy, and no-execution boundary before any local reset can be approved.

This dry-run plan does not run Supabase, create an executable migration, add `supabase/migrations` files, apply migrations, validate a remote project, generate types, implement table-backed routes, run Supabase Data API table reads/writes, create Storage objects, issue signed URLs, mutate credits, dispatch workers, process media, render/export, or mark the product ready.

## Boundaries

- Browser-local source video preview and metadata capture are allowed.
- Browser-local internal testing sign-in is allowed only when `VITE_REEDITPRO_INTERNAL_TEST_AUTH=true`.
- Backend-local source video upload is gated by explicit internal environment configuration.
- No unapproved upload or backend file-byte read outside the backend-local source-video upload gate.
- No provider/model call.
- No worker dispatch.
- No media processing.
- No render/export.
- No credit reservation or spend.
- No credit spend, ledger write, Stripe call, or silent billing.
- No live wallet mutation, release/refund mutation, or production billing lifecycle.
- No project/session Supabase Data API read/write, Storage, signed URL, SQL, migration, backend/admin profile-workspace bootstrap write, or service-role action.
- Public Supabase Auth may be checked when frontend-safe public env values are configured, and signed-in profile/workspace bootstrap may run only through the anon client when RLS permits it.
- No external beta, real-user-media beta, paid production, or product-ready claim.

## Validation

Required validation:

- `npm run smoke:project-edit-brief-internal-testing-entrypoint`
- `npm run smoke:project-edit-brief-internal-testing-completion-audit`
- `npm run smoke:preference-video-mock-limits-internal-testing-closeout`
- `npm run smoke:internal-testing-approval-credit-gates`
- `npm run smoke:internal-testing-credit-lifecycle-readiness`
- `npm run smoke:internal-testing-repeated-local-operator-harness`
- `npm run smoke:internal-testing-auth-project-access-readiness`
- `npm run smoke:internal-testing-browser-auth-bootstrap-readiness`
- `npm run smoke:internal-testing-auth-project-session-membership-policy`
- `npm run smoke:internal-testing-durable-auth-project-session-backend-persistence-plan`
- `npm run smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton`
- `npm run smoke:internal-testing-durable-project-session-backend-route-integration`
- `npm run smoke:internal-testing-durable-project-session-backend-readback-qa`
- `npm run smoke:internal-testing-durable-project-session-supabase-route-contract-plan`
- `npm run smoke:internal-testing-durable-project-session-supabase-schema-rls-draft`
- `npm run smoke:internal-testing-durable-project-session-supabase-migration-sql-draft`
- `npm run smoke:internal-testing-durable-project-session-supabase-migration-review`
- `npm run smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan`
- `npm run qa:internal-testing`
- `npm run smoke:project-edit-brief-internal-testing-review-pr-readiness`
- `npm run smoke:project-edit-brief-internal-testing-readback-qa`
- `npm run smoke:project-edit-brief-e2e`
- `npm run smoke:project-edit-brief-production-readiness-gates`
- `npm run smoke:beta-readiness`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Next

Use `/internal-testing` for repeated internal QA and source-truth feedback capture. The next real product milestones remain durable project/session Supabase local migration dry-run execution, real planner integration into approved plan snapshots, transactional credit reservation/spend/release/refund persistence, and explicit runtime/persistence gates.
