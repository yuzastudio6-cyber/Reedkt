# Creative Graphics Group B Next Private Preview Prompt

Prompt: `TRACKA-GD-GROUPB-HANDOFF-1`

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_2`

## Recommended Next Prompt

`TRACKA-GD-GROUPB-HANDOFF-2 - Group B Private Preview Execution Packet`

Use when Group B planning remains ready with warnings and the next step is to prepare a controlled execution packet. Allowed scope should remain packet/readiness work unless the future prompt explicitly approves local/private execution. Blocked scope must continue to include Group B tool execution, Lottie browser/player behavior, Remotion render/export, uploads, signed URLs, public artifacts, Supabase mutation, SQL, GCP/Secret Manager, workers, providers/models, and beta/production unlocks.

Required evidence:

- Group B private preview composition plan.
- Fixture layout/timing plan.
- Manifest template.
- QA plan.
- Missing metadata remediation record.
- Execution gate record with all approval booleans false.
- Failure/rollback/cleanup plan.

## Fix Prompt

`TRACKA-GD-GROUPB-HANDOFF-1A - Group B Private Preview Planning Fixes`

Use if diagnostics, CI, or review finds missing docs, missing Group B tool rows, unsafe claims, or inconsistent status terms.

## Parallel Workstream Prompt

`GD-11 - Group C Package Runtime Review and Fixture Gate`

Use when the team wants to continue AI Tools creative graphics work for Group C while Track A Group B private preview remains in planning.

## Status

Runtime chain: `group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_not_executed`

Capability: `none; Track A Group B creative graphics private preview composition plan only`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`

## TRACKA-GD-GROUPB-HANDOFF-2 Next Private Preview Prompt Update

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_3`

Packet status: `group_b_private_preview_execution_packet_ready_with_warnings`

Runtime chain: `group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_execution_packet_ready_with_warnings / group_b_private_preview_not_executed`

## Recommended Next Prompt

`TRACKA-GD-GROUPB-HANDOFF-3 - Group B Private Preview Execution`

Use only when a future prompt explicitly approves controlled Group B private preview execution and verifies source evidence, source evidence lockfile, manifest placeholders, approved plan snapshot placeholder, QA packet, and cleanup packet. Group B private preview execution remains not approved in Handoff-2.

Required Handoff-2 packet evidence:

- Group B private preview execution packet.
- Source evidence lockfile.
- Future command template.
- Execution manifest template.
- QA packet.
- Cleanup/rollback packet.
- Go/no-go record with all approval booleans false.

## Fix Prompt

`TRACKA-GD-GROUPB-HANDOFF-2A - Group B Execution Packet Fixes`

Use if diagnostics, CI, or review finds missing docs, missing Group B tool rows, unsafe claims, command-template warning gaps, or inconsistent status terms.

## Parallel Workstream Prompt

`GD-11 - Group C Package Runtime Review and Fixture Gate`

Use when the team wants to continue AI Tools creative graphics work for Group C while Track A Group B private preview remains packet-ready with warnings.

Capability: `none; Track A Group B creative graphics private preview execution packet only`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## TRACKA-GD-GROUPB-HANDOFF-3 Next Private Preview Prompt Update

Decision state: `group_b_private_preview_local_passed_with_warnings`

## Recommended Next Prompt

`TRACKA-GD-GROUPB-HANDOFF-4 - Group B Private Preview QA Review`

Use when the next step is a static QA review of the Handoff-3 Group B local/private evidence summaries for `anime_js_motion`, `lottie_web_overlays`, and `remotion_graphics`.

## Fix Prompt

`TRACKA-GD-GROUPB-HANDOFF-3A - Group B Private Preview Execution Fix`

Use if diagnostics, CI, or review finds missing Handoff-3 evidence summaries, inconsistent source verification, unsafe claims, or local output checksum mismatch records.

Capability: `none; Track A Group B creative graphics private preview execution only`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## TRACKA-GD-GROUPB-HANDOFF-4 Next Private Preview Prompt Update

QA result: `group_b_private_preview_qa_passed_with_warnings`

Readiness: `ready_with_warnings_for_group_b_controlled_private_sample_plan`

## Recommended Next Prompt

`TRACKA-GD-GROUPB-HANDOFF-5 - Group B Controlled Private Sample Planning`

Use when the next step is a planning-only controlled private sample packet for `anime_js_motion`, `lottie_web_overlays`, and `remotion_graphics`.

## Fix Prompt

`TRACKA-GD-GROUPB-HANDOFF-4A - Group B Private Preview QA Fixes`

Use if diagnostics, CI, or review finds missing Handoff-4 QA docs, missing false approval booleans, inconsistent Handoff-3 evidence references, unsafe claims, or missing tracker references.

## Parallel Workstream Prompt

`GD-11 - Group C Package Runtime Review and Fixture Gate`

Use when the team wants to continue AI Tools creative graphics work for `pixijs_canvas_graphics` and `three_js_visuals`.

Runtime unlock status: `group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_execution_packet_ready_with_warnings / group_b_private_preview_local_passed_with_warnings / group_b_private_preview_qa_passed_with_warnings`

Context tools: `svg_js_vector_graphics`, `resvg_js_svg_rasterization`, `pixijs_canvas_graphics`, `three_js_visuals`

CROSS-BETA-0 remains `blocked_pending_workstream_gates`.

Group B private sample execution is not approved.
Group B private preview execution is not approved in this QA review.
Internal beta is not approved.
External beta is not approved.
Production is not approved.
Final render/export is not approved.
Remotion final render is not approved.
Lottie browser/player behavior is not approved.
Public artifacts are not approved.
Signed URLs are not approved.
Supabase mutation is not approved.
Worker execution is not approved.
Provider/model calls are not approved.

Capability: `none; Track A Group B creative graphics private preview QA review only`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

Source of truth policy: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`
Signed URLs are not source of truth.
