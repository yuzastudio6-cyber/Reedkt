# RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1 Source Audit

Packet: `RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1`

Current decision: `blocked_pending_actual_external_tester_account_membership_and_tester_auth_smoke`

Execution in this packet: `completed_guarded_tester_account_smoke_runner_prep_no_access_mutation`

Integration base: `27308ae7d628028f3ce743c81e1e26d7450fb748`

## Source Chain

- `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST` created owner-managed group `external-beta-testers@reeditpro.com` and granted only that group `roles/run.invoker` on staging service `reeditpro-staging-api`.
- `RP-EXTERNAL-BETA-OWNER-MEMBER-SMOKE-READBACK-1` proved the owner-member group path but recorded external tester member count `0`.
- `RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-GATE-READBACK-1` re-read the live gate and recorded blocker `blocked_pending_actual_external_tester_account_membership_and_tester_auth_smoke`.
- PR #577 remains open/draft/blocked/excluded and is not source-of-truth for this external beta tester gate.

## Current Packet Scope

This packet adds the guarded runner for the future tester-account smoke. It does not add a tester, does not change Cloud Run IAM, does not deploy, and does not run the smoke in this phase.

The runner fails closed unless:

1. `REEDITPRO_CONFIRM_EXTERNAL_BETA_TESTER_ACCOUNT_SMOKE=true` is set.
2. `REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL` names a valid non-owner tester account.
3. That tester account is visible as a member of `external-beta-testers@reeditpro.com`.
4. The active `gcloud` account is the same tester account.
5. The staging Cloud Run IAM policy still grants invoker only through `group:external-beta-testers@reeditpro.com` and has no broad public invoker grant.

## Future Success Decision

Future confirmed runner success may record `completed_external_beta_tester_account_membership_and_authenticated_smoke`.

Current product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`
