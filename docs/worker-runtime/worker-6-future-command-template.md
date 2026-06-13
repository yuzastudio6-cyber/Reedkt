# WORKER-6 Future Command Template

templateState: `placeholder_only_do_not_run`

These commands are templates for WORKER-7 only. They are not approved for WORKER-6.

```sh
DO NOT RUN UNTIL WORKER-7 EXECUTION APPROVAL EXISTS.
WORKER_7_RUN_ID=<WORKER_7_RUN_ID> \
WORKER_FIXTURE_DIR=<WORKER_FIXTURE_DIR> \
OFFLINE_NOOP_OUTPUT_DIR=<OFFLINE_NOOP_OUTPUT_DIR> \
APPROVED_PLAN_SNAPSHOT_FIXTURE=<APPROVED_PLAN_SNAPSHOT_FIXTURE> \
WORKER_JOB_PAYLOAD_FIXTURE=<WORKER_JOB_PAYLOAD_FIXTURE> \
SCOPED_TOOL_CALL_MANIFEST_REF=<SCOPED_TOOL_CALL_MANIFEST_REF> \
npm run worker:runtime-controlled-noop:execute -- --offline --noop
```

```sh
DO NOT RUN UNTIL WORKER-7 EXECUTION APPROVAL EXISTS.
WORKER_7_RUN_ID=<WORKER_7_RUN_ID> \
OFFLINE_NOOP_OUTPUT_DIR=<OFFLINE_NOOP_OUTPUT_DIR> \
npm run worker:runtime-controlled-noop:diagnostics
```

The placeholders above are intentionally not real GCS paths, signed URLs, public URLs, secrets, Supabase refs, or deployment targets.
