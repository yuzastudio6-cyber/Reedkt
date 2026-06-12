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
