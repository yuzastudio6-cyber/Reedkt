# AI Graphics Tool Call Readiness Contract Results

Decision: `ai_graphics_tool_call_readiness_contract_prepared_with_warnings`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Base: `origin/codex/rp-ai-graphics-gpu-model-runtime-readiness-gate`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `30cf1a6aaa1839f53c362bf844a1512d08ee2136`, with an empty check rollup at creation.

Duplicate search: no exact open head PR or remote branch existed for `codex/rp-ai-graphics-tool-call-readiness-contract` before implementation.

Latest observed PR state after proof-evidence alignment: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `1bceb2af24d26109a91170ba561e6eddb83de3fb`, with an empty check rollup.

Latest observed PR state after handoff-contract completion: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `e82be9cb51b785f95f597503c022094792e31aec`, with an empty check rollup.

Latest observed PR state after tool-call plan evaluator completion: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `afac06b7889bc61c0fe00c5587862f4735b79c9c`, with an empty check rollup.

Latest observed PR state after beta-readiness gate completion: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `35e50f94e8458ffbe6190bd53b557355ff56950e`, with an empty check rollup.

## Result

- Added server-only contract: `server/tool-registry/ai-graphics-tool-call-readiness.ts`.
- Exported it from `server/tool-registry/index.ts`.
- Added docs records:
  - `docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.md`
  - `docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json`
- Added diagnostic:
  - `scripts/validation/ai-graphics-tool-call-readiness-diagnostics.mjs`
- Added package script:
  - `ai-graphics:tool-call-readiness:diagnostics`

## Tool Coverage

- All 21 AI graphics tools are covered.
- All 21 AI graphics tools now map to production registry IDs.
- Added a strict 21-tool proper install audit:
  - `docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.md`
  - `docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json`
  - `ai-graphics:21-tool-proper-install-audit:diagnostics`
- 13 JS graphics tools remain tied to `package.json` and `package-lock.json`.
- Node, browser, and Satori font runtime proof evidence is now reflected in the contract for the 13 JS graphics tools.
- 8 ML/GPU tools remain tied to Docker/GPU worker install targets and runtime-readiness gates.
- Heavy/model tools route to GPU runtime targets, not CPU runtime defaults.
- Proper install audit result: 21 of 21 tools are correctly installed or represented for their intended ReeditPro surface; 13 use Node lockfile packages, 8 use GPU Docker install-proof targets, 0 heavy tools are incorrectly routed to CPU, and 0 tools are agent-executable now.
- Model manifest type alignment: `sam2_checkpoint`, `birefnet_model`, `real_esrgan_model`, `rembg_model`, and `transparent_background_model` are all represented in the model-weight template ID type layer. This closes the focused TypeScript mismatch for `rembg_model` and `transparent_background_model`; reviewed model manifests and native GPU runtime proof are still pending.
- Added server-only handoff contract:
  - `server/tool-registry/ai-graphics-tool-call-handoff.ts`
  - `docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.md`
  - `docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json`
  - `ai-graphics:tool-call-handoff:diagnostics`
- Handoff result: all 21 tools and all 12 product-facing capabilities are connected to future Tool Route / Worker handoff metadata with production tool IDs, worker types, runtime targets, ranked planning tools, blockers, and next proof milestones. Execution remains blocked.
- Added server-only plan evaluator:
  - `server/tool-registry/ai-graphics-tool-call-plan-evaluator.ts`
  - `docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.md`
  - `docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json`
  - `ai-graphics:tool-call-plan-evaluator:diagnostics`
- Evaluator result: a future Tool Route can request a product-facing AI graphics capability and receive ranked planning tools, production tool IDs, worker types, runtime targets, blockers, eliminated requested tools, and missing execution gates. Execution requests still return blocked decisions until approved plan, credit, artifact, Tool Route, Worker, and runtime proof gates pass.
- Added server-only beta readiness gate:
  - `server/tool-registry/ai-graphics-beta-readiness-gate.ts`
  - `docs/tool-intelligence/ai-graphics/beta-readiness-gate.md`
  - `docs/tool-intelligence/ai-graphics/beta-readiness-gate.json`
  - `ai-graphics:beta-readiness-gate:diagnostics`
- Beta gate result: 21 of 21 tools are installed or represented, 21 of 21 map to production registry IDs, 21 of 21 are selectable for planning, 8 heavy/model tools remain GPU-runtime targeted, 0 heavy/model tools target CPU fallback, and 0 of 21 tools are beta-testing ready until the missing runtime/owner gates are passed.

## Runtime State

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `modelWeightsApprovedNow=false`
- `approvedPlanSnapshotRequired=true`
- `creditReservationRequired=true`
- `artifactBoundaryApprovalRequired=true`
- `internalBetaReadyNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## No-Scope

No dependencies were installed, no `npm ci` was run, no `npm install` was run, no tools/routes/workers/providers executed, no browser/WebGL/canvas runtime ran, no GPU/model runtime ran, no model weights were downloaded, no media was processed, no Supabase/GCS mutation occurred, no signed URL or public artifact was created, and no beta or production gate was unlocked.

## Next

Run native GPU runtime proof and Tool Route/Worker handoff approval before any agent-executable beta lane. Production registry profiles now exist for all 21 tools, but several profiles remain planning-only or readiness-check-only until execution gates are approved.
