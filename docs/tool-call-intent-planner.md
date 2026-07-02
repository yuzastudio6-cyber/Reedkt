# Tool-Call Intent Planner

Milestone 2 adds a planning-only tool-call intent layer to edit plans. It sits between tool strategy and execution planning so users can see which backend tools an edit may use before they approve credits.

Milestone 3 adds the cost/credit gate bridge. Planning still does not run tools, but each intent now carries a low/expected/high credit range and a credit-gate state. Backend code can enrich the plan with the static v1 tool-cost rate card, attach approved snapshot/estimate/reservation IDs, and fail closed before worker/provider/render execution when the high estimate is not covered.

## Scope

The planner records:

- tool/capability
- why the tool may be used
- input artifact dependency
- expected output artifact
- pre-approval low/expected/high cost estimate
- approved snapshot / credit estimate / reservation gate status
- fallback strategy
- readiness state

The intent plan is attached to mock edit plans and backend edit-plan records as `toolCallIntentPlan`.

## User-Facing Behavior

The chat editor shows a `Planned tool calls` card before approval. It summarizes backend-gated candidates, dry-run-only lanes, gated lanes, expected/high credits, the missing approval/reservation gate, and individual tool reasons. This is the source of the user-facing statement: “This edit will use FFmpeg, OCR, OpenColorIO, etc., because...”

The default UI state is intentionally blocked:

- missing approved plan snapshot
- missing approved credit estimate
- missing active credit reservation

This makes the user-facing credit summary visible before approval without silently enabling execution.

## Backend Cost Gate

`server/tool-cost-metering/tool-call-intent-cost-gate.ts` is the backend bridge from planned intents to professional tool cost metering:

- `applyToolCostMeteringToToolCallIntentPlan()` maps each planned intent to `estimateToolCost()` and stores the metered low/expected/high credits, internal cost cents, rate-card version, and safe pricing snapshot.
- `assertToolCallIntentExecutionCreditGate()` blocks a plan unless the approved plan snapshot, credit estimate, credit reservation, and high-estimate budget coverage are present.
- `assertToolExecutionCostCreditGate()` is the worker/provider/render boundary helper for approved snapshot, estimate ID, reservation ID, idempotency key, and revised-estimate budget checks.

The raw metering event layer still enforces the last line of defense: billable events require `creditEstimateId` and `creditReservationId`, and events that exceed the approved reservation throw instead of silently charging.

## Execution Boundary

Tool-call intents do not run tools. Every intent remains:

- `planningOnly: true`
- `approvalRequiredBeforeExecution: true`
- `frontendExecutionAllowed: false`

Future execution still requires approved plan snapshot, credit estimate, credit reservation, idempotency, private artifact references, worker routing, owner/license/model evidence, and cost-event handling.

## Validation

Run:

```bash
npm run smoke:tool-call-cost-credit-gate
npm run smoke:tool-call-intent-planner
npm run smoke:tool-cost-metering
npm run smoke:unified-skill-capability-registry
npm run typecheck:server
```

The smoke tests verify the schema shape, baseline planned tools, readiness states, approval gates, frontend execution block, chat planning card descriptor, rate-card enrichment, over-budget revised-estimate blocking, required reservation IDs, idempotent event guardrails, and non-billable failure handling.
