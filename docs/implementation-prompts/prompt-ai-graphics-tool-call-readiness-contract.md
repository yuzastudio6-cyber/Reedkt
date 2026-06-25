# Prompt: AI Graphics Tool Call Readiness Contract

Repository: `yuzastudio6-cyber/Reedkt`

Goal: connect the 21 AI graphics tools to a server-only, agent-facing tool-call readiness contract that uses the existing ranking/capability-selection evidence, install-readiness evidence, and runtime-boundary gates.

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Base: `origin/codex/rp-ai-graphics-gpu-model-runtime-readiness-gate`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `30cf1a6aaa1839f53c362bf844a1512d08ee2136`, with an empty check rollup at creation.

Latest observed PR state after proof-evidence alignment: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `1bceb2af24d26109a91170ba561e6eddb83de3fb`, with an empty check rollup.

Latest observed PR state after handoff-contract completion: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `e82be9cb51b785f95f597503c022094792e31aec`, with an empty check rollup.

Latest observed PR state after tool-call plan evaluator completion: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `afac06b7889bc61c0fe00c5587862f4735b79c9c`, with an empty check rollup.

Decision: `ai_graphics_tool_call_readiness_contract_prepared_with_warnings`

## Requirements

- Cover all 21 AI graphics tools.
- Preserve canonical tool IDs and explicitly map to production registry IDs where they exist.
- Mark unmatched canonical IDs as planning-only wrappers, not dropped tools; follow-up registry completion maps all 21 canonical IDs to production registry profiles.
- Link ranking/capability selection to install and runtime proof status.
- Align completed Node, browser, and Satori font proof evidence into the readiness contract without enabling execution.
- Keep agent selection planning-only.
- Keep all execution/runtime/storage/public/beta/production booleans false.
- Route heavy/model tools to GPU runtime targets, especially SAM2, BiRefNet, Real-ESRGAN, rembg, transparent-background, Torch/Torchvision, Transformers, and Kornia.
- Do not run installs, `npm ci`, tool execution, route execution, worker execution, provider/model calls, browser/WebGL/canvas runtime, GPU/model runtime, model downloads, media processing, Supabase/GCS mutation, signed URLs, public artifacts, beta, production, PR merge, PR close, or PR retarget.

## Implementation

- Add `server/tool-registry/ai-graphics-tool-call-readiness.ts`.
- Export from `server/tool-registry/index.ts`.
- Add `docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.md`.
- Add `docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json`.
- Add `scripts/validation/ai-graphics-tool-call-readiness-diagnostics.mjs`.
- Add package script `ai-graphics:tool-call-readiness:diagnostics`.
- Follow-up alignment records Satori font proof and browser proof as passed evidence while keeping Tool Route, Worker, approved snapshot, credit, artifact, beta, and production gates blocked.
- Follow-up registry completion adds production registry profiles for `torch_torchvision`, `transformers`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, and `animejs`, bringing AI graphics tool-call mapping to 21 of 21 while keeping execution gates blocked.
- Follow-up proper install audit adds `docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.md`, `docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json`, and `ai-graphics:21-tool-proper-install-audit:diagnostics` to prove 21 of 21 tools are installed or represented on the correct ReeditPro surface: 13 Node lockfile tools and 8 GPU Docker install-proof tools.
- Follow-up model manifest type alignment adds the missing `rembg_model` and `transparent_background_model` entries to the model-weight template ID type union, keeping all five AI graphics model-weight template IDs type-safe while model source/license/runtime proof remains blocked.
- Follow-up handoff contract adds `server/tool-registry/ai-graphics-tool-call-handoff.ts`, `docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.md`, `docs/tool-intelligence/ai-graphics/tool-call-handoff-contract.json`, and `ai-graphics:tool-call-handoff:diagnostics` so future Tool Route / Worker lanes can consume production tool IDs, worker types, runtime targets, ranked planning tools, blockers, and next proof milestones for all 21 tools and all 12 product-facing capabilities without approving execution.
- Follow-up plan evaluator adds `server/tool-registry/ai-graphics-tool-call-plan-evaluator.ts`, `docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.md`, `docs/tool-intelligence/ai-graphics/tool-call-plan-evaluator.json`, and `ai-graphics:tool-call-plan-evaluator:diagnostics` so future Tool Route / Worker lanes can turn a requested product-facing capability into ranked planning tools, production tool IDs, worker types, runtime targets, blockers, eliminated requested tools, and missing gates without approving execution.

## Expected Validation

- `git diff --check`
- `npm run --silent ai-graphics:tool-call-handoff:diagnostics`
- `npm run --silent ai-graphics:tool-call-plan-evaluator:diagnostics`
- `npm run --silent ai-graphics:tool-call-readiness:diagnostics`
- Existing install/readiness diagnostics for the 21-tool, GPU model install, and GPU runtime-readiness lanes.
- Typecheck where feasible without installing dependencies.
- Confirm `package-lock.json` remains unchanged.
- Confirm no `.local-artifacts` or generated media/render/browser/canvas/WebGL/public outputs are staged.
