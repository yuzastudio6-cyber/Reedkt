# Internal Testing Repeated Local Operator Harness

## Decision

`internal_testing_repeated_local_operator_harness_passed_ready_for_repeated_local_internal_testing`

## Summary

This milestone turns the current internal-testing surface into a repeatable operator loop instead of a loose collection of routes and smokes.

The loop is intentionally local and production-shaped:

1. Run `npm run qa:internal-testing`.
2. Open `/internal-testing`.
3. Launch the mock project home, Edit Chat, and Edit Brief routes.
4. Verify approval snapshot, credit estimate, credit reservation, and credit lifecycle panels.
5. Record browser-local feedback.
6. Export the JSON note into the next issue or PR.

## Source Audit

- Base branch: `codex/reeditpro-web-ui-shell`.
- Prior source SHA: `5db8f04ebddf656c48b657054d66f6443adbe284`.
- Prior PR: #2431, `[internal-testing] Add credit lifecycle readiness`.
- Required prior decisions:
  - `internal_testing_approval_credit_gates_passed_ready_for_repeated_local_internal_testing`
  - `internal_testing_credit_lifecycle_readiness_passed_ready_for_repeated_local_internal_testing`
  - `internal_testing_qa_wrapper_passed_ready_for_repeated_local_internal_testing`

## Operator Sequence

| Step | Evidence |
| --- | --- |
| Run QA | `npm run qa:internal-testing` runs route, approval, credit lifecycle, beta readiness, and Playwright checks. |
| Open routes | Internal testers use one mock project/session route family instead of switching to legacy-only paths. |
| Check gates | Approved snapshot, approved estimate, and reserved credit IDs are visible as preconditions. |
| Export notes | Browser-local JSON feedback captures pass/blocker notes without storing private media. |

## Boundaries

- No upload or file-byte read.
- No provider/model call.
- No worker dispatch.
- No tool execution.
- No media processing.
- No render/export.
- No real credit reservation, spend, release, refund, wallet mutation, ledger write, Stripe call, or silent billing.
- No live Supabase read/write, Storage, signed URL, SQL, or migration.
- No external beta, real-user-media beta, paid production, or product-ready claim.

## Validation

- `npm run smoke:internal-testing-repeated-local-operator-harness`
- `npm run smoke:internal-testing-qa-wrapper`
- `npm run qa:internal-testing`
- `npm run smoke:worker`
- `npm run smoke:prod-cost-controls`
- `npm run smoke:prod-runtime-contracts`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Next

The next implementation should keep moving toward repeated local internal testing of the real user flow: authenticated project/session access, approved plan snapshot persistence, transactional credit reservation/spend/release/refund persistence, and backend worker dispatch remain separate gates.
