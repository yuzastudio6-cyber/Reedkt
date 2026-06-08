# Creative Graphics Generated/Local Fixture Candidate Pack

Status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / generated_local_fixture_not_executed`

Production capability enabled: `none; AI Tools creative graphics generated/local fixture candidate pack only`

## Purpose

GD-3 prepares generated/local fixture candidates for the 12 AI Tools / Creative Graphics tools. The candidates describe what a future generated/local fixture should produce, how private artifact manifests should look, what QA evidence must be captured, and how Track A would receive a private handoff after later gates approve execution.

## Scope

- Workstream owner: `AI_TOOLS_CREATIVE_GRAPHICS`
- Tools covered: Remotion, D3.js, Three.js, PixiJS, Anime.js, Lottie-web, SVG.js, Apache ECharts, Vega/Vega-Lite, Viz.js/Graphviz, Satori, and `@resvg/resvg-js`
- Candidate evidence: static JSON manifests and Markdown templates only
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## Dry-Run Vs Generated/Local Candidate

The GD-2 dry-run fixture describes a safe synthetic input and expected private artifact shape. The GD-3 generated/local candidate describes the next static gate: expected local artifact placeholders, private GCS placeholders, Supabase artifact record placeholders, checksum placeholders, QA evidence template references, and Track A handoff candidate references.

GD-3 does not create actual generated files. It does not execute tools, render media, upload artifacts, transfer storage, create signed URLs, or validate pixels.

## Candidate Philosophy

Every candidate uses synthetic inputs only. Every expected output is a private artifact plan with placeholders for local path, private GCS path, Supabase artifact record, checksum, approved plan snapshot, QA evidence, and Track A handoff. Signed URLs are never source of truth, and public artifacts remain blocked.

## Pass Criteria

- All 12 candidate JSON files exist and parse.
- Every candidate maps to its GD-2 source dry-run fixture.
- Every candidate uses owner `AI_TOOLS_CREATIVE_GRAPHICS`.
- Every candidate includes local artifact path, private GCS path, Supabase artifact record, checksum, QA evidence, approved plan snapshot, and Track A handoff placeholders.
- Every candidate keeps raw prompt worker execution, signed URL source-of-truth, public artifact, final delivery without Track A validation, provider fallback without approval, and production/beta unlock blocked.
- Supabase classification remains docs-only.

## Fail Criteria

- Any candidate references a real local artifact path, real GCS path, public URL, signed URL, secret, raw project ref, or Secret Manager value.
- Any candidate claims an actual generated artifact, upload, storage transfer, tool execution, worker execution, provider/model call, render/export, browser capture, media processing, Docker/Cloud Run execution, Supabase mutation, SQL execution, runtime unlock, or beta/production unlock.
- Any candidate claims ownership of map/geospatial, sound/music/audio, Track A final render/export, Track B media processing, provider gateway, worker runtime, Stripe/billing, or production/beta unlock.

Recommended next prompt: `Prompt GD-4 - Creative Graphics Static Validation and Fixture Gate Review`.
