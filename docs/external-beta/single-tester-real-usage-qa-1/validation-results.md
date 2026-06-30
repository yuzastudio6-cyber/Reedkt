# Validation Results

Packet: `RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1`

Validation status: `passed_for_blocked_packet`

Post-#1692 source closure: `passed_for_blocked_packet_after_tool_readiness_reconciliation_merge`

Post-#1738 source closure: `passed_for_blocked_packet_after_qwen_transport_dependency_preflight_current_merge`

Post-#1744 source closure: `passed_for_blocked_packet_after_operator_gcloud_auth_preflight_helper_merge`

Validation:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_REAL_USAGE_QA=true npm run rp-external-beta-single-tester-real-usage-qa-1`
- `npm run --silent rp-external-beta-single-tester-active-lane-closure-1:diagnostics`
- `npm run --silent rp-external-beta-single-tester-real-usage-qa-1:diagnostics`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Observed result:

- dependency validation: `passed`
- diff check: `passed`
- lint: `passed`
- server typecheck: `passed`
- build: `passed`
- build:server: `passed`
- guarded real-usage QA attempt: `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa`
- QWEN transport current-base blocker: `blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r`
- operator gcloud auth preflight helper: `completed_operator_gcloud_auth_preflight_helper_ready_no_runtime_invocation`
- guarded operator gcloud auth preflight attempt: `blocked_gcloud_user_reauthentication_required`
- active-lane diagnostics: `passed`
- real-usage QA diagnostics: `passed`
- cached diff check: `passed`
- non-executing safety scans: `passed`
- post-#1692 diagnostics rerun: `passed`
- post-#1738 diagnostics rerun: `passed`

Blocker: `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa`

Operator auth blocker: `blocked_gcloud_user_reauthentication_required`

Attempted runtime command:

- `REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_REAL_USAGE_QA=true npm run rp-external-beta-single-tester-real-usage-qa-1`

Environment status:

- active gcloud account: `aiediting@reeditpro.com`
- active account matches approved tester: `true`
- Cloud Run service readback: `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa`
- operator auth preflight run ID: `2026-06-30T01-45-56-932Z-1ef24f39`
- operator auth preflight output directory: `/tmp/reeditpro-rp-external-beta-operator-gcloud-auth-preflight-1/2026-06-30T01-45-56-932Z-1ef24f39`
- user token probe: `blocked_gcloud_user_reauthentication_required`
- token value printed: `false`
- token temporary file deleted: `true`
- ADC token probe: `not_run_user_token_blocked`
- Cloud Run invocation: `false`
- QWEN2.5-VL execution: `false`

Merged source closure included on this branch:

- `RP-EXTERNAL-PRODUCT-TOOL-READINESS-AFTER-GPAC-DISPATCH-1`
- merge SHA `987dd4565bfa5cfedef74814fede477ae36a42d4`
- `RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1`
- merge SHA `daff6905af21d9623b14197a4c9a2d61eed47501`
- `RP-EXTERNAL-BETA-OPERATOR-GCLOUD-AUTH-PREFLIGHT-1`
- merge SHA `387678f5b884364f078a424ca47210b5eca27c19`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
