# Credit Runtime Approval Gate

RP-FIX-09 adds a mock-safe credit approval gate service. It makes the product rule explicit: expensive work cannot start until the edit plan is approved, the credit estimate is approved, and credits are reserved.

## Gate Checks

The gate checks:

- current workspace/project scope;
- edit plan approval when required;
- credit estimate existence;
- credit estimate approval;
- available credit snapshot before reservation;
- credit reservation existence;
- reservation status and expiration;
- reservation workspace/project/edit-plan/estimate match.

## Frontend Boundary

Frontend code may display estimates and mock gate results. It must not be trusted to reserve, spend, release, or refund real credits. Real ledger mutation remains backend-required.

RP-FIX-10 uses the credit gate as one required input before mock worker queue items can dispatch. The production rule remains unchanged: no worker, provider, render, or export job may run without approved credits and a valid reservation.

Tool-cost wallet settlement has a backend-owned settlement path for platform billing QA. `POST /v1/tool-costs/events/:toolCostEventId/settle` requires auth and idempotency, creates only a mock ledger effect in local/mock mode, keeps Stripe and ReEditPro service/edit fees out of tool owner cost events, and in non-mock runtime calls the `settle_tool_cost_event` RPC from `202606270003_tool_cost_wallet_settlement_rpc.sql`. Missing migration/RPC support fails closed with `TOOL_COST_BACKEND_REQUIRED`.

## Mock Status

The mock gate returns allowed/blocked decisions and warnings. It does not call Stripe, provider APIs, workers, rendering, or remote Supabase.

## Remaining Work

Production still needs deployed migration evidence, service-role runtime verification, RLS readback, and billing-owner QA before this settlement path can clear the platform blocker.
