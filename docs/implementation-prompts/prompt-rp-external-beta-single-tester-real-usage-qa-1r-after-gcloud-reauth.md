# RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1R-AFTER-GCLOUD-REAUTH

Use after `RP-EXTERNAL-BETA-SINGLE-TESTER-REAL-USAGE-QA-1` records `blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa`.

Also require the current-base QWEN transport blocker from `RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1` to be closed or intentionally rechecked: `blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r`.

Before route readback, run the operator helper from `RP-EXTERNAL-BETA-OPERATOR-GCLOUD-AUTH-PREFLIGHT-1`:

```bash
REEDITPRO_CONFIRM_EXTERNAL_BETA_OPERATOR_GCLOUD_AUTH_PREFLIGHT=true npm run rp-external-beta-operator-gcloud-auth-preflight-1
```

Proceed only if it returns `completed_operator_gcloud_user_and_adc_auth_preflight_ready_for_single_tester_qa_and_qwen_dispatch_retry`.

## Goal

Retry the bounded real-usage QA pass for the approved single tester `aiediting@reeditpro.com` after interactive gcloud reauthentication refreshes the active account.

## Required Gate

Run only after:

- `gcloud auth login` has refreshed `aiediting@reeditpro.com`;
- `gcloud config get-value account` returns `aiediting@reeditpro.com`;
- `REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_REAL_USAGE_QA=true` is explicitly set for the retry command.

## Allowed Scope

Only run:

```bash
REEDITPRO_CONFIRM_EXTERNAL_BETA_SINGLE_TESTER_REAL_USAGE_QA=true npm run rp-external-beta-single-tester-real-usage-qa-1
```

The retry may perform authenticated staging `GET` readback for `/`, `/dashboard`, `/projects`, `/editor`, `/api/runtime/status`, `/api/routes`, and static JS/CSS assets. It must not use POST, upload media, mutate Google Group membership, mutate IAM, update Cloud Run, deploy, run Supabase, run SQL, call providers/models, dispatch workers, process media, create signed URLs, create public artifacts, spend credits, or unlock production.

## Outcome

If the retry passes, update the existing real-usage QA docs/results/PR body to `completed_single_tester_real_usage_qa_authenticated_staging_readback`.

If the retry fails, keep the exact blocker and keep the PR draft.
