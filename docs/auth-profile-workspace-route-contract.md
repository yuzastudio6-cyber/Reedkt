# Auth Profile Workspace Route Contract

Prompt 3 defines and partially implements only auth/profile/workspace/project access route contracts. These contracts are backend/server contracts unless explicitly marked frontend-safe.

## Global Rules

- All authenticated routes require a bearer token verified through Supabase public auth.
- Service-role credentials remain server-only.
- Responses return safe summaries, not raw Supabase records with privileged fields.
- Routes must not touch blocked table groups.
- Routes must return explicit blocked/backend-required behavior when admin runtime is unavailable.

## Routes

| Route ID | Method | Path | Purpose | Caller | Auth required? | Tables touched | Service role? | Idempotency? | Audit event |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `auth.bootstrap.status` | GET | `/v1/auth/bootstrap/status` | Report safe backend bootstrap availability. | frontend/server diagnostics | No | none | No | No | none |
| `auth.currentUser` | GET | `/v1/auth/current-user` | Return safe authenticated user summary. | frontend | Yes | `auth.users` via token context | No | No | none |
| `auth.profile.ensure` | POST | `/v1/auth/profile/ensure` | Select/create/update safe profile fields. | frontend | Yes | `profiles` | Yes when available | Select-before-insert only | future |
| `auth.workspace.ensure` | POST | `/v1/auth/workspace/ensure` | Ensure current workspace and owner membership. | frontend | Yes | `workspaces`, `workspace_members` | Yes when available | Select-before-create only | future |
| `auth.workspace.current` | GET | `/v1/auth/workspace/current` | Return first/current workspace membership summary. | frontend | Yes | `workspace_members`, `workspaces` | Yes when available | Read-only | none |
| `workspaces.membership.check` | POST | `/v1/workspaces/membership/check` | Check authenticated user membership in one workspace. | frontend/backend callers | Yes | `workspace_members`, `workspaces` | Yes when available | Read-only | future on denied |
| `projects.access.check` | POST | `/v1/projects/access/check` | Check authenticated user access to one project through workspace membership. | frontend/backend callers | Yes | `projects`, `workspace_members` | Yes when available | Read-only | future on denied |
| `projects.get` | GET | `/v1/projects/:projectId` | Return project summary after workspace membership check. | frontend | Yes | `projects`, `workspace_members` | Yes when available | Read-only | future on denied |
| `projects.bootstrap.default` | POST | not implemented | Future default project bootstrap if product requires it. | none | Yes | `projects` | Yes | Required later | future |

## Input And Output Summaries

### `auth.bootstrap.status`

- Input: none.
- Output: backend availability, canonical table list, public/auth config booleans, `mockOnly`, safe warnings.
- Forbidden side effects: any DB write, secret return, provider/render/tool call.

### `auth.currentUser`

- Input: authorization header.
- Output: `userId`, `email`, `isMockUser`.
- Forbidden side effects: DB writes or service-role lookup.

### `auth.profile.ensure`

- Input: optional `displayName`, optional `avatarUrl`.
- Output: status, availability, safe user summary, safe profile summary.
- Forbidden side effects: writing `user_profiles`, metadata secrets, private media, credits, jobs, providers, render, tools.

### `auth.workspace.ensure`

- Input: optional `workspaceName`.
- Output: status, availability, safe workspace summary, safe membership summary.
- Forbidden side effects: creating chat/media/planning/credit/job/storage/provider/render/tool records.

### `auth.workspace.current`

- Input: authorization header.
- Output: status, availability, safe workspace summary, safe membership summary.
- Forbidden side effects: writes.

### `workspaces.membership.check`

- Input: `workspaceId`.
- Output: `hasAccess`, status, safe workspace summary when accessible, safe membership summary when accessible.
- Forbidden side effects: membership creation, role mutation, invite creation.

### `projects.access.check`

- Input: `projectId`.
- Output: `hasAccess`, status, safe project summary when accessible, safe membership summary.
- Forbidden side effects: project creation, chat session creation, media reads, execution-state mutation.

### `projects.get`

- Input: route `projectId`.
- Output: safe project summary and membership after access check.
- Forbidden side effects: writes.

## Forbidden Side Effects For All Prompt 3 Routes

- No storage upload, signed URL, or storage object record creation.
- No media, transcript, planning, approved snapshot, credit, job, worker, provider, render, QA, revision, export, tool, SFX, StoryTiming, Stripe, or deployment side effects.
- No frontend service-role behavior.
- No raw secret, token, signed URL, private object path, or provider payload returned.
