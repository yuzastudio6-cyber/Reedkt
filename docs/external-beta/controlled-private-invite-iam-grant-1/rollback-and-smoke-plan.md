# Rollback And Smoke Plan

Packet: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1`

Current execution: `completed_docs_only_iam_grant_blocker_review_no_access_mutation`

Current blocker: `blocked_pending_explicit_invited_identity_list_for_guarded_iam_grant`

Future rollback requirement:

- A future grant packet must include a concrete rollback command for each exact granted principal.
- The rollback must remove only the explicit invite principal.
- The rollback must never target broad Cloud Run IAM policy replacement unless a separate emergency approval exists.

Future smoke requirement:

- authenticated `/health` for the approved principal class;
- authenticated `/ready` for the approved principal class;
- authenticated `/api/runtime/status` for the approved principal class;
- unauthenticated access negative check remains `blocked_403`;
- runtime remains `mock` / `mockOnly: true`;
- provider real calls remain disabled;
- no worker, provider, Supabase, SQL, media, billing, production, or final export path runs.

Current status:

- rollback command executed: `not_run_missing_explicit_identity_list`
- post-grant smoke executed: `not_run_missing_explicit_identity_list`
- public access negative check rerun in this phase: `not_run_no_access_mutation`

Next milestone: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-IAM-GRANT-1R-AFTER-IDENTITY-LIST`
