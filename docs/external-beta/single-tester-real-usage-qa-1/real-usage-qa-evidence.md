# Real Usage QA Evidence

Packet: `RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1`

Decision: `completed_single_tester_real_usage_qa_authenticated_staging_readback`

Execution: `completed_guarded_authenticated_single_tester_real_usage_qa_readonly`

Run ID: `single-tester-real-usage-qa-1-2026-06-30T02-02-22-270Z-1629c2ff`

Output directory: `/tmp/reeditpro-rp-external-beta-single-tester-real-usage-qa-1/single-tester-real-usage-qa-1-2026-06-30T02-02-22-270Z-1629c2ff`

## Sanitized Evidence

- active gcloud account: `aiediting@reeditpro.com`
- active gcloud account matches approved tester: `true`
- Cloud Run service readback: `passed`
- Cloud Run service: `reeditpro-staging-api`
- Cloud Run region: `us-central1`
- Cloud Run ready status: `True`
- Cloud Run latest ready revision: `reeditpro-staging-api-00006-6gw`
- Cloud Run traffic: `100_percent_reeditpro-staging-api-00006-6gw`
- QWEN transport current-base blocker: `blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r`
- operator gcloud auth preflight helper: `completed_operator_gcloud_auth_preflight_helper_ready_no_runtime_invocation`
- prior operator auth preflight attempt: `blocked_gcloud_user_reauthentication_required`
- prior operator auth preflight run ID: `2026-06-30T01-45-56-932Z-1ef24f39`
- latest operator auth preflight attempt: `completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry`
- latest operator auth preflight run ID: `2026-06-30T02-01-10-237Z-03964b88`
- active account/project readback: `aiediting@reeditpro.com` / `reeditpro`
- user access token probe: `passed`
- ADC access token probe: `passed`
- unauthenticated `/`: `403`
- authenticated `/`: `200`
- authenticated `/dashboard`: `200`
- authenticated `/projects`: `200`
- authenticated `/editor`: `200`
- authenticated `/api/runtime/status`: `200`
- authenticated `/api/routes`: `200`
- route map total routes: `117`
- route map mock-ready routes: `0`
- required product route IDs present: `true`
- authenticated static asset fetches: `2`
- static asset `/assets/index-BNzAkO71.js`: status `200`, bytes `2195193`
- static asset `/assets/index-B2pxQajw.css`: status `200`, bytes `151867`

## Artifacts

- `single-tester-real-usage-qa-1-report.json`: bytes `4630`, SHA-256 `261d23a9651587511d1c30f980a819b651924878d3a163d884ec87fe874e2c99`
- `single-tester-real-usage-qa-1-manifest.json`: bytes `488`, SHA-256 `578184b3adcb96cd9b9a7f84f5c7a3b3b5d3de91cb30b4fef9205c21a761871e`
- `single-tester-real-usage-qa-1-checksums.json`: bytes `669`, SHA-256 `012e755f16d0a2f5a818576e89f7fa69d20fa99bb9d8ba74cb72f390e94c81a4`
- `operator-gcloud-auth-preflight-report.json`: bytes `2427`, SHA-256 `aa2b21bef41ccd8d321391a224bf7419a2c9cec0259000e5dbcf86f72330468f`
- `operator-gcloud-auth-preflight-manifest.json`: bytes `982`, SHA-256 `7eba8f232ff07154d6698abd137db640329b003d06c13255845d2530a4226250`

Generated artifacts committed: `none`
