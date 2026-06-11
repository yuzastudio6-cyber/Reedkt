# Creative Graphics Group B Next Handoff Prompt

Prompt: `TRACKA-GD-GROUPB-HANDOFF-0`

Handoff result: `tracka_groupb_handoff_ready_with_warnings`

Runtime chain: `group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_not_executed`

## Recommended Prompt

`TRACKA-GD-GROUPB-HANDOFF-1 - Private Preview Composition Plan for Group B Creative Graphics Fixtures`

Use when Track A is ready to plan, but not execute, a private preview composition path for the three accepted-with-warnings Group B evidence lanes.

Allowed scope:

- Inspect this handoff packet.
- Plan private preview composition inputs.
- Define source-of-truth placeholders.
- Define QA, observability, cleanup, and blocker handling for future execution.

Blocked scope:

- Group B tool execution.
- Lottie browser/player rendering.
- Remotion render/export.
- Track A render/export.
- Workers, providers, models, browser capture, media processing, Supabase, SQL, Google Cloud, Secret Manager, uploads, signed URLs, public artifacts, dependency mutation, beta, or production.

Required evidence:

- `anime_js_motion.motion-timing.json` summary.
- `lottie_web_overlays.manifest-only.json` summary.
- `remotion_graphics.manifest-only.json` summary.
- Metadata checklist from `docs/track-a/creative-graphics-group-b-missing-metadata-checklist.md`.

## Fallback Prompt

`GD-10A - Group B Fixture Evidence Fixes`

Use if the handoff review or diagnostics fail, or if future planning needs stronger source evidence before Track A can proceed.

Allowed scope:

- Fix committed GD-10 evidence summaries.
- Improve metadata documentation.
- Keep execution blocked unless separately approved.

Blocked scope:

- Tool execution, render/export, uploads, signed URLs, Supabase/SQL, GCP/Secret Manager, beta, or production.

## Parallel Future Prompt

`GD-11 - Group C Package Runtime Review and Fixture Gate`

Use when AI Tools creative graphics work pivots to PixiJS and Three.js Group C package/runtime review.

Allowed scope:

- Group C package/runtime review and future gate documentation.

Blocked scope:

- Group C execution, Track A render/export, workers, providers/models, Supabase/SQL, storage upload, signed URL delivery, beta, or production.

## Status

Fully accepted fixtures: none.

Accepted with warnings: `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`.

Rejected/blocked fixtures: none.

Capability: `none; Track A Group B creative graphics handoff review only`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
