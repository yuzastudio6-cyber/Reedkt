# RP-EXTERNAL-BETA-OWNER-MEMBER-SMOKE-READBACK-1 Source Audit

Decision: `completed_owner_member_group_access_smoke_readback_external_tester_membership_still_pending`

Execution: `completed_readonly_group_membership_readback_and_owner_member_authenticated_smoke`

Integration base: `998cfd1367dade30800eb46988fe8aa5cdcce511`

## Source Chain

- `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST` is merged at `998cfd1367dade30800eb46988fe8aa5cdcce511`.
- Staging Cloud Run service: `reeditpro-staging-api`.
- Staging Cloud Run region: `us-central1`.
- Staging Cloud Run URL: `https://reeditpro-staging-api-4wkjiqvdqa-uc.a.run.app`.
- Approved owner-managed Google Group: `external-beta-testers@reeditpro.com`.
- Google Group resource: `groups/0279ka651g62ifo`.
- Staging IAM binding: `roles/run.invoker` for `group:external-beta-testers@reeditpro.com`.
- PR #577 remains open/draft/blocked/excluded.

## Membership Readback

Read-only Cloud Identity membership readback found one current member:

- `aiediting@reeditpro.com`
- roles: `OWNER`, `MEMBER`

External tester member count observed in this packet: `0`.

The current owner-member account proves the group/IAM/authenticated staging path. It does not prove an independent external tester account has been added or smoked.

## Readiness

External product beta readiness: `ready_for_actual_external_tester_account_addition_and_smoke`.

Product-ready end-to-end local OSS tools: `0`.

Package-lock: `unchanged`.

Generated artifacts committed: `none`.
