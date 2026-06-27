# RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST

Status: completed by `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST`.

Decision: `completed_controlled_private_invite_iam_grant_for_owner_managed_group`.

Execution: `completed_cloud_identity_group_creation_and_staging_cloud_run_invoker_grant`.

Approved Google Group: `external-beta-testers@reeditpro.com`.

Cloud Run IAM member: `group:external-beta-testers@reeditpro.com`.

Target service: `reeditpro-staging-api` / `us-central1`.

Future work should add or remove external beta testers by Google Group membership, then run tester-account smoke. Do not broaden Cloud Run IAM.

Completed input:

- exact approved Google Group: `external-beta-testers@reeditpro.com`;
- target service `reeditpro-staging-api`;
- project `reeditpro`;
- region `us-central1`;
- rollback command for the exact group principal;
- post-grant authenticated smoke;
- public-access negative check.

Required carry-forward evidence:

- service-level `allUsers` invoker binding: `false`;
- service-level `allAuthenticatedUsers` invoker binding: `false`;
- project-level `roles/run.invoker` `allUsers` member count: `0`;
- project-level `roles/run.invoker` `allAuthenticatedUsers` member count: `0`;
- project-level broad inherited Cloud Run invoker access: `false`.

Completed execution:

- enabled `cloudidentity.googleapis.com`;
- created owner-managed security group `external-beta-testers@reeditpro.com`;
- granted Cloud Run `roles/run.invoker` only to `group:external-beta-testers@reeditpro.com`;
- ran post-grant authenticated health/readiness/runtime-status smoke only;
- ran unauthenticated negative check.

Forbidden execution:

- no `allUsers`;
- no `allAuthenticatedUsers`;
- no broad public principal;
- no guessed tester identity;
- no Supabase mutation;
- no SQL execution;
- no Secret Manager payload access unless a later prompt explicitly authorizes it;
- no provider/model call;
- no worker execution;
- no media processing;
- no signed/public artifact creation;
- no paid billing;
- no production unlock;
- no final delivery/export.

If future tester access is needed, add the tester to `external-beta-testers@reeditpro.com` and run tester-account smoke. Do not add `allUsers`, `allAuthenticatedUsers`, domain-wide principals, production service IAM grants, provider/model calls, worker execution, media processing, signed/public artifacts, paid billing, production unlock, or final delivery/export.
