# RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1 Results

Decision: `completed_single_tester_real_usage_qa_authenticated_staging_readback`

Execution: `completed_guarded_authenticated_single_tester_real_usage_qa_readonly`

Approved tester: `aiediting@reeditpro.com`

Active target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Active service: `reeditpro-staging-api`

Single-tester real usage QA: `qa_passed_authenticated_staging_readback`

Additional tester expansion: `blocked_no_additional_named_tester_list`

Next milestone: `RP-EXTERNAL-BETA-SINGLE-TESTER-FEEDBACK-ISSUE-FIX-1`

Post-#1692 source closure: branch updated after `RP-EXTERNAL-PRODUCT-TOOL-READINESS-AFTER-GPAC-DISPATCH-1` merged at `987dd4565bfa5cfedef74814fede477ae36a42d4`; real usage QA remains blocked pending gcloud reauthentication.

Post-#1738 current-base closure: branch updated after `RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1` merged at `daff6905af21d9623b14197a4c9a2d61eed47501`; QWEN transport dependencies are recorded on the current integration base, but real dispatch and single-tester route readback remain blocked by `blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r`.

Post-#1744 operator helper closure: branch updated after `RP-EXTERNAL-BETA-OPERATOR-GCLOUD-AUTH-PREFLIGHT-1` merged at `387678f5b884364f078a424ca47210b5eca27c19`; the guarded local auth preflight passed before the single-tester real-usage QA readback.

Prior operator auth preflight attempt `2026-06-30T01-45-56-932Z-1ef24f39`: `blocked_gcloud_user_reauthentication_required`. The active account/project readback was `aiediting@reeditpro.com` / `reeditpro`, but `gcloud auth print-access-token --quiet` failed before token issuance with `Reauthentication failed. cannot prompt during non-interactive execution.` No token value was printed or persisted, the temporary token file was deleted, ADC was not probed, and Cloud Run/QWEN/runtime paths were not invoked.

Latest operator auth preflight attempt `2026-06-30T02-01-10-237Z-03964b88`: `completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry`. User and ADC token probes passed; token values were not printed or persisted; temporary token files were deleted; Cloud Run/QWEN/runtime paths were not invoked by the preflight.

Guarded real-usage QA run `single-tester-real-usage-qa-1-2026-06-30T02-02-22-270Z-1629c2ff`: `completed_single_tester_real_usage_qa_authenticated_staging_readback`. The staging service `reeditpro-staging-api` in `us-central1` was `Ready=True` at revision `reeditpro-staging-api-00006-6gw` with `100_percent_reeditpro-staging-api-00006-6gw` traffic. Unauthenticated `/` returned `403`; authenticated `/`, `/dashboard`, `/projects`, `/editor`, `/api/runtime/status`, and `/api/routes` returned `200`; `/api/routes` reported `117` total routes with required product route IDs present; authenticated static JS/CSS asset fetches returned `200`.

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta broad unlock, external beta broad audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg/FFprobe execution, Docker execution, package installation, dependency mutation, package-lock mutation, group membership mutation, IAM mutation, Cloud Run deployment, Cloud Run service update, or broad service-role handler was enabled.
