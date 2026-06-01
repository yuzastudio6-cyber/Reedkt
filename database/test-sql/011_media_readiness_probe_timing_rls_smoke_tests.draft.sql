-- Prompt 9 draft SQL/RLS smoke tests for media readiness, probe, transcript, and timing.
-- Local/staging validation only.
-- Do not run against production.
-- Do not use production data, credentials, signed URLs, service-role keys, private media, or remote Supabase.
-- Keep draft-only until the local Supabase validation environment and schema target are repaired.

begin;

-- Planned checks:
-- 1. Workspace member can read project-scoped media readiness records.
-- 2. Non-member cannot read project-scoped media readiness records.
-- 3. Source media remains private by default.
-- 4. storage_object_records store bucket/path only and never signed URL values.
-- 5. Normal user cannot directly mutate probe/transcript/visual/audio/timing execution records.
-- 6. Backend/service-role path owns future probe/transcript/observation/timing writes.
-- 7. uploaded_clips/source_sequence_items preserve source order.
-- 8. Transcript/timing readiness records cannot reference another workspace/project.
-- 9. Media readiness checks cannot start jobs/workers/providers/render/tools.
-- 10. Media/timing JSONB contains no secrets, provider keys, service-role keys, Stripe keys, or signed URLs.
-- 11. Audit events are append-only if media readiness audit events are later enabled.

-- Draft placeholders:
-- select ok(auth.uid() is not null, 'authenticated local test user exists');
-- Add a future assertion that storage object metadata does not contain temporary URL payload values.

rollback;
