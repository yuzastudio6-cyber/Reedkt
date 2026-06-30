# Operator Gcloud Auth Preflight Contract

Packet: `RP-EXTERNAL-BETA-OPERATOR-GCLOUD-AUTH-PREFLIGHT-1`

Decision: `completed_operator_gcloud_auth_preflight_helper_ready_no_runtime_invocation`

The guarded local runner is:

`REEDITPRO_CONFIRM_EXTERNAL_BETA_OPERATOR_GCLOUD_AUTH_PREFLIGHT=true npm run rp-external-beta-operator-gcloud-auth-preflight-1`

## Checks

When explicitly confirmed, the runner checks only:

- `gcloud config get-value account`
- `gcloud config get-value project`
- `gcloud auth print-access-token --quiet` with token output written to a temporary file, checked for non-empty length, and deleted
- `gcloud auth application-default print-access-token --quiet` with token output written to a temporary file, checked for non-empty length, and deleted

## Success Decision

`completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry`

## Blockers

- `blocked_pending_operator_gcloud_auth_preflight_confirmation`
- `blocked_gcloud_cli_unavailable`
- `blocked_gcloud_account_or_project_mismatch`
- `blocked_gcloud_user_reauthentication_required`
- `blocked_gcloud_adc_reauthentication_required`

## Strict Exclusions

The runner must not describe or invoke Cloud Run, fetch identity tokens for the service audience, send HTTP requests, execute QWEN2.5-VL, dispatch workers, mutate Supabase, run SQL, read Secret Manager payloads, create signed/public artifacts, process media, unlock beta expansion, or unlock production.
