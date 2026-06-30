# QWEN Real Dispatch Auth Path Readback

Packet: `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-AUTH-PATH-READBACK-1`

Decision: `blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r`

Execution: `completed_auth_path_readback_no_runtime_invocation`

## Readback

- Current account: `aiediting@reeditpro.com`
- Current project: `reeditpro`
- Target service: `reeditpro-staging-api`
- Target region: `us-central1`
- User credential token probe: `blocked_reauthentication_required`
- ADC token probe: `blocked_reauthentication_required`
- Noninteractive token environment: `absent`
- Cloud Run service describe after token probe: `not_run_token_probe_blocked`
- Cloud Run invocation: `false`
- identity token fetch: `false`
- QWEN2.5-VL execution: `false`
- worker dispatch: `false`

The user credential path failed before token issuance with:

`Reauthentication failed. cannot prompt during non-interactive execution.`

The application-default credential path failed before token issuance with:

`Reauthentication failed. cannot prompt during non-interactive execution.`

## Required Closure Before Retry

`QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH` may proceed only after one approved noninteractive auth path is present:

- refreshed local `gcloud` user credentials for `aiediting@reeditpro.com` that can print an access token without prompting;
- refreshed application-default credentials that can print an access token without prompting; or
- an explicitly approved ephemeral token/identity path supplied to the guarded runner without printing, persisting, or committing the token.

If the auth path still fails, the 1R retry must stop before Cloud Run service discovery, identity token fetch, runtime route invocation, QWEN execution, worker dispatch, Supabase mutation, SQL, or artifact creation.

