# RP-BETA-INTEGRATION-16 Storage Upload Policy Comment Repair Checklist

## Patch Checks

- Target migration was `supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql`.
- Two `COMMENT ON POLICY ... ON storage.objects` statements were converted to ordinary SQL comments.
- Comment meaning was preserved for project-member reads and project-editor source/thumbnail uploads.
- Bucket setup stayed unchanged.
- Storage policy definitions stayed unchanged.
- No storage RLS broadening was added.
- No bucket was made public.
- No new migration was created.

## Static Checks

- No `COMMENT ON POLICY ... ON storage.objects` remains in the target migration.
- No `COMMENT ON TABLE storage.*` remains in the target migration.
- No `COMMENT ON COLUMN storage.*` remains in the target migration.
- `insert into storage.buckets` remains present.
- `public = false` remains present.
- `drop policy` and `create policy` statements remain present.
- Path convention checks and helper calls remain present.

## Local Safety Checks

- `supabase/config.toml` retained `project_id = "reeditpro-local"`.
- DB port remained `55432`.
- Ports `55430` through `55439` were checked before start.
- Docker daemon was reachable.
- Supabase CLI was available.
- No remote-risk Supabase environment variable names were found.
- No remote Supabase command was run.

## Local Verification Checks

- `supabase start` ran locally for `reeditpro-local`.
- `supabase db reset --local --no-seed` passed locally.
- `reeditpro-local` was stopped by project ID after this pass started it.
- No `supabase link` was run.
- No `supabase db push` was run.
- No remote SQL was run.

## Creative Skill Smoke Checks

- Six Creative Skill catalog tables exist.
- Counts matched `21/140/9/20/450/0`.
- Skills have families.
- Aliases resolve.
- No self-relationships exist.
- Every skill has `universal_skill_plan`.
- Every skill has exactly one primary mapping.
- Duplicate reviews are empty.
- No-action counterpart count is `12`.

## Boundaries

- No Creative Skill migration changed.
- No canonical manifest changed.
- No TypeScript contract changed.
- No mock fixture changed.
- No package file changed.
- No runtime, provider, worker, UI, storage runtime, or app behavior changed.
- No Qwen clone file changed.
- No files were staged, committed, merged, pushed, or deployed.

## Fail The Prompt If

- A storage bucket is made public.
- Anonymous storage access is added.
- Project-member read checks are weakened.
- Project-editor upload checks are weakened.
- A new migration is created.
- Creative Skill migrations are edited.
- Canonical manifest, TypeScript contracts, mocks, packages, or runtime files are edited.
- Remote Supabase is used.
- `supabase link` is run.
- `supabase db push` is run.
- Local output leaks keys, passwords, tokens, or full connection strings.
- Files are staged, committed, merged, pushed, or deployed.
