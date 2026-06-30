# AI Graphics Production Launch Readiness Gap

Decision: `ai_graphics_production_launch_readiness_gap_prepared_external_beta_ready_production_blocked`

This packet is the production-facing gap report after the accepted external-beta
activated-launch readiness packet and the beta/production readiness rollup. It
also consumes the production launch controls contract. It does not approve
production launch. It records what is already true for external beta, accepts
private production controls evidence, and keeps final production go/no-go plus
explicit traffic cutover approval as blockers.

## Current Result

- AI graphics tools covered: 21.
- Product-facing capabilities covered: 12.
- GPU/model runtime targeted tools: 8.
- External-beta ready now: 21 tools, controlled on-demand tool-call readiness only.
- Runtime ready for on-demand external-beta tool calls: 21 tools.
- Production ready now: 0 tools.
- Production launch controls accepted: true, from private/backend evidence refs only.
- Agent can select for planning: true.
- Agent can execute tools now: false.
- GPU runtime should start now: false.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json`
- `docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json`
- `docs/tool-intelligence/ai-graphics/production-launch-controls.json`

The production controls contract is committed, while accepted production control
refs are private/backend evidence supplied at evaluator runtime and are not
committed. All source packets must keep direct agent execution, Tool Route execution,
Worker execution, browser/WebGL/canvas runtime, GPU/model runtime, public
artifacts, signed URLs, and production false.

## Production Blockers

- Final production go/no-go packet.
- Explicit production traffic cutover approval.
- Post-approval production execution remains future backend/worker runtime.

## GPU Runtime Policy

The eight GPU/model tools remain on native GPU worker targets. GPU runtime is
on-demand only, with no idle resident GPU runtime approved. This packet does not
start GPU runtime; a future accepted production worker job must be the trigger.

## No-Scope

This packet does not install dependencies, mutate `package-lock.json`, execute
tools, execute routes, execute workers, call providers/models, run
browser/WebGL/canvas runtime, start GPU/model runtime, download or load model
weights, process media, mutate Supabase/GCS, create signed URLs, create public
artifacts, unlock production, merge PRs, close PRs, or retarget PRs.
