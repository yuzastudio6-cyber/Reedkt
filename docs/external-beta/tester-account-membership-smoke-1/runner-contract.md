# Guarded Runner Contract

Package script: `rp-external-beta-tester-account-membership-smoke-1`

Runner: `scripts/validation/rp-external-beta-tester-account-membership-smoke-1.mjs`

## Required Command

```bash
REEDITPRO_CONFIRM_EXTERNAL_BETA_TESTER_ACCOUNT_SMOKE=true \
REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL=<tester@example.com> \
npm run rp-external-beta-tester-account-membership-smoke-1
```

## Fail-Closed Blockers

- `blocked_pending_external_beta_tester_account_smoke_confirmation`
- `blocked_missing_valid_non_owner_external_tester_email`
- `blocked_group_membership_readback_failed`
- `blocked_pending_actual_external_tester_account_membership`
- `blocked_cloud_run_iam_readback_failed`
- `blocked_cloud_run_group_invoker_binding_missing`
- `blocked_broad_cloud_run_invoker_binding_present`
- `blocked_cloud_run_service_readback_failed`
- `blocked_cloud_run_service_not_ready`
- `blocked_gcloud_auth_readback_failed`
- `blocked_tester_auth_context_not_active`
- `blocked_tester_identity_token_unavailable`
- `blocked_tester_authenticated_smoke_request_failed`
- `blocked_unauthenticated_health_not_forbidden`
- `blocked_tester_authenticated_health_failed`
- `blocked_tester_authenticated_ready_failed`
- `blocked_tester_authenticated_runtime_status_failed`

## Allowed Runtime Scope

When explicitly confirmed, the runner may perform:

- read-only Cloud Identity group membership readback;
- read-only Cloud Run IAM policy readback;
- read-only Cloud Run service status readback;
- active `gcloud` account readback;
- tester identity-token creation without printing or persisting the token;
- safe staging API `GET` smoke for `/health`, `/ready`, and `/api/runtime/status`;
- unauthenticated `/health` check, which must remain `403`.

The runner never adds group members, changes IAM, updates Cloud Run, deploys, touches Supabase, runs SQL, creates signed/public artifacts, runs workers, processes media, or unlocks production.
