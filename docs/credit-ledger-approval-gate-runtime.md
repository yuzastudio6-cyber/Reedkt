# Credit Ledger And Approval Gate Runtime

Prompt 6 creates a limited credit route/service foundation. It hardens the previous unsafe credit boundary by removing legacy production-path approval writes and mock reservation success. It does not enable real credit mutation.

## Current Implementation Found

- `server/services/credit-gate-service.ts` previously carried the credit boundary name and could target legacy credit approval/reservation behavior.
- `server/routes/credit-routes.ts` exposed approval/reserve/balance routes that were not aligned with the Prompt 2A canonical schema contract.
- `src/backend/api/routes/credit-api-routes.ts` still described mock credit estimates and old route IDs.
- Canonical credit runtime tables exist in active migrations, but a reviewed transactional RPC/service-role mutation path is not present.

## Canonical Tables And Concepts

Prompt 6 targets these canonical records only:

- `credit_estimates`
- `credit_estimate_items`
- `approval_records`
- `approved_plan_snapshots`
- `credit_reservations`
- `credit_ledger_entries`
- `refund_records`
- `projects`
- `workspaces`
- `workspace_members`

The following are treated as legacy or needs-review for future cleanup and are not production-path targets:

- `credit_wallets`
- `credit_grants`
- `credit_wallet_balance_view`
- `credit_estimate_line_items`
- `credit_reservation_line_items`
- `credit_approvals`
- `credit_refunds`

## Runtime Boundary

Allowed in Prompt 6:

- Authenticated credit readiness checks.
- Workspace/project access checks before credit reads or gate checks.
- Read-only canonical estimate, reservation, ledger, approved snapshot, and gate validation when backend admin runtime exists.
- Fail-closed mutation route shape for estimate creation, estimate approval, reservation creation, spend, release, and refund.
- Idempotency key enforcement for mutation routes.
- Safe metadata validation that rejects secret, token, provider key, service-role, Stripe, signed URL, and credential-like keys.
- Sanitized intended payload summaries for future transactional implementation.

Forbidden in Prompt 6:

- Real credit estimate, reservation, ledger, refund, approval, or wallet mutation.
- Stripe checkout, webhook, billing, grant, or payment processing.
- Job creation, worker dispatch, provider calls, render/export execution, tool execution, storage upload/download execution, media analysis, or planning generation.
- Remote Supabase validation, production migrations, schema-changing migrations, deployment, or broad service-role handlers.

## Gate Behavior

The credit gate response shape is standardized around:

- `status`
- `canProceed`
- `blockers`
- `warnings`
- `requiredRecords`
- `nextAction`
- optional `creditEstimate`
- optional `creditReservation`
- optional `wallet`
- optional `ledgerEntries`
- optional sanitized `auditEvent`
- optional sanitized `intendedPayload`

Mutation routes return `BACKEND_REQUIRED` until a future prompt adds reviewed transactional mutation. Readiness routes can return blockers for missing approved estimate, approved snapshot, active reservation, scope mismatch, expired reservation, insufficient reserved credits, unsafe metadata, or no-double-spend risk.

## Service-Role Boundary

Prompt 6 can read canonical credit records only through the server service context when an admin client exists. If admin runtime is absent or mock-only mode is active, credit checks return backend-required blockers. Frontend code never receives service-role credentials or raw privileged data.

## Validation Summary

Validation is recorded in `docs/prompt-06-validation-results.md`. Static diagnostics are local-file only. SQL/RLS tests remain draft-only in `database/test-sql/009_credit_ledger_approval_gate_rls_smoke_tests.draft.sql`.

## Remaining Blockers

- No reviewed transactional credit RPC/service exists.
- Local/staging RLS execution is still required before production use.
- Wallet/grant/purchase semantics need a future dedicated billing/ledger milestone.
- Stripe remains blocked until credit ledger, idempotency, refunds, webhooks, audit, and abuse controls are reviewed.

## Next Recommendation

Prompt 7 - Backend API Runtime And Route Hardening if Prompt 6 validation and CI pass; otherwise Prompt 6A - Credit Gate Validation Hardening.
