# Internal Tester Profile Workspace Provisioning

## Decision

`internal_tester_profile_workspace_provisioning_gate_passed_ready_for_manual_staging_workflow`

## Purpose

The sign-in page can authenticate against the staging Supabase project when a tester account exists. The remaining testability gap is profile/workspace readiness: if current RLS allows browser bootstrap, the app can create those rows from the anon client; if RLS blocks those writes, the browser correctly returns `backend_required`.

This packet adds a backend-only manual staging workflow for that gap. It provisions a signed-in tester's `profiles`, `workspaces`, and `workspace_members` rows with the Supabase service-role key held only in GitHub Actions secrets.

## Operator Flow

1. Run **Internal Tester Profile Workspace Provisioning** from GitHub Actions.
2. Set `confirm_internal_tester_provisioning` to `PROVISION_REEDITPRO_INTERNAL_TESTER`.
3. Set `allow_staging_writes` to `true`.
4. Provide the tester email.
5. Optionally provide display/workspace names.
6. If the Auth user does not already exist, set `invite_if_missing` to `true`; otherwise the workflow fails closed and asks for Auth user creation first.
7. After the workflow succeeds, sign in at `https://yuzastudio6-cyber.github.io/Reedkt/sign-in`.

The CLI output is sanitized JSON. It prints an email hash, user id, profile id, workspace id, and membership id, but it does not print service-role keys, passwords, raw signed URLs, or invite links.

## Schema Compatibility

The workflow supports both profile identity shapes already accepted by the browser bootstrap:

- `profiles.user_id = auth.users.id`
- `profiles.id = auth.users.id`

The default workspace membership role is `owner`. Existing profile, workspace, and membership rows are reused instead of duplicated.

## Safety Boundary

This is a staging-only operator workflow. It does not add a public API, frontend secret, Vite secret, Supabase migration, schema mutation, storage upload, signed URL, provider call, worker dispatch, tool execution, media processing, render/export, credit reservation, credit spend, Stripe billing, external beta unlock, or production unlock.

The service-role secret remains backend-only in GitHub Actions. The deployed static app continues to use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Next Gate

`INTERNAL_TESTER_SIGN_IN_AUTH_READBACK`
