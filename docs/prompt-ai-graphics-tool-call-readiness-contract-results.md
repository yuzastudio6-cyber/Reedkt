# AI Graphics Tool Call Readiness Contract Results

Decision: `ai_graphics_tool_call_readiness_contract_prepared_with_warnings`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Base: `origin/codex/rp-ai-graphics-gpu-model-runtime-readiness-gate`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `30cf1a6aaa1839f53c362bf844a1512d08ee2136`, with an empty check rollup at creation.

Duplicate search: no exact open head PR or remote branch existed for `codex/rp-ai-graphics-tool-call-readiness-contract` before implementation.

Latest observed PR state after proof-evidence alignment: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `1bceb2af24d26109a91170ba561e6eddb83de3fb`, with an empty check rollup.

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
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## No-Scope

No dependencies were installed, no `npm ci` was run, no `npm install` was run, no tools/routes/workers/providers executed, no browser/WebGL/canvas runtime ran, no GPU/model runtime ran, no model weights were downloaded, no media was processed, no Supabase/GCS mutation occurred, no signed URL or public artifact was created, and no beta or production gate was unlocked.

## Next

Run native GPU runtime proof and Tool Route/Worker handoff approval before any agent-executable beta lane. Production registry profiles now exist for all 21 tools, but several profiles remain planning-only or readiness-check-only until execution gates are approved.
