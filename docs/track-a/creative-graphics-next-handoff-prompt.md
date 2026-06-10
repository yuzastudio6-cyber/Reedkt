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

## TRACKA-GD-HANDOFF-2 - Controlled Private Preview Composition Execution Packet

Use only after TRACKA-GD-HANDOFF-1 gates pass and Track A is ready for a separately approved controlled private preview prompt.

Allowed future scope:

- controlled private preview composition for `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, and `viz_graphviz_diagrams`
- private manifest/checksum/source-of-truth validation
- private preview QA evidence

Blocked scope:

- final render/export
- public artifacts
- signed URLs
- storage upload unless separately approved
- Supabase mutation
- SQL
- worker/provider/model/tool execution beyond the approved Handoff-2 scope
- production/beta unlock

Required evidence:

- `private_preview_composition_plan_ready_with_warnings`
- accepted private preview manifest template
- approved plan snapshot reference
- confirmed output frame
- safe-zone/readability/data/graph QA plan
- cleanup/rollback owner

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

## TRACKA-GD-HANDOFF-3 Result Addendum

Result: `blocked_pending_source_artifacts`

Use `TRACKA-GD-HANDOFF-3A - Source Artifact Preservation Fix` next. The accepted fixture evidence docs exist, but the clean Handoff-3 worktree did not contain the ignored GD-7-Retry SVG source files under `.local-artifacts/`.

Accepted fixtures checked:

- `satori_social_cards`
- `d3_dataviz`
- `echarts_dataviz`
- `vega_lite_dataviz`
- `viz_graphviz_diagrams`

Excluded fixtures/tools remain:

- `svg_js_vector_graphics`
- `resvg_js_svg_rasterization`
- `anime_js_motion`
- `lottie_web_overlays`
- `remotion_graphics`
- `pixijs_canvas_graphics`
- `three_js_visuals`

Source of truth policy: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

Signed URLs are not source of truth.

Production capability enabled: `none; Track A controlled private preview execution only`
Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## TRACKA-GD-HANDOFF-2 Packet Addendum

Status: `private_preview_execution_packet_ready`

Decision state: `ready_for_tracka_gd_handoff_3_controlled_private_preview_execution`

Private preview status: `private_preview_not_executed`

Use `TRACKA-GD-HANDOFF-3 - Controlled Private Preview Composition Execution` only after this packet remains valid and Handoff-3 grants its own execution approval.

Accepted fixtures locked for the packet:

- `satori_social_cards`
- `d3_dataviz`
- `echarts_dataviz`
- `vega_lite_dataviz`
- `viz_graphviz_diagrams`

Excluded fixtures/tools remain:

- `svg_js_vector_graphics`
- `resvg_js_svg_rasterization`
- `anime_js_motion`
- `lottie_web_overlays`
- `remotion_graphics`
- `pixijs_canvas_graphics`
- `three_js_visuals`

Source of truth policy: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

Signed URLs are not source of truth.

Handoff-2 execution approval now: false

Future execution prompt required: true

Production capability enabled: `none; Track A controlled private preview execution packet only`
Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
