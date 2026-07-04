# Project Edit Brief Internal Testing Entrypoint

## Decision

`project_edit_brief_internal_testing_entrypoint_passed_ready_for_repeated_internal_testing`

## Summary

RP-EDITBRIEF-23 adds the missing `/internal-testing` app route as a production-shaped mock/internal testing console. The route uses the existing `internalTestingScenarios` registry, links to the Project Home, Edit Chat, and Edit Brief session paths, summarizes scenario readiness, and records browser-local feedback that can be exported as JSON for follow-up PRs.

This is not a shortcut or throwaway testing surface. It keeps the same project/session and route seams that later release work can graduate through evidence, owner approval, persistence, and runtime gates.

## Connected Routes

- `/internal-testing`
- `/projects/mock-project-edit-chat-foundation`
- `/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/chat`
- `/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief`
- `/edit-preferences`

## Preference Video Limits Closeout

The formerly blocked `preference-video-mock-only-limits` scenario is now classified as `mock_local` because the internal testing route exposes an explicit Preference Video limits panel and `/edit-preferences` is mounted as a browser-safe mock/local preference library.

This closeout only proves that internal testers can see and verify the boundaries. It does not authorize reference upload, URL fetch, real media analysis, Qwen/DeepSeek/provider calls, workers, render/export, credit movement, Supabase persistence, external beta, paid production, or product-ready behavior.

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

## Boundaries

- No upload or file-byte read.
- No provider/model call.
- No worker dispatch.
- No media processing.
- No render/export.
- No credit reservation or spend.
- No credit spend, ledger write, Stripe call, or silent billing.
- No live wallet mutation, release/refund mutation, or production billing lifecycle.
- No Supabase Data API read/write, Storage, signed URL, SQL, migration, profile/workspace bootstrap write, or service-role action.
- Public Supabase Auth may be checked read-only only when frontend-safe public env values are configured.
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
- `npm run smoke:internal-testing-auth-project-session-membership-policy`
- `npm run smoke:internal-testing-durable-auth-project-session-backend-persistence-plan`
- `npm run smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton`
- `npm run smoke:internal-testing-durable-project-session-backend-route-integration`
- `npm run smoke:internal-testing-durable-project-session-backend-readback-qa`
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

Use `/internal-testing` for repeated internal QA and source-truth feedback capture. The next real product milestones remain durable project/session Supabase route contract planning, real planner integration into approved snapshots, transactional credit reservation/spend/release/refund persistence, and explicit runtime/persistence gates.
