# Internal Tester Google Profile/Workspace Provisioning

## Decision

`google_first_same_sha_profile_workspace_provisioning_source_ready_remote_staging_write_not_run`

## Purpose

This is the bounded backend-only bridge between a real first Google login and ReEditPro's authenticated private API. It can create or reuse the staging tester's profile, workspace, and owner membership only after Supabase Admin readback proves all three of these facts:

- the protected tester email maps to an existing Auth user;
- that user has a Google provider identity and confirmed email;
- a valid `last_sign_in_at` proves a prior Auth sign-in occurred.

The Admin record does not attribute `last_sign_in_at` to a provider. The preceding owner-interactive verifier is the separate evidence that the observed browser session used Google; this backend check deliberately does not claim otherwise.

The workflow cannot create or invite an Auth user. It accepts no password, invite redirect, token, or raw tester email as a workflow input.

## Exact Operator Sequence

1. Activate the reviewed private gateway and deploy the same-SHA signed-in Pages app.
2. Pass the credential-free Google-session readiness workflow.
3. Run the owner-local interactive verifier once. Complete Google directly. If `/v1/projects` is blocked because the user has no workspace yet, keep the emitted 16-character `expectedEmailHash`; the successful Google identity still creates the prerequisite Auth user.
4. Store the same address as protected staging-environment secret `STAGING_INTERNAL_TESTER_EMAIL`.
5. Run **Internal Tester Google Profile Workspace Provisioning** from the exact reviewed branch and SHA. Enter the hash from step 3 and explicitly approve bounded staging writes.
6. Run **Internal Tester Google Auth Readback** for the same SHA and hash.
7. Rerun `npm run internal-testing:verify-interactive-google-session`. It must now pass exact callback, Google identity, reload, private-gateway `/v1/projects` readback, sign-out, and post-sign-out route denial.

## Write Boundary

The service-role key exists only in the protected `staging` GitHub environment. The CLI looks up the already-signed-in Google user, then probes the existing `workspaces` ownership contract before writing. Because the legacy table can contain a later backfilled `owner_id` while its original `owner_user_id` remains required, `owner_user_id` takes precedence when present; the direct-Auth `owner_id` contract is selected only when the legacy owner column is absent. It uses one matching identity shape for the whole attempt instead of mixing the parallel foundations. It creates or reuses only:

- `profiles` when the workspace owns direct Auth users, or one legacy `user_profiles` row when the deployed workspace contract still owns legacy profiles;
- one existing or new owned `workspaces` row;
- one idempotent `workspace_members` owner row.

It never mirrors one user into both profile tables. Unknown schema or mutation errors fail instead of silently switching identity contracts. An unrelated workspace membership is never accepted as the tester's workspace. A pass requires a workspace whose owner column identifies the tester and an `owner` membership linking that same tester and workspace. If a prior attempt created that workspace before membership insertion failed, a retry reuses it instead of blindly creating another.

The raw migration directory remains `blocked_by_parallel_foundations`. This compatibility bootstrap is for controlled staging evidence only; it does not establish a canonical production schema, prove RLS, or authorize migration execution.

## Confidentiality

The workflow input contains only the short email hash. The raw email and service-role key remain environment secrets, and default display/workspace names do not derive from the email local-part. CLI output contains hashed user/profile/workspace/membership identifiers and booleans, never the raw email, raw IDs, password, token, invitation, signed URL, or service-role value.

## Current State

The source workflow is prepared on `codex/backend-workflow-pipeline-continuation`. It has not been pushed or dispatched, and no remote Supabase read or write occurred in this slice.

## Blocked Scope

No Auth-user creation/invitation, migration, schema change, Storage action, upload, provider call, tool/worker execution, render/export, credit/wallet mutation, Stripe/customer billing, public delivery, external beta, or production action is authorized.

## Next Gate

`SAME_SHA_GOOGLE_TESTER_AUTH_READBACK_THEN_OWNER_INTERACTIVE_GATEWAY_RETRY`
