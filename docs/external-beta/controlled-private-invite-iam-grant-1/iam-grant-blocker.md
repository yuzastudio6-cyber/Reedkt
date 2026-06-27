# IAM Grant Blocker

Packet: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1`

Decision: `blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant`

External beta readiness: `blocked_pending_explicit_invite_identity_for_controlled_private_access_grant`

Private invite IAM grant: `not_run_missing_explicit_identity_list`

Cloud Run IAM mutation: `not_run`

Cloud Run service update: `not_run`

Deployment: `not_run`

Public access grant: `false`

`allUsers` grant: `false`

`allAuthenticatedUsers` grant: `false`

Required before any future grant:

- exact invited user identity or exact approved Google Group;
- exact target service `reeditpro-staging-api`;
- exact project `reeditpro`;
- exact region `us-central1`;
- explicit confirmation gate;
- rollback command for every granted principal;
- post-grant authenticated smoke for the approved invited principal class;
- public-access negative check proving unauthenticated access remains blocked;
- confirmation that no provider/model/worker/media route runs during invite validation.

Allowed future grant shape:

- `roles/run.invoker` for explicitly approved user identity or group only.

Forbidden grant shape:

- `allUsers`;
- `allAuthenticatedUsers`;
- any broad public principal;
- any wildcard or inferred tester audience.

Because the current source does not contain an approved identity or group, this phase must remain docs/status/diagnostics only.
