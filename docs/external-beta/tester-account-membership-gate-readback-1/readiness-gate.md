# Tester Account Membership Readiness Gate

Decision: `blocked_pending_actual_external_tester_account_membership_and_tester_auth_smoke`

Execution: `completed_readonly_tester_membership_gate_readback_no_access_mutation`

External product beta readiness: `ready_for_actual_external_tester_account_addition_and_smoke`

Tester-account path: `blocked_pending_actual_external_tester_account_membership_and_tester_auth_smoke`

## Cloud Run Access Boundary

- Staging service: `reeditpro-staging-api`
- Region: `us-central1`
- URL: `https://reeditpro-staging-api-4wkjiqvdqa-uc.a.run.app`
- Latest ready revision: `reeditpro-staging-api-00005-7gs`
- Traffic: `100_percent_latest_revision`
- Cloud Run service-level invoker member: `group:external-beta-testers@reeditpro.com`
- `allUsers` grant: `false`
- `allAuthenticatedUsers` grant: `false`
- Direct tester user grant: `false`

## Required Next Evidence

Before `RP-EXTERNAL-BETA-TESTER-ACCOUNT-MEMBERSHIP-SMOKE-1` can pass:

1. A real external tester account must be added to `external-beta-testers@reeditpro.com`.
2. The tester account must be visible in Cloud Identity membership readback.
3. The authenticated smoke token must belong to that tester account, not the owner-member account.
4. Safe authenticated `GET` smoke for `/health`, `/ready`, and `/api/runtime/status` must pass as that tester.
5. Unauthenticated `/health` must remain blocked.

## Still Blocked

Public access, broad audience access, production access, paid production, public artifacts, signed URL source-of-truth, provider/model execution, worker execution, final render/export, and broad media remain blocked.

Product-ready end-to-end local OSS tools: `0`
