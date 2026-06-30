# RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1-CONFIRMED-RUN

Run only after the native staging API route backend-handoff bridge has been merged and deployed to staging, and after `RP-EXTERNAL-BETA-QWEN-NATIVE-API-AUTH-CONTEXT-BRIDGE-1` provides verified application user context for the native API route.

Required gates:

- `REEDITPRO_CONFIRM_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE=true`
- `REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_COLD_START_RETRY=true`

Run:

```bash
REEDITPRO_CONFIRM_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE=true \
npm run rp-external-beta-qwen2-5-vl-approved-snapshot-job-orchestration-runtime-fixture-1
```

Scope:

- Bounded approved-snapshot structured metadata fixture only.
- No arbitrary user media.
- No public artifacts.
- No production unlock.
- Restore fail-closed Cloud Run service/job settings after the run.
- Commit only sanitized report/manifest/checksum summaries, never `/tmp` artifacts.
