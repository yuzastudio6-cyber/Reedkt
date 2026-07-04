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

## Boundaries

- No upload or file-byte read.
- No provider/model call.
- No worker dispatch.
- No media processing.
- No render/export.
- No credit reservation or spend.
- No credit spend, ledger write, Stripe call, or silent billing.
- No live wallet mutation, release/refund mutation, or production billing lifecycle.
- No live Supabase read/write, Storage, signed URL, SQL, or migration.
- No external beta, real-user-media beta, paid production, or product-ready claim.

## Validation

Required validation:

- `npm run smoke:project-edit-brief-internal-testing-entrypoint`
- `npm run smoke:project-edit-brief-internal-testing-completion-audit`
- `npm run smoke:preference-video-mock-limits-internal-testing-closeout`
- `npm run smoke:internal-testing-approval-credit-gates`
- `npm run smoke:internal-testing-credit-lifecycle-readiness`
- `npm run smoke:internal-testing-repeated-local-operator-harness`
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

Use `/internal-testing` for repeated internal QA and source-truth feedback capture. The next real product milestones remain authenticated project/session access, real planner integration into approved snapshots, transactional credit reservation/spend/release/refund persistence, and explicit runtime/persistence gates.
