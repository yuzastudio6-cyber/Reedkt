# QWEN Real Dispatch Dry-Run Attempt 1R Transport Readback

Packet: `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-DRY-RUN-ATTEMPT-1R-AFTER-GCLOUD-REAUTH`

Decision: `completed_qwen_real_dispatch_dry_run_attempt_1r_after_gcloud_reauth_transport_readback`

Execution: `completed_authenticated_transport_metadata_readback_no_runtime_invocation`

Confirmation gate: `REEDITPRO_CONFIRM_QWEN_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH=true`

Run ID: `2026-06-30T02-20-45-545Z-8324b215`

Output directory: `/tmp/reeditpro-rp-external-beta-qwen-real-dispatch-dry-run-attempt-1r-after-gcloud-reauth/2026-06-30T02-20-45-545Z-8324b215`

## Auth Readback

- Current account: `aiediting@reeditpro.com`
- Current project: `reeditpro`
- User access-token probe: `passed`
- Application-default credential token probe: `passed`
- Token value printed: `false`
- Token value persisted in repo: `false`
- Token temp files deleted: `true`

## Service Metadata Readback

Read-only metadata commands:

```bash
gcloud run services describe reeditpro-staging-api --project=reeditpro --region=us-central1 --format=json(...)
gcloud run services describe reeditpro-qwen2-5-vl-l4-worker --project=reeditpro --region=us-central1 --format=json(...)
```

Staging API service readback:

- Service: `reeditpro-staging-api`
- Ready: `True`
- Latest ready revision: `reeditpro-staging-api-00006-6gw`
- Traffic: `100_percent_reeditpro-staging-api-00006-6gw`
- URL host: `reeditpro-staging-api-4wkjiqvdqa-uc.a.run.app`

QWEN worker service readback:

- Service: `reeditpro-qwen2-5-vl-l4-worker`
- Ready: `True`
- Latest ready revision: `reeditpro-qwen2-5-vl-l4-worker-00037-658`
- Traffic: `100_percent_reeditpro-qwen2-5-vl-l4-worker-00037-658`
- URL host: `reeditpro-qwen2-5-vl-l4-worker-4wkjiqvdqa-uc.a.run.app`

Runtime invocation still blocked: `true`

QWEN2.5-VL execution: `false`

Worker dispatch: `false`

Identity token fetch: `false`

Request sent: `false`

Cloud Run invocation: `false`
