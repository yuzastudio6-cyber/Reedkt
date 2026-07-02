# Auth Profile Workspace Bootstrap

## Status

RP-FIX-06 adds a frontend-safe auth/profile/workspace bootstrap implementation layer. It does not deploy Supabase migrations, run remote commands, add credentials, create service-role routes, or build full auth pages.

The implementation targets the active RP-DATA-04 migration set:

- `profiles`
- `workspaces`
- `workspace_members`
- `projects`

Older RP-DB-03 migrations and review docs use `user_profiles`. That legacy table name is documented and preserved as a compatibility alias only; new bootstrap code uses `profiles`.

## Schema Findings

| Area | Finding |
| --- | --- |
| Auth table | `auth.users` is assumed to be Supabase-owned and is not created by app migrations. |
| Active profile table | `profiles`, with `id`, `user_id`, `display_name`, `avatar_url`, `metadata_json`, `created_at`, and `updated_at`. |
| Legacy profile table | `user_profiles`, from older RP-DB-03 migrations. It uses `id` as the auth user id and includes `email`, `default_workspace_id`, and `metadata`. |
| Workspace table | `workspaces`, active shape uses `owner_id` referencing `auth.users(id)`. Legacy shape used `owner_user_id` referencing `user_profiles(id)`. |
| Membership table | `workspace_members`; no active `workspace_memberships` table was found. |
| Roles | Active RP-DATA-04 migration stores role as text. Legacy migrations define `workspace_role` enum with `owner`, `admin`, `editor`, `viewer`, and `client_reviewer`. |
| Projects | Active `projects` uses `workspace_id` and `owner_id`. Legacy `projects` used `created_by` referencing `user_profiles(id)`. |
| Project members | No separate `project_members` table was found; project access derives from workspace membership. |
| RLS helpers | Active helpers include `is_workspace_member`, `is_workspace_owner_or_admin`, `is_project_member`, and `is_project_editor`. Legacy helpers include `has_workspace_role`. |
| Bootstrap trigger | No `handle_new_auth_user()` function or trigger on `auth.users` was found. |

## Bootstrap Flow

The frontend-safe flow is:

1. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist.
2. Get the current Supabase session.
3. Get the current Supabase user.
4. Select or create a row in `profiles` where `user_id = auth.uid()`.
5. Select existing `workspace_members` rows for the user.
6. If none exist, create a default `workspaces` row with `owner_id = auth.uid()`.
7. Ensure an owner row in `workspace_members`.
8. Store current workspace context in `profiles.metadata_json.current_workspace_id` when RLS allows, with localStorage as a browser fallback.

If public Supabase env values are missing, the flow returns `not_configured` and does not crash. If the user is not signed in, it returns `signed_out`.

## RLS Considerations

The active RLS policy allows a user to insert their own `profiles` row and update their own safe profile fields. It also allows workspace insert when `owner_id = auth.uid()`. Membership creation may be allowed after workspace ownership is visible through `is_workspace_owner_or_admin`.

If any insert/update is blocked by RLS, RP-FIX-06 returns `backend_required` warnings instead of using service-role credentials in browser code.

## Frontend-Safe Operations

Browser code may:

- create and reuse the Supabase anon client;
- read the current auth session and user;
- sign in, sign up, and sign out;
- select/insert/update rows only when RLS allows it;
- store non-secret current workspace context locally.

Browser code must not:

- use `SUPABASE_SERVICE_ROLE_KEY`;
- use `SUPABASE_ACCESS_TOKEN`;
- use `SUPABASE_DB_PASSWORD`;
- create admin clients;
- bypass RLS;
- execute provider, billing, rendering, upload, or worker operations.

## Gaps

- Full auth pages are still not implemented.
- No backend service-role API exists for profile/workspace creation when RLS blocks frontend writes.
- No auth trigger exists for automatic profile creation.
- No remote Supabase migration has been run or verified.
- Storage/upload planning is partially fixed by RP-FIX-07, but real uploads and signed media delivery still require deployed storage policies and backend runtime support.
- Production RLS behavior still needs local/staging Supabase validation.
