# RP-DATA-03 RLS And Grant Review

Decision: `completed_static_migration_draft_ready_for_guarded_local_validation`

RLS draft status: `created_not_applied`

Grant draft status: `created_not_applied`

## New Artifact Manifest RLS

`public.artifact_manifests`:

- RLS enabled.
- Authenticated users may select only rows whose `project_id` passes `public.is_project_member(project_id)`.
- No authenticated insert, update, or delete policy is defined.
- Backend/workers create and mutate rows through service-role-only code in future milestones.

`public.artifact_manifest_items`:

- RLS enabled.
- Authenticated users may select only item rows whose parent manifest is project-member visible.
- No authenticated insert, update, or delete policy is defined.
- Backend/workers create and mutate rows through service-role-only code in future milestones.

## Data API Exposure

The draft includes explicit grants because current Supabase rollout changes can require opt-in grants before newly created `public` tables are visible through the Data API.

Authenticated grants are intentionally split:

- User-editable planning/session tables get `select, insert, update` only when existing RLS policies already support member/editor writes.
- Backend/service-controlled tables get `select` only for authenticated users.
- Backend/service-controlled tables explicitly revoke authenticated insert/update/delete where older migrations may have granted broader access.
- `anon` receives no grant.
- `service_role` receives explicit access where future backend/worker code needs controlled mutation.

## Advisor Notes For Future Validation

Future guarded local validation must run Supabase advisors and specifically inspect:

- RLS enabled on `artifact_manifests` and `artifact_manifest_items`.
- No broad `TO authenticated` policies without project membership predicates.
- No user-editable metadata authorization.
- No public or anonymous grants on internal beta tables.
- No unsafe `SECURITY DEFINER` helper exposure added by this draft.
- Data API grants do not bypass RLS.
