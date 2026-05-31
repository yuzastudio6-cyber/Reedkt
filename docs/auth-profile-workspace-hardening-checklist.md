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
