# Tool-Call Intent Planner

Milestone 2 adds a planning-only tool-call intent layer to edit plans. It sits between tool strategy and execution planning so users can see which backend tools an edit may use before they approve credits.

## Scope

The planner records:

- tool/capability
- why the tool may be used
- input artifact dependency
- expected output artifact
- pre-approval cost estimate
- fallback strategy
- readiness state

The intent plan is attached to mock edit plans and backend edit-plan records as `toolCallIntentPlan`.

## User-Facing Behavior

The chat editor shows a `Planned tool calls` card before approval. It summarizes backend-gated candidates, dry-run-only lanes, gated lanes, estimated credits, and individual tool reasons. This is the source of the user-facing statement: “This edit will use FFmpeg, OCR, OpenColorIO, etc., because...”

## Execution Boundary

Tool-call intents do not run tools. Every intent remains:

- `planningOnly: true`
- `approvalRequiredBeforeExecution: true`
- `frontendExecutionAllowed: false`

Future execution still requires approved plan snapshot, credit estimate, credit reservation, idempotency, private artifact references, worker routing, owner/license/model evidence, and cost-event handling.

## Validation

Run:

```bash
npm run smoke:tool-call-intent-planner
npm run smoke:unified-skill-capability-registry
npm run typecheck:server
```

The smoke test verifies the schema shape, baseline planned tools, readiness states, approval gates, frontend execution block, and chat planning card descriptor.
