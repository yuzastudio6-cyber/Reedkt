# Prompt GD-2 AI Tools Creative Graphics Dry-Run Fixture Pack

## Prompt Summary

Implement GD-2 from `origin/codex/rp-gd-1-ai-tools-creative-graphics-manifest-contract` on branch `codex/rp-gd-2-ai-tools-creative-graphics-dry-run-fixture-pack`.

GD-2 creates static dry-run fixture specs and documentation for all 12 AI Tools / Creative Graphics tools. It does not execute tools, render media, call providers/models, run workers, run browser capture, process media, run Docker/Cloud Run, create public artifacts, create signed URLs, run SQL, mutate Supabase, or unlock runtime/beta/production.

## Required Tool Coverage

- Remotion
- D3.js
- Three.js
- PixiJS
- Anime.js
- Lottie-web
- SVG.js
- Apache ECharts
- Vega/Vega-Lite
- Viz.js/Graphviz
- Satori
- `@resvg/resvg-js`

## Required State

- Runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / dry_run_not_executed`
- Production capability enabled: `none; AI Tools creative graphics dry-run fixture pack only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## Required Deliverables

- Dry-run fixture pack doc.
- 12 per-tool fixture JSON specs under `docs/ai-tools/dry-run-fixtures/`.
- Synthetic input manifest examples.
- Placeholder output manifest examples.
- QA checklist.
- Track A handoff examples.
- Worker envelope examples.
- Dry-run readiness matrix.
- Prompt GD-2 validation results.
- Static diagnostics and foundation validation wiring.

## Blocked Scope

No runtime implementation, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, render/export execution, tool execution, worker execution, browser capture, media processing, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, production/beta unlock, dependency mutation, human approval grant, staging execution approval, raw prompt execution, or broad service-role handler is enabled.

## PR

PR link: [#235](https://github.com/yuzastudio6-cyber/Reedkt/pull/235).
