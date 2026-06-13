# WORKER-3 Future Command Template

These templates are placeholders for a future WORKER-4 prompt only. They must not be run during WORKER-3.

```text
DO NOT RUN UNTIL WORKER-4 EXECUTION APPROVAL EXISTS.
WORKER_4_RUN_ID=<WORKER_4_RUN_ID>
WORKER_FIXTURE_DIR=<WORKER_FIXTURE_DIR>
SCOPED_TOOL_CALL_MANIFEST_REF=<SCOPED_TOOL_CALL_MANIFEST_REF>
OFFLINE_OUTPUT_DIR=<OFFLINE_OUTPUT_DIR>
APPROVED_PLAN_SNAPSHOT_FIXTURE=<APPROVED_PLAN_SNAPSHOT_FIXTURE>
WORKER_JOB_PAYLOAD_FIXTURE=<WORKER_JOB_PAYLOAD_FIXTURE>
npm run worker:runtime-offline-dry-run -- --run-id <WORKER_4_RUN_ID> --fixture-dir <WORKER_FIXTURE_DIR> --manifest <SCOPED_TOOL_CALL_MANIFEST_REF> --output-dir <OFFLINE_OUTPUT_DIR> --approved-plan <APPROVED_PLAN_SNAPSHOT_FIXTURE> --payload <WORKER_JOB_PAYLOAD_FIXTURE>
```

```text
DO NOT RUN UNTIL WORKER-4 EXECUTION APPROVAL EXISTS.
npm run worker:runtime-offline-dry-run:qa -- --run-id <WORKER_4_RUN_ID> --output-dir <OFFLINE_OUTPUT_DIR> --manifest <SCOPED_TOOL_CALL_MANIFEST_REF>
```

No real GCS paths, signed URLs, public URLs, secret names, secret payloads, provider endpoints, Supabase URLs, route handler paths, tool runtime paths, or worker runtime import paths are approved by this template.
