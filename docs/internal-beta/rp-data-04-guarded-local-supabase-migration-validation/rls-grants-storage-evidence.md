# RP-DATA-04 RLS, Grants, And Storage Evidence

Local metadata checks after `supabase db reset --local --no-seed` confirmed:

- `public.artifact_manifests` exists.
- `public.artifact_manifest_items` exists.
- RLS is enabled on both artifact tables.
- Select policies exist for authenticated project members:
  - `artifact_manifests_select_project_member`
  - `artifact_manifest_items_select_project_member`
- `authenticated` has only `SELECT` on the two artifact tables.
- `service_role` retains backend/worker privileges for artifact table writes.
- Local private buckets exist and remain `public = false`:
  - `source-media`
  - `generated-assets`
  - `processed-media`
  - `previews`
  - `exports`
  - `thumbnails`
  - `qa-artifacts`
  - `worker-temp`
- `supabase_migrations.schema_migrations` records version `20260625031135`.

No signed URLs, public artifacts, private media reads, service-role payload access, worker execution, provider calls, or production migrations occurred.
