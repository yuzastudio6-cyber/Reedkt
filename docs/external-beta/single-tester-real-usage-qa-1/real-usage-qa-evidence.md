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

Generated artifacts committed: `none`
