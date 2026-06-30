# RP-EXTERNAL-BETA-OPERATOR-GCLOUD-AUTH-PREFLIGHT-1

Run only after the operator has refreshed local gcloud user and ADC credentials for `aiediting@reeditpro.com` / `reeditpro`.

Command:

```bash
REEDITPRO_CONFIRM_EXTERNAL_BETA_OPERATOR_GCLOUD_AUTH_PREFLIGHT=true npm run rp-external-beta-operator-gcloud-auth-preflight-1
```

Success result:

`completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry`

If the command passes, the next guarded milestones are:

- `RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1R-AFTER-GCLOUD-REAUTH`
- `QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH`

Do not run Cloud Run invocation, QWEN execution, worker dispatch, Supabase mutation, SQL, Secret Manager payload access, signed/public artifacts, media processing, broad external beta expansion, or production unlock from this preflight.
