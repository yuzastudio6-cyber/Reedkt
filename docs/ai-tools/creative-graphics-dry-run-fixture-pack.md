# Creative Graphics Dry-Run Fixture Pack

Status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / dry_run_not_executed`

Production capability enabled: `none; AI Tools creative graphics dry-run fixture pack only`

## Purpose

GD-2 defines static dry-run fixtures for the 12 AI Tools / Creative Graphics tools. The fixtures prove that each tool has a synthetic input shape, private artifact expectation, QA checklist, worker envelope boundary, and Track A handoff expectation before any generated/local fixture work begins.

## Scope

- Workstream owner: `AI_TOOLS_CREATIVE_GRAPHICS`
- Tools covered: Remotion, D3.js, Three.js, PixiJS, Anime.js, Lottie-web, SVG.js, Apache ECharts, Vega/Vega-Lite, Viz.js/Graphviz, Satori, and `@resvg/resvg-js`
- Fixture evidence: static JSON specs and Markdown examples only
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## Fixture Philosophy

The dry-run pack uses synthetic inputs only. Inputs must be derived from placeholders for structured agent findings, edit intents, approved plan snapshots, timing context, style manifests, and fixture-specific synthetic content.

Expected outputs are private artifact plans, not artifacts. Each output points to placeholders for a private artifact manifest, private GCS path, Supabase artifact record, checksum, and approved plan snapshot.

Signed URLs are never source of truth. Public artifacts remain blocked until a later delivery policy, retention/delete controls, abuse controls, visibility rules, user approval, and QA gates exist.

## Blocked Runtime

GD-2 must not execute tools, workers, providers, models, render/export, browser capture, media processing, Docker/Cloud Run, Supabase lifecycle commands, SQL, Google Cloud, Secret Manager, Stripe, deployment, or runtime unlock actions.

Raw prompt execution must not become direct worker execution. The future path remains:

`user/chat request -> structured agent findings -> edit intents -> approved plan snapshot -> scoped tool-call manifest -> worker execution after unlock gates`

## Dry-Run Pass Criteria

- All 12 fixture JSON specs exist and parse.
- Every fixture uses `AI_TOOLS_CREATIVE_GRAPHICS` as owner.
- Every fixture uses synthetic inputs only.
- Every fixture includes private artifact, GCS path, Supabase artifact record, checksum, and approved plan snapshot placeholders.
- Every fixture blocks raw prompt worker execution, signed URL source-of-truth, public artifacts, final delivery without Track A validation, provider fallback without approval, and production/beta unlock.
- Every fixture keeps Supabase classification as docs/status only.
- Track A receives only handoff fields, not final render/export authority.

## Dry-Run Fail Criteria

- A fixture references real user data, real media URLs, signed URLs, public URLs, real GCS paths, secrets, or Secret Manager values.
- A fixture claims tool execution, render/export, worker execution, provider/model execution, browser capture, media processing, Docker/Cloud Run execution, Supabase mutation, SQL execution, or runtime unlock.
- A fixture claims ownership of map/geospatial, sound/music/audio, Track A final render/export, Track B media processing, provider gateway, worker runtime, Stripe/billing, or production/beta unlock.

Recommended next prompt: `Prompt GD-3 - Creative Graphics Generated/Local Fixture Candidate Pack`.
