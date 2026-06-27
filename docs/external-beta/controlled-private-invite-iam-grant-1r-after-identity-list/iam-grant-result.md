# Controlled Private Invite IAM Grant Result

Decision: `completed_controlled_private_invite_iam_grant_for_owner_managed_group`

Execution: `completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant`

## Completed Actions

1. Enabled `cloudidentity.googleapis.com` on project `reeditpro` to support owner-managed Google Group discovery and creation.
2. Confirmed no existing Google discussion or security group was returned for the customer before creation.
3. Created security group `external-beta-testers@reeditpro.com`.
4. Granted `roles/run.invoker` to `group:external-beta-testers@reeditpro.com` on Cloud Run service `reeditpro-staging-api` in `us-central1`.
5. Verified service-level Cloud Run IAM readback shows exactly the group invoker binding and no public invoker principal.

## IAM Readback

- Service-level role: `roles/run.invoker`
- Service-level member: `group:external-beta-testers@reeditpro.com`
- `allUsers`: `false`
- `allAuthenticatedUsers`: `false`
- Domain-wide principal: `false`
- Project-wide user/group/domain Cloud Run invoker inheritance: `false`
- Production service IAM mutation: `false`

## Access Posture

Controlled external beta access is now routed through an owner-managed group. Adding or removing beta testers should happen by group membership management, not by modifying Cloud Run service IAM for each user.

The current grant is staging-only and service-only. It does not apply to `reeditpro-api`, workers, production services, GCS buckets, Supabase, Secret Manager, provider/model routes, or billing systems.
