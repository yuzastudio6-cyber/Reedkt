# Creative Graphics Future Execution Command Templates

Status: `execution_plan_ready / execution_not_approved`

These are conceptual command templates only. The GD-4 base contains GD diagnostics and planning docs, but no approved GD runtime execution script. GD-5 therefore records future command shapes as placeholders only.

## Single Tool Fixture Template

```text
DO NOT RUN UNTIL GD EXECUTION APPROVAL EXISTS.
<TOOL_ID> <FIXTURE_ID> <APPROVED_PLAN_SNAPSHOT_PLACEHOLDER> <PRIVATE_ARTIFACT_SCOPE_PLACEHOLDER> <LOCAL_OUTPUT_DIR_PLACEHOLDER>
```

## Group Fixture Template

```text
DO NOT RUN UNTIL GD EXECUTION APPROVAL EXISTS.
<TOOL_ID> <FIXTURE_ID> <APPROVED_PLAN_SNAPSHOT_PLACEHOLDER> <PRIVATE_ARTIFACT_SCOPE_PLACEHOLDER> <LOCAL_OUTPUT_DIR_PLACEHOLDER>
```

## QA Evidence Template

```text
DO NOT RUN UNTIL GD EXECUTION APPROVAL EXISTS.
<TOOL_ID> <FIXTURE_ID> <APPROVED_PLAN_SNAPSHOT_PLACEHOLDER> <PRIVATE_ARTIFACT_SCOPE_PLACEHOLDER> <LOCAL_OUTPUT_DIR_PLACEHOLDER>
```

Template rules:

- Use placeholders only.
- Do not use real GCS paths.
- Do not use signed URLs.
- Do not use secrets.
- Do not use real user data.
- Do not execute from GD-5.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
