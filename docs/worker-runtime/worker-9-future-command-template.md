# WORKER-9 Future Command Template

templateState: `placeholder_only_do_not_run`

These commands are templates for WORKER-10 only. They are not approved for WORKER-9.

```sh
DO NOT RUN UNTIL WORKER-10 EXECUTION APPROVAL EXISTS.
WORKER_10_RUN_ID=<WORKER_10_RUN_ID> \
WORKER_FIXTURE_DIR=<WORKER_FIXTURE_DIR> \
OFFLINE_CLAIM_LEASE_OUTPUT_DIR=<OFFLINE_CLAIM_LEASE_OUTPUT_DIR> \
WORKER_JOB_PAYLOAD_FIXTURE=<WORKER_JOB_PAYLOAD_FIXTURE> \
CLAIM_LEASE_NOOP_FIXTURE=<CLAIM_LEASE_NOOP_FIXTURE> \
npm run worker:runtime-controlled-job-claim-lease:execute -- --offline --noop
```

```sh
DO NOT RUN UNTIL WORKER-10 EXECUTION APPROVAL EXISTS.
WORKER_10_RUN_ID=<WORKER_10_RUN_ID> \
WORKER_FIXTURE_DIR=<WORKER_FIXTURE_DIR> \
OFFLINE_CLAIM_LEASE_OUTPUT_DIR=<OFFLINE_CLAIM_LEASE_OUTPUT_DIR> \
npm run worker:runtime-controlled-job-claim-lease:diagnostics
```

The placeholders above are intentionally not real GCS paths, signed URLs, public URLs, secrets, Supabase refs, worker queue IDs, or deployment targets.
