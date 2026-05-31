# Auth Profile Workspace Production Path

Prompt 3 implements the first narrow backend production path inside the Prompt 2A canonical boundary. It is limited to authenticated user context, profile bootstrap, workspace bootstrap, workspace membership checks, and project access checks.

This document is the source-of-truth report for what Prompt 3 added. It does not authorize storage uploads, media records, planning records, approved snapshots, credits, jobs, workers, providers, rendering, tools, Stripe, migrations, deployment, or broad service-role handlers.

## Current Implementation Found

Existing frontend-safe auth bootstrap code already used:

- `src/backend/auth/auth-client-service.ts`
- `src/backend/auth/profile-bootstrap-service.ts`
- `src/backend/auth/workspace-bootstrap-service.ts`
- `src/backend/auth/auth-bootstrap-orchestrator.ts`
- `src/backend/supabase/table-names.ts`

Those helpers use the public Supabase anon client and return `backend_required` when RLS blocks frontend-safe inserts or updates. They do not import service-role credentials into browser code.

Existing server code had:

- `server/middleware/auth.ts` for bearer-token verification through the public Supabase client.
- `server/services/auth-service.ts` with current-user summary only.
- `server/services/project-service.ts` with a broader project create/read scaffold.
- `server/routes/project-routes.ts` registered project create/read routes.

Prompt 3 adds backend/server routes and service methods for auth/profile/workspace/project access only, and fails broad project creation closed because canonical project creation is not part of this milestone.

## Canonical Tables Used

Prompt 3 code targets only:

- `auth.users` through verified Supabase Auth user context.
- `profiles`
- `workspaces`
- `workspace_members`
- `projects`

Prompt 3 did not add audit writes. `audit_events` remains future optional scope for a dedicated audit milestone or a later auth hardening prompt.

## Legacy And Blocked Tables Avoided

Prompt 3 avoids:

- `user_profiles`
- all chat/session/message tables
- all media/source/storage tables
- all planning/snapshot tables
- all credit/approval/reservation/ledger tables
- all job/worker/runtime transport tables
- all provider/generation/render/export/QA/revision/tool tables
- all SFX, StoryTiming, and draft-only tables

## Frontend Responsibilities

The frontend may:

- collect auth/session state using frontend-safe Supabase public config;
- request bootstrap status and current user details from the backend;
- request profile ensure, workspace ensure, workspace membership check, and project access check routes;
- continue using anon-client fallback behavior where RLS allows it.

The frontend must not:

- import service-role secrets;
- create admin Supabase clients;
- mutate credit ledger, job, worker, provider, render, storage, or tool execution state;
- create signed URLs;
- call providers, renderers, workers, tools, or Stripe.

## Backend API Responsibilities

Prompt 3 adds server-side route behavior for:

- `GET /v1/auth/bootstrap/status`
- `GET /v1/auth/current-user`
- `POST /v1/auth/profile/ensure`
- `POST /v1/auth/workspace/ensure`
- `GET /v1/auth/workspace/current`
- `POST /v1/workspaces/membership/check`
- `GET /v1/projects/:projectId`
- `POST /v1/projects/access/check`

Prompt 3 keeps `POST /v1/projects` registered for compatibility, but it now fails closed with a validation error because broad project creation is outside the milestone scope.

## Supabase And RLS Responsibilities

Supabase remains the source of truth for canonical auth/workspace/project records. The active RLS policy intent is:

- users can read and update their own `profiles` row;
- workspace visibility derives from `workspace_members`;
- project visibility derives from workspace membership;
- normal users cannot create privileged membership rows for other users;
- project access is based on `projects.workspace_id -> workspace_members.workspace_id`.

Prompt 3 adds a draft local-only RLS smoke test file. It does not execute SQL or validate remote Supabase.

## Service-Role Boundaries

Server-only service-role use is allowed in this Prompt 3 branch only for:

- selecting or inserting `profiles` for the authenticated user;
- selecting or inserting `workspaces` for the authenticated user bootstrap path;
- inserting the owner row in `workspace_members` for that bootstrap workspace;
- reading `workspace_members` to check authorization;
- reading `projects` to check access through workspace membership.

The service returns safe summaries only. It does not return service-role credentials, raw secrets, signed URLs, or privileged backend-only rows.

When the admin runtime is unavailable, the routes return explicit `backend_required` style results instead of pretending production readiness.

## Profile Bootstrap Flow

1. `requireAuth` verifies the bearer token or enters explicit mock mode when configured.
2. `ensureProfile` selects `profiles` by `user_id`.
3. If the row exists, only `display_name` and `avatar_url` may be updated.
4. If the row is missing, the backend inserts a canonical `profiles` row for the authenticated user.
5. The response returns only safe profile and user summary fields.

## Workspace Bootstrap Flow

1. `ensureWorkspace` checks existing `workspace_members` rows for the authenticated user.
2. If a membership exists, the first visible membership becomes the current workspace summary.
3. If no membership exists, the backend creates a `workspaces` row owned by the user.
4. The backend creates an owner `workspace_members` row for that workspace.
5. The response returns safe workspace and membership summaries.

Race-free idempotency for concurrent first-workspace creation still needs a later DB-level default-workspace or uniqueness decision.

## Workspace Membership Flow

`workspaces.membership.check` reads `workspace_members` for the authenticated `user_id` and requested `workspace_id`. It returns `hasAccess: true` only when the canonical membership row exists.

No role escalation or membership management route was added.

## Project Access Flow

`projects.access.check` and `GET /v1/projects/:projectId` read a canonical `projects` row, then require a matching `workspace_members` row for the authenticated user and `projects.workspace_id`.

If no membership exists, the server returns an access-denied error with a generic not-found-or-inaccessible message. It does not read chat/media/planning/execution tables.

## Idempotency Expectations

Prompt 3 does not use the runtime idempotency table because that table is outside the allowed scope. The implemented idempotency is limited to:

- profile ensure selecting before insert;
- workspace ensure selecting membership before creating a workspace;
- project access checks being read-only.

Future hardening should add explicit idempotency only after the canonical idempotency table is in scope.

## Audit Expectations

Prompt 3 does not write `audit_events`. Future auth hardening should emit sanitized append-only audit events for:

- profile created;
- safe profile fields updated;
- workspace bootstrapped;
- owner membership bootstrapped;
- project access denied.

Those events must not include secrets, tokens, signed URLs, raw auth headers, or private media paths.

## Validation Run

Validation is recorded in `docs/prompt-03-validation-results.md`.

## What Remains Blocked

- Remote/staging Supabase validation.
- Executed RLS tests.
- Auth pages and account lifecycle UX.
- Membership invite/admin flows.
- Broad project creation/update/list routes.
- Storage uploads, media records, planning, snapshots, credits, jobs, workers, providers, rendering, tools, Stripe, and deployment.
- SQL migration cleanup for duplicate active schema eras.

## Production Capability Enabled

Prompt 3 enables a limited auth/profile/workspace/project backend foundation only. It does not enable any production execution outside that boundary.
