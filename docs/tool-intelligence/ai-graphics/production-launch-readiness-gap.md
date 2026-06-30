# AI Graphics Production Launch Readiness Gap

Decision: `ai_graphics_production_launch_readiness_gap_prepared_external_beta_ready_production_blocked`

This packet is the production-facing gap report after the accepted external-beta
activated-launch readiness packet and the beta/production readiness rollup. It
does not approve production launch. It records what is already true for external
beta and what must still be accepted before production.

## Current Result

- AI graphics tools covered: 21.
- Product-facing capabilities covered: 12.
- GPU/model runtime targeted tools: 8.
- External-beta ready now: 21 tools, controlled on-demand tool-call readiness only.
- Runtime ready for on-demand external-beta tool calls: 21 tools.
- Production ready now: 0 tools.
- Agent can select for planning: true.
- Agent can execute tools now: false.
- GPU runtime should start now: false.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json`
- `docs/tool-intelligence/ai-graphics/beta-production-readiness-rollup.json`

Both source packets must keep direct agent execution, Tool Route execution,
Worker execution, browser/WebGL/canvas runtime, GPU/model runtime, public
artifacts, signed URLs, and production false.

## Production Blockers

- separate production launch owner approval.
- Production support and incident-response runbook.
- Production rollback and kill-switch plan.
- Production cost and concurrency ceilings.
- Production monitoring, alerting, and post-launch review.
- Production credit ledger and approval snapshot enforcement.
- Production Tool Route and Worker deployment acceptance.
- Production privacy, retention, and private artifact controls.

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
