# Creative Graphics Private Preview Future Command Template

Prompt: `TRACKA-GD-HANDOFF-2`

Status: `future_command_template_ready_blocked_until_handoff_3`

Production capability enabled: `none; Track A controlled private preview execution packet only`

## Command Template Rules

These are placeholders for a future `TRACKA-GD-HANDOFF-3` prompt only. They are not approved commands for this prompt.

Every command block includes the required approval warning. The template uses only these placeholders:

- `<PRIVATE_PREVIEW_RUN_ID>`
- `<SOURCE_LOCKFILE>`
- `<PRIVATE_PREVIEW_MANIFEST>`
- `<LOCAL_OUTPUT_DIR>`
- `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>`

No real GCS path, signed URL, public URL, Supabase row, Secret Manager value, or credential appears here.

## Preflight Template

```sh
DO NOT RUN UNTIL TRACKA-GD-HANDOFF-3 EXECUTION APPROVAL EXISTS.
tracka-private-preview-preflight --run-id <PRIVATE_PREVIEW_RUN_ID> --source-lockfile <SOURCE_LOCKFILE> --manifest <PRIVATE_PREVIEW_MANIFEST> --approved-plan-snapshot <APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>
```

## Local Private Composition Template

```sh
DO NOT RUN UNTIL TRACKA-GD-HANDOFF-3 EXECUTION APPROVAL EXISTS.
tracka-private-preview-compose --run-id <PRIVATE_PREVIEW_RUN_ID> --source-lockfile <SOURCE_LOCKFILE> --manifest <PRIVATE_PREVIEW_MANIFEST> --local-output-dir <LOCAL_OUTPUT_DIR>
```

## QA Evidence Template

```sh
DO NOT RUN UNTIL TRACKA-GD-HANDOFF-3 EXECUTION APPROVAL EXISTS.
tracka-private-preview-qa --run-id <PRIVATE_PREVIEW_RUN_ID> --manifest <PRIVATE_PREVIEW_MANIFEST> --local-output-dir <LOCAL_OUTPUT_DIR>
```

## Cleanup Template

```sh
DO NOT RUN UNTIL TRACKA-GD-HANDOFF-3 EXECUTION APPROVAL EXISTS.
tracka-private-preview-cleanup --run-id <PRIVATE_PREVIEW_RUN_ID> --manifest <PRIVATE_PREVIEW_MANIFEST> --local-output-dir <LOCAL_OUTPUT_DIR>
```

## Boundary Status

Private preview generation: `private_preview_not_executed`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

