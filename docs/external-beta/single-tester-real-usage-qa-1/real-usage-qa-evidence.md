# Real Usage QA Evidence

Packet: `RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1`

Decision: `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa`

Execution: `blocked_gcloud_reauth_no_staging_route_readback`

Run ID: `single-tester-real-usage-qa-1-2026-06-29T17-28-02-156Z-04217aaf`

Output directory: `/tmp/reeditpro-rp-external-beta-single-tester-real-usage-qa-1/single-tester-real-usage-qa-1-2026-06-29T17-28-02-156Z-04217aaf`

## Sanitized Evidence

- active gcloud account: `aiediting@reeditpro.com`
- active gcloud account matches approved tester: `true`
- Cloud Run service readback: `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa`
- QWEN transport current-base blocker: `blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r`
- operator gcloud auth preflight helper: `completed_operator_gcloud_auth_preflight_helper_ready_no_runtime_invocation`
- latest operator auth preflight attempt: `blocked_gcloud_user_reauthentication_required`
- latest operator auth preflight run ID: `2026-06-30T01-45-56-932Z-1ef24f39`
- active account/project readback: `aiediting@reeditpro.com` / `reeditpro`
- user access token probe: `blocked_gcloud_user_reauthentication_required`
- ADC access token probe: `not_run_user_token_blocked`
- unauthenticated `/`: `not_run_gcloud_reauth_blocker`
- authenticated `/`: `not_run_gcloud_reauth_blocker`
- authenticated `/dashboard`: `not_run_gcloud_reauth_blocker`
- authenticated `/projects`: `not_run_gcloud_reauth_blocker`
- authenticated `/editor`: `not_run_gcloud_reauth_blocker`
- authenticated `/api/runtime/status`: `not_run_gcloud_reauth_blocker`
- authenticated `/api/routes`: `not_run_gcloud_reauth_blocker`
- required product route IDs present: `false`
- authenticated static asset fetches: `not_run_gcloud_reauth_blocker`

## Artifacts

- `single-tester-real-usage-qa-1-report.json`: bytes `4254`, SHA-256 `4e8da2c42a7ec76b0caf6d2589981f772bcbe1fc2d63ff40f20a9ff63bab0416`
- `single-tester-real-usage-qa-1-manifest.json`: bytes `488`, SHA-256 `900c296cf713f57b10c418e4e45b56ca3123443e0c829a183c52076ec276d085`
- `single-tester-real-usage-qa-1-checksums.json`: bytes `669`, SHA-256 `aa9f144154c99a1115fbd098c0a9479c1c689039bb30c22a1da8df438f5b9503`
- `operator-gcloud-auth-preflight-report.json`: bytes `2388`, SHA-256 `15a3a68656bf70fa56e20372e8c0c7ee15cda6d539a1c69507661755f83f5814`
- `operator-gcloud-auth-preflight-manifest.json`: bytes `639`, SHA-256 `6111b14a5b17adcfd3108f691cbb758aa6efef6419c2bb2191aa86c1085d66bf`

Generated artifacts committed: `none`
