# RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST

Run only after `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1` and only when the source includes an exact invited identity list or exact approved Google Group.

Required input:

- exact invited user identity or exact Google Group;
- target service `reeditpro-staging-api`;
- project `reeditpro`;
- region `us-central1`;
- explicit confirmation gate;
- rollback command for each exact principal;
- post-grant authenticated smoke plan;
- public-access negative check.

Allowed execution:

- grant Cloud Run `roles/run.invoker` only to the exact approved identity or group;
- run post-grant authenticated health/readiness/runtime-status smoke only;
- run unauthenticated negative check.

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

If the identity list is still missing, keep the packet blocked with `blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant`.
