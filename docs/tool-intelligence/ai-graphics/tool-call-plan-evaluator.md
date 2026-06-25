# AI Graphics Tool-Call Plan Evaluator

Decision: `ai_graphics_tool_call_plan_evaluator_prepared_with_execution_blocks`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

The evaluator turns a requested AI graphics capability into ranked planning metadata backed by the tool-call readiness and handoff contracts. It is the server-only bridge a future approved-plan Tool Route can use before dispatching any worker.

The evaluator does not execute tools. It refuses execution requests and returns the missing gates instead.

## Selection Behavior

- Accepts a product-facing capability.
- Reads the canonical ranking and capability-selection records.
- Returns ranked selected tools with `productionToolId`, `workerType`, `runtimeTarget`, ranking tier, total score, blockers, and next milestone.
- Eliminates requested tools that do not belong to the requested capability.
- Reports proof and execution gates still required before runtime.

## Coverage

- Tools covered: 21.
- Product-facing capabilities covered: 12.
- GPU/model runtime-targeted tools: 8.
- Heavy/model tools routed to GPU runtime targets: true.
- Heavy/model tools routed to CPU runtime targets: false.
- Agent can select for planning/study metadata: true.
- Agent can execute tools now: false.

## Required Execution Gates

- Approved plan snapshot.
- Credit reservation.
- Artifact-boundary approval.
- Tool Route execution approval.
- Worker execution approval.
- Runtime-specific proof.
- Native NVIDIA L4 proof and reviewed model manifests for GPU/model tools.
- Browser/canvas/WebGL sandbox proof for browser-rendered graphics tools.

## No-Scope

No tools, routes, workers, providers, browser/WebGL/canvas runtime, GPU/model runtime, model weights, media, Supabase/GCS, signed URLs, public artifacts, beta, or production execution is approved by this evaluator.
