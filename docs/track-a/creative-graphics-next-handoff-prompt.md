# Creative Graphics Next Handoff Prompt

Prompt: `TRACKA-GD-HANDOFF-0`

Status: `tracka_handoff_ready_with_warnings`

Production capability enabled: `none; Track A creative graphics handoff review only`

## TRACKA-GD-HANDOFF-1 - Private Preview Composition Plan For Accepted Creative Graphics Fixtures

Use when Track A is ready to plan, but not execute, a private preview composition using the five accepted-with-warnings SVG fixtures.

Allowed scope:

- private preview composition plan
- layer placement plan
- safe-zone/readability checks as planning artifacts
- approved plan snapshot placeholder binding plan
- private artifact source-of-truth plan

Blocked scope:

- render/export execution
- preview generation
- uploads
- public artifacts
- signed URLs
- Supabase mutation
- SQL
- worker/provider/model/tool execution

Required evidence:

- accepted Track A handoff review
- fixture acceptance matrix
- local/private manifest summary
- QA summary
- approved plan snapshot placeholder

## GD-7A - Creative Graphics Fixture Evidence Fixes

Use when Track A decides the accepted-with-warnings fixture evidence is insufficient for private preview planning.

Allowed scope:

- fix or expand evidence docs
- add missing metadata summaries
- improve diagnostics

Blocked scope:

- new tool execution unless separately approved
- dependency mutation
- render/export
- uploads
- Supabase mutation
- SQL

Required evidence:

- specific missing metadata rows from `creative-graphics-missing-metadata-checklist.md`

## GD-9 - Group B Package Runtime Review And Fixture Gate

Use when Anime.js, Lottie-web, or Remotion fixture paths need package/runtime review.

Allowed scope:

- Group B package/runtime review
- import-only probes if separately approved
- fixture gate docs

Blocked scope:

- Track A final render/export
- worker execution
- provider/model execution
- public artifacts
- Supabase mutation
- SQL

Required evidence:

- GD-8 package runtime matrix
- GD-6 Group B `needs_package_review` state

## GD-8B - resvg Alternative Runtime Review

Use when rasterization remains required and `resvg_js_svg_rasterization` cannot proceed on the local Darwin runtime.

Allowed scope:

- package/runtime alternative review
- import-only or metadata-only probes if separately approved
- fallback boundary documentation

Blocked scope:

- production rasterization
- upload/storage transfer
- render/export
- public artifacts
- Supabase mutation
- SQL

Required evidence:

- GD-8A resvg probe evidence
- GD-7-Retry skipped/blocker record

## Boundary Status

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
