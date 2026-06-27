# RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1

Plan a guarded Cloud Run private invite IAM grant only after `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1`.

Required source evidence:

- `controlled_external_beta_private_invite_access_policy_ready`
- service-level `allUsers` invoker binding: `false`
- service-level `allAuthenticatedUsers` invoker binding: `false`
- unauthenticated access remains `blocked_403`
- authenticated health/readiness smoke passed

Required owner input before execution:

- exact invited identity list or approved Google Group;
- explicit confirmation gate;
- rollback command;
- post-grant authenticated smoke plan;
- public-access negative check.

This next packet may grant Cloud Run invoker only to explicitly approved identities or an explicitly approved group. It must not grant `allUsers`, grant `allAuthenticatedUsers`, create public artifacts, create signed URL source-of-truth, run providers, run workers, mutate Supabase, run SQL, process media, enable paid billing, unlock production, or run final delivery/export.
