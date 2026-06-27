# Controlled Private Invite Access Policy

Packet: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1`

Decision: `completed_controlled_private_invite_access_policy_no_access_mutation`

External beta access model: `authenticated_private_invite_only`

Invite access readiness: `ready_for_explicit_invite_iam_grant_planning`

Required before any access grant:

- explicit invited identity list;
- exact target service `reeditpro-staging-api`;
- exact project `reeditpro`;
- exact region `us-central1`;
- explicit confirmation gate;
- rollback command;
- post-grant authenticated smoke for each invited identity class;
- public access negative check;
- no provider/model/worker/media execution during access validation.

Allowed future access path:

- Cloud Run invoker grant to explicitly approved identities or approved group only;
- no `allUsers`;
- no `allAuthenticatedUsers`;
- no broad public access;
- no anonymous preview/export route;
- no signed URL source-of-truth;
- no public bucket or public artifact.

Blocked in this phase:

- IAM grant mutation;
- invite email sending;
- app user creation;
- Supabase mutation;
- SQL execution;
- service-role route execution;
- worker dispatch or worker execution;
- provider/model calls;
- media processing;
- paid billing;
- production unlock;
- final delivery/export.

Next milestone: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1`
