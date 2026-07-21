# Edit Reference Study Chat Canonical Reasoning Run — 2026-07-20

Status: `source_verified_contract_fixture_unreleased`

## Outcome

The mounted Edit Reference Study Chat now has a provider-neutral contract for the exact reasoning run it will eventually consume from the shared backend. The contract represents one pre-plan Study Chat request as a contiguous Kimi K3 primary → Qwen 3.7 fallback → DeepSeek V4 Pro final-fallback run. Each provider attempt has its own one-use submission, lifecycle, usage, immutable rate-card, internal-cost, and terminal evidence.

This corrects two architecture gaps without activating a provider:

1. Study Chat no longer needs to fabricate an approved edit snapshot or edit credit reservation merely to meter pre-plan reasoning.
2. A failed Kimi or Qwen attempt remains part of internal production cost before the next route may start.

The previous `reasoning-model-attempt-cost-evidence-v1` remains readable and unchanged for approved-edit execution history. The new V2 workload authority is additive.

## Pre-plan authority

`pre_plan_edit_reference_study_chat` binds the exact:

- workspace and authenticated actor;
- Edit Reference and Study Session;
- study revision and reasoning-request digest;
- approved study-usage estimate;
- internal-cost budget;
- immutable rate-card snapshot;
- maximum authorized internal cost.

It explicitly records that no approved edit snapshot or edit credit reservation was fabricated. Internal provider cost remains separate from customer price, customer credits, service fee, wallet state, billing, and charging.

## Route and fallback rules

The V2 aggregate accepts one to three attempts only when they:

- start with Kimi and follow the exact canonical route without skipping or reordering;
- share the exact reasoning run and workload-authority digest;
- bind the same request digest;
- use route ordinal equal to immutable route priority;
- enter a fallback only after the immediately preceding attempt reached a metered terminal failure;
- carry the same allowed sanitized fallback trigger from the prior terminal attempt;
- never continue after a completed or unknown provider outcome;
- retain failed-attempt cost evidence.

An unknown provider outcome exposes the approved maximum internal-cost ceiling, remains unverified, and blocks every fallback until reconciliation. It cannot claim token usage, a terminal failure, or a completed answer.

## Cost rules

The existing shared rate-card and cost math remain authoritative. V2 evidence reconstructs the calculation from token usage and the immutable route rate card rather than trusting caller totals.

- Kimi and DeepSeek use their USD-native rate entries.
- Qwen retains CNY-native cost and requires an immutable versioned CNY→USD FX snapshot before a production pre-plan aggregate can claim a USD total.
- Completed and failed calls both require provider usage evidence.
- Unknown calls retain unverified exposure instead of inventing usage.
- The sum of verified normalized provider cost must remain within the pre-plan internal-cost ceiling.
- Provider invoice reconciliation remains false.

## Lifecycle receipt

The canonical run receipt binds each cost record to one exact provider lifecycle record with:

- reasoning run, route attempt, route authorization, provider, model, and boundary;
- one provider-request record and one-use submission authority;
- provider request, usage, and observation evidence digests;
- canonical checkback/workflow identities whenever provider truth is unknown;
- start and terminal timestamps;
- exactly one submission, zero retry, and no resubmission;
- safe failure code for failed attempts;
- no stored credential value, raw request body, raw provider response, provider URL, or projected local path;
- no caller-selected executable or provider route.

The Study Chat projection re-verifies the exact request and cost identities before exposing only bounded run state, route IDs, attempt IDs, aggregate internal cost, and result digest.

## Evidence boundary

The constructor produces only `source_verified_contract_fixture_unreleased` evidence. It sets:

- `promotionAllowed = false`;
- `productionReady = false`;
- `providerCallsMadeByReceiptBuilder = false`.

There is intentionally no exported source-only path that can create `canonical_backend_verified_runtime` evidence. A live release still requires the canonical hosted repository, server-issued route authorization, Kimi/Qwen/DeepSeek provider adapters, one-use provider dispatch, durable checkback/reconciliation, attempt-level usage persistence, same-SHA staging evidence, Auth/RLS/private storage, and production qualification.

## Verification

Run:

```bash
npm run smoke:edit-reference-study-chat-reasoning-run
npm run smoke:reasoning-model-routing-cost
npm run smoke:edit-reference-mounted-study-chat-runtime
npm run typecheck:server
```

The focused adversarial smoke proves the full three-route path, two retained failed-attempt costs, a completed final fallback, unknown-outcome blocking, mandatory Qwen FX normalization, route-order rejection, fallback-lineage rejection, completed-attempt stop, evidence-tamper rejection, cost-ceiling rejection, exact Study Chat request binding, and non-promotable evidence.
