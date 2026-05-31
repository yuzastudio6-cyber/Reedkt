# Auth Profile Workspace Hardening Checklist

Use this checklist when reviewing auth/profile/workspace/project changes before any storage, planning, credit, job, worker, provider, render, tool, or billing milestone.

| Check | Required result | Prompt 3A status |
| --- | --- | --- |
| Auth required | Authenticated route groups use `requireAuth`. | reviewed |
| Workspace membership required | Workspace access checks read `workspace_members`. | reviewed |
| Project access through workspace membership | Project access resolves through `projects.workspace_id` and `workspace_members`. | reviewed |
| Safe profile fields only | Profile writes are limited to `display_name` and `avatar_url`, plus safe bootstrap metadata on create. | reviewed |
| No service-role data in frontend response | Responses return summaries only; no service-role rows, secrets, tokens, or signed URLs. | reviewed |
| No legacy profile table | Code does not target `user_profiles`. | reviewed |
| No blocked tables | Auth/project server files do not reference blocked table groups. | reviewed |
| No unrelated side effects | No storage/media/credit/job/provider/render/tool side effects. | reviewed |
| Idempotent bootstrap | Profile/workspace bootstrap select before insert. | partial; concurrent first-workspace bootstrap still needs later DB/idempotency work |
| Fail-closed behavior | Missing auth/admin/runtime does not expose data or create unrelated records. | reviewed |
| Sanitized audit if used | Audit is not implemented in Prompt 3A. | not in scope |
| RLS tests available | Draft RLS checklist exists. | draft-only |
| Build/lint status known | Recorded in Prompt 3A results. | lint/server typecheck pass; full build blocked by Vite/Rolldown native binding |

## Prompt 3B Validation Checklist

| Check | Required result | Prompt 3B status |
| --- | --- | --- |
| Build path known | Full build either passes or has an exact environment blocker. | environment-blocked by Vite/Rolldown Darwin native binding code-signature/native-binding failure |
| Lint path known | Lint can run through a documented local command. | passed with arm64 Node path workaround |
| Server typecheck known | Server typecheck can run through a documented local command. | passed with arm64 Node path workaround |
| Supabase CLI status known | Local CLI either works or has an exact blocker. | blocked by `Unknown system error -86` / `bad CPU type in executable` |
| RLS execution path known | RLS SQL status is draft, executable local-only, or executed. | draft-only; not run |
| Blocked table scan known | Prompt 3/3A runtime files are scanned for blocked tables and forbidden runtime domains. | 0 blocked table matches, 0 legacy `user_profiles` matches, 0 forbidden runtime-domain matches |
| Prompt 4 decision recorded | Decision is explicit in Prompt 3B results. | Prompt 4 should wait; recommended Prompt 3C |
