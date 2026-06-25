# Prompt: AI Graphics Tool Call Readiness Contract

Repository: `yuzastudio6-cyber/Reedkt`

Goal: connect the 21 AI graphics tools to a server-only, agent-facing tool-call readiness contract that uses the existing ranking/capability-selection evidence, install-readiness evidence, and runtime-boundary gates.

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Base: `origin/codex/rp-ai-graphics-gpu-model-runtime-readiness-gate`

Decision: `ai_graphics_tool_call_readiness_contract_prepared_with_warnings`

## Requirements

- Cover all 21 AI graphics tools.
- Preserve canonical tool IDs and explicitly map to production registry IDs where they exist.
- Mark unmatched canonical IDs as planning-only wrappers, not dropped tools.
- Link ranking/capability selection to install and runtime proof status.
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

## Expected Validation

- `git diff --check`
- `npm run --silent ai-graphics:tool-call-readiness:diagnostics`
- Existing install/readiness diagnostics for the 21-tool, GPU model install, and GPU runtime-readiness lanes.
- Typecheck where feasible without installing dependencies.
- Confirm `package-lock.json` remains unchanged.
- Confirm no `.local-artifacts` or generated media/render/browser/canvas/WebGL/public outputs are staged.
