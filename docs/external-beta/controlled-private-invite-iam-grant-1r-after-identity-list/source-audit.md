# RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST Source Audit

Decision: `completed_controlled_private_invite_iam_grant_for_owner_managed_group`

Execution: `completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant`

External product beta readiness: `ready_for_owner_managed_external_beta_tester_membership_addition`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Source Chain

- `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1` recorded the private invite/access policy and no public service-level Cloud Run invoker bindings.
- `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1` blocked correctly because no exact identity or approved Google Group existed in source.
- `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-INHERITANCE-AUDIT-1` confirmed no broad inherited project-level Cloud Run invoker access.
- This 1R packet created the dedicated owner-managed Google security group `external-beta-testers@reeditpro.com`, granted only that group `roles/run.invoker` on `reeditpro-staging-api` in `us-central1`, and verified authenticated staging smoke.

## Live Target

- Google Cloud project: `reeditpro`
- Organization: `reeditpro.com`
- Cloud Identity customer: `C00me6220`
- Cloud Run service: `reeditpro-staging-api`
- Cloud Run region: `us-central1`
- Staging API URL: `https://reeditpro-staging-api-4wkjiqvdqa-uc.a.run.app`
- Supabase target carried forward: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

## Invite Principal

Approved Google Group: `external-beta-testers@reeditpro.com`

IAM member: `group:external-beta-testers@reeditpro.com`

Group class: Google security group with discussion forum label.

Group resource: `groups/0279ka651g62ifo`

Membership model: owner-managed. Future external beta testers should be added to this group rather than broadening Cloud Run IAM or using `allUsers`, `allAuthenticatedUsers`, a domain-wide principal, or production service access.

## Exclusions

#577 remains open/draft/blocked and excluded as source-of-truth.

This packet does not approve public access, production access, paid production, public artifacts, signed URL source-of-truth, final delivery/export, provider/model calls, workers, media processing, Supabase mutation, SQL execution, or broad service-role handlers.
