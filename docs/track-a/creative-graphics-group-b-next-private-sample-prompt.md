# Creative Graphics Group B Next Private Sample Prompt

Prompt: `TRACKA-GD-GROUPB-HANDOFF-4`

Decision state: `ready_with_warnings_for_group_b_controlled_private_sample_plan`

QA result: `group_b_private_preview_qa_passed_with_warnings`

## Recommended Next Prompt

`TRACKA-GD-GROUPB-HANDOFF-5 - Group B Controlled Private Sample Planning`

Use when the next step is planning only for a controlled private sample that references the Handoff-3 Group B private preview evidence summaries for:

- `anime_js_motion`
- `lottie_web_overlays`
- `remotion_graphics`

## Required Inputs For Handoff-5

- Handoff-3 source verification result: `group_b_source_evidence_verified`
- Handoff-3 private preview result: `group_b_private_preview_local_passed_with_warnings`
- Handoff-4 QA result: `group_b_private_preview_qa_passed_with_warnings`
- Warning disposition for Anime.js, Lottie-web, and Remotion.
- Approved plan snapshot placeholder.
- Source-of-truth placeholders.
- Cleanup and rollback plan.

## Blocked Scope For Handoff-5 Unless Explicitly Changed

- Group B private sample execution.
- Anime.js re-execution.
- Lottie browser/player behavior.
- Remotion render/export.
- Final render/export.
- Public artifacts.
- Signed URLs.
- Supabase mutation and SQL.
- Google Cloud and Secret Manager access.
- Worker/provider/model execution.
- Internal beta, external beta, and production unlock.

## Fallback Prompt

`TRACKA-GD-GROUPB-HANDOFF-4A - Group B Private Preview QA Fixes`

Use if diagnostics, CI, or review finds missing Group B tool rows, unsafe claims, inconsistent Handoff-3 evidence references, or missing false approval booleans.

## Parallel Prompt

`GD-11 - Group C Package Runtime Review and Fixture Gate`

Use if the team wants to continue AI Tools creative graphics coverage while the Group B Track A sample lane remains planning-only.

Runtime unlock status: `group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_execution_packet_ready_with_warnings / group_b_private_preview_local_passed_with_warnings / group_b_private_preview_qa_passed_with_warnings`

Full internal beta remains `blocked_pending_workstream_gates`.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
