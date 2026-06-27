# RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST Results

Decision: `completed_controlled_private_invite_iam_grant_for_owner_managed_group`

Execution: `completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant`

External product beta readiness: `ready_for_owner_managed_external_beta_tester_membership_addition`

Approved Google Group: `external-beta-testers@reeditpro.com`

Cloud Run IAM member: `group:external-beta-testers@reeditpro.com`

Cloud Run service: `reeditpro-staging-api`

Cloud Run region: `us-central1`

## Evidence

- Cloud Identity API: `enabled`
- Cloud Identity group: `groups/0279ka651g62ifo`
- Cloud Run IAM grant: `roles/run.invoker` on `reeditpro-staging-api` for `group:external-beta-testers@reeditpro.com`
- Unauthenticated `/health`: `403`
- Authenticated `/health`: `200`
- Authenticated `/ready`: `200`
- Authenticated `/api/runtime/status`: `200`
- Runtime mode: `mock`
- Provider real calls: `false`

## Remaining Boundaries

External beta is controlled and private through the owner-managed group. Add or remove external testers by Google Group membership. Do not grant `allUsers`, `allAuthenticatedUsers`, a domain-wide principal, production service access, public artifacts, signed URL source-of-truth, provider/model calls, worker execution, media processing, paid production, or final delivery/export.

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta broad unlock, external beta broad audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg/FFprobe execution, Docker execution, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled. This phase enabled `cloudidentity.googleapis.com`, created the owner-managed security group `external-beta-testers@reeditpro.com`, granted that group only `roles/run.invoker` on staging Cloud Run service `reeditpro-staging-api` in `us-central1`, and ran safe authenticated/unauthenticated staging API smoke checks.
