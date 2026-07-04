# Tool-Call Intent Planner

Milestone 2 adds a planning-only tool-call intent layer to edit plans. It sits between tool strategy and execution planning so ReeditPro can explain which edit activities may run before users approve credits while preserving exact backend identifiers for developer/audit review.

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

Agents and backend planners can request additional non-baseline capabilities with `requestedCapabilities`. That path is used for exact agent/tool-call capability IDs such as:

- `streamer_render_pipeline_support`
- `mkvtoolnix_container_validation`
- `gpac_mp4box_packaging_validation`

Those IDs remain audit/developer identifiers. Guided chat summarizes them as render pipeline support, container validation, and packaging validation rather than listing raw tool names.

The ready-audio architecture pack follows the same rule. Agents may plan and dispatch backend-gated audio activities through exact IDs such as `librosa`, `pyloudnorm`, `music21`, `noisereduce`, `mir_eval`, `pydub_effects`, or `ebu_r128_pyloudnorm`, but guided chat should describe the work as audio timing analysis, loudness check, music cue inspection, simple cleanup preparation, MIDI timing analysis, or audio QA. Raw package/library names remain developer/audit details unless the user opens an advanced technical view.

## User-Facing Behavior

The guided chat editor shows a `Planned edit work` card before approval. It summarizes edit activities, readiness, approval cost, progress, private results, blockers, and QA in user-facing edit language. Guided chat must not list raw execution tool names by default; exact identifiers stay available only in developer review.

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

Track A native container capabilities are backend-gated candidates only. They do not authorize frontend execution, public artifacts, external beta, paid production, or product-ready local OSS status by themselves.

Ready-audio adapter calls are also backend-gated candidates only. They require `readyAudioAdapterToolId`, approved snapshot/credit/reservation IDs, private source artifacts, idempotency, and adapter QA checks before the gateway can dispatch a mock-safe backend job.

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
