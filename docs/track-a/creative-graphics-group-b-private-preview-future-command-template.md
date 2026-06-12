# Creative Graphics Group B Private Preview Future Command Template

Prompt: `TRACKA-GD-GROUPB-HANDOFF-2`

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_3`

Status: `future_group_b_command_template_ready_blocked_until_handoff_3`

These are conceptual placeholders for a future `TRACKA-GD-GROUPB-HANDOFF-3` prompt only. They are not approved commands for this prompt.

Every command block includes the required approval warning. The template uses only these placeholders:

- `<GROUP_B_PRIVATE_PREVIEW_RUN_ID>`
- `<SOURCE_EVIDENCE_LOCKFILE>`
- `<GROUP_B_PRIVATE_PREVIEW_MANIFEST>`
- `<LOCAL_OUTPUT_DIR>`
- `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>`

No real GCS path, signed URL, public URL, Supabase row, Secret Manager value, or credential appears here.

## Preflight Template

```sh
DO NOT RUN UNTIL TRACKA-GD-GROUPB-HANDOFF-3 EXECUTION APPROVAL EXISTS.
tracka-groupb-private-preview-preflight --run-id <GROUP_B_PRIVATE_PREVIEW_RUN_ID> --source-lockfile <SOURCE_EVIDENCE_LOCKFILE> --manifest <GROUP_B_PRIVATE_PREVIEW_MANIFEST> --approved-plan-snapshot <APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>
```

## Local Private Composition Template

```sh
DO NOT RUN UNTIL TRACKA-GD-GROUPB-HANDOFF-3 EXECUTION APPROVAL EXISTS.
tracka-groupb-private-preview-compose --run-id <GROUP_B_PRIVATE_PREVIEW_RUN_ID> --source-lockfile <SOURCE_EVIDENCE_LOCKFILE> --manifest <GROUP_B_PRIVATE_PREVIEW_MANIFEST> --local-output-dir <LOCAL_OUTPUT_DIR>
```

## QA Evidence Template

```sh
DO NOT RUN UNTIL TRACKA-GD-GROUPB-HANDOFF-3 EXECUTION APPROVAL EXISTS.
tracka-groupb-private-preview-qa --run-id <GROUP_B_PRIVATE_PREVIEW_RUN_ID> --manifest <GROUP_B_PRIVATE_PREVIEW_MANIFEST> --local-output-dir <LOCAL_OUTPUT_DIR>
```

## Cleanup Template

```sh
DO NOT RUN UNTIL TRACKA-GD-GROUPB-HANDOFF-3 EXECUTION APPROVAL EXISTS.
tracka-groupb-private-preview-cleanup --run-id <GROUP_B_PRIVATE_PREVIEW_RUN_ID> --manifest <GROUP_B_PRIVATE_PREVIEW_MANIFEST> --local-output-dir <LOCAL_OUTPUT_DIR>
```

## Boundary Status

Group B private preview generation: `group_b_private_preview_not_executed`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
