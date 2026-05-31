# Auth Profile Workspace RLS Test Plan

This is the Prompt 3 RLS/access validation plan for the canonical auth/profile/workspace/project boundary. It is local/staging test design unless explicitly run and recorded in `docs/prompt-03-validation-results.md`.

Do not run these checks against production in this milestone.

## Scope

Allowed tables:

- `auth.users`
- `profiles`
- `workspaces`
- `workspace_members`
- `projects`
- `audit_events` only for future sanitized audit checks

Blocked tables remain out of scope: chat, media, storage, planning, credits, jobs, workers, providers, render, QA, revisions, tools, SFX, StoryTiming, Stripe, and draft-only tables.

## Fixture Roles

Use disposable local/staging users only:

- user A: workspace owner
- user B: workspace member/editor/viewer variant
- user C: non-member
- service role: backend-only validation actor

## Profile Tests

| ID | Case | Expected result |
| --- | --- | --- |
| APW-RLS-01 | Authenticated user can select own `profiles` row. | Pass. One own row is visible. |
| APW-RLS-02 | Authenticated user cannot select another user's private profile row. | Pass. Other row is not visible through anon/auth user context. |
| APW-RLS-03 | Authenticated user can insert own profile through allowed path when RLS permits. | Pass only if `user_id = auth.uid()`. |
| APW-RLS-04 | Authenticated user cannot insert a profile for another `user_id`. | Blocked by RLS. |
| APW-RLS-05 | Authenticated user can update safe own profile fields. | Pass for `display_name` and `avatar_url`. |
| APW-RLS-06 | Service-role profile ensure returns safe summary only. | Pass. No service-role data, secrets, or raw auth token returned. |

## Workspace And Membership Tests

| ID | Case | Expected result |
| --- | --- | --- |
| APW-RLS-07 | Workspace owner can select own workspace. | Pass. |
| APW-RLS-08 | Workspace member can select assigned workspace. | Pass. |
| APW-RLS-09 | Non-member cannot select workspace. | Blocked or zero rows. |
| APW-RLS-10 | Owner/admin can manage allowed membership rows where policy permits. | Pass only for allowed roles. |
| APW-RLS-11 | Normal user cannot create privileged membership for another user. | Blocked by RLS. |
| APW-RLS-12 | Normal user cannot assign themselves owner/admin in another workspace. | Blocked by RLS. |
| APW-RLS-13 | Backend `workspaces.membership.check` returns `hasAccess: true` for member. | Pass. |
| APW-RLS-14 | Backend `workspaces.membership.check` returns no access for non-member. | Pass. |

## Project Access Tests

| ID | Case | Expected result |
| --- | --- | --- |
| APW-RLS-15 | User can select projects in own workspace. | Pass for owner/member. |
| APW-RLS-16 | Non-member cannot select projects. | Blocked or zero rows. |
| APW-RLS-17 | Project access check is based on workspace membership. | Pass. Access follows `projects.workspace_id -> workspace_members.workspace_id`. |
| APW-RLS-18 | `projects.access.check` returns access for member. | Pass. |
| APW-RLS-19 | `projects.access.check` denies non-member without leaking extra project data. | Pass. |
| APW-RLS-20 | Broad project creation remains disabled in Prompt 3 server route. | Pass. `POST /v1/projects` fails closed. |

## Bootstrap Idempotency Tests

| ID | Case | Expected result |
| --- | --- | --- |
| APW-RLS-21 | Profile bootstrap run twice for same user. | One `profiles` row; second call returns existing row or safe update. |
| APW-RLS-22 | Workspace bootstrap run twice after first success. | Existing membership returned; no second workspace under normal sequential calls. |
| APW-RLS-23 | Concurrent first-workspace bootstrap. | Needs later DB-level uniqueness or idempotency hardening; document any duplicate risk. |

## Service-Role Boundary Tests

| ID | Case | Expected result |
| --- | --- | --- |
| APW-RLS-24 | Admin runtime unavailable. | Backend returns explicit `backend_required` style result. |
| APW-RLS-25 | Admin runtime available. | Service-role writes stay limited to `profiles`, `workspaces`, and `workspace_members`. |
| APW-RLS-26 | Response sanitization. | No service-role data, auth token, provider key, signed URL, private media path, or raw secret is returned. |

## Optional Future Audit Tests

Prompt 3 does not implement audit writes. If a later prompt adds auth/workspace audit events, add tests for:

- append-only `audit_events`;
- sanitized event payload;
- workspace/project scope when applicable;
- no user mutation path for audit rows.
