# Storage Upload RLS Test Plan

This plan defines local/staging validation cases for Prompt 4. It is not proof that RLS passed. Remote Supabase must not be used without separate approval.

## Scope

Allowed tables/concepts:

- `workspaces`
- `workspace_members`
- `projects`
- `upload_intents`
- `storage_object_records`
- `signed_url_events`
- `media_assets` only for source media finalization boundary
- `uploaded_clips` and source order tables only if already canonical and only for upload order metadata

Blocked domains:

- edit planning
- approved snapshots
- credits
- jobs/workers
- providers
- rendering/export execution
- tool runtime
- SFX
- StoryTiming
- Stripe/billing

## Test Cases

| Case | Actor | Expected result | Notes |
| --- | --- | --- | --- |
| Workspace member creates upload intent for own project | Authenticated workspace member | Allowed through backend route if role permits upload. | Requires project access through `workspace_members`. |
| Non-member creates upload intent | Authenticated non-member | Denied. | Must fail closed before any signed target is created. |
| Project editor/member reads upload intent | Scoped workspace member | Allowed for upload intents in the same workspace/project. | Output must not include service-role data. |
| Non-member reads upload intent | Authenticated non-member | Denied. | Cross-workspace reads must fail. |
| Backend finalizes upload intent | Backend/service-role path | Allowed after upload verification. | Must create canonical bucket/path record only. |
| Normal user writes storage object records directly | Normal user | Denied unless a reviewed policy explicitly allows a narrow insert. | Preferred production path is backend finalization. |
| Storage object record content | Backend-created record | Stores bucket/path only, no signed URL value. | Metadata must be secret-safe. |
| Signed URL event content | Backend-created event | Stores purpose, expiry, and redacted metadata only. | Must not store signed URL values. |
| Source-media bucket privacy | Any user without signed target | No public read/write. | Bucket remains private. |
| Generated/previews/exports/QA/worker-temp privacy | Normal user | No direct user write to worker/backend buckets. | Worker-temp cleanup policy required later. |
| Upload intent expiration | Backend route | Expired intent blocks finalization. | Enforcement belongs in backend service. |
| Path workspace/project scope | User request | User cannot write outside their workspace/project path. | Backend builds path; users do not supply canonical path. |
| Path traversal attempt | User request | Rejected. | Reject `..`, absolute paths, null bytes, and cross-workspace paths. |
| Source upload order preservation | User finalization metadata | Source order remains stable until a later approved workflow changes it. | No edit planning starts in Prompt 4. |

## Local Validation Requirements

- Use disposable local Supabase or approved staging only.
- Do not use production data.
- Do not connect to remote/staging without explicit approval.
- Seed two users, two workspaces, memberships, and projects.
- Validate both SQL RLS behavior and backend route fail-closed behavior.
- Confirm storage policies do not make source media public.

## Current Status

Prompt 4 adds `database/test-sql/007_storage_upload_rls_smoke_tests.draft.sql` as a draft-only local/staging plan. It was not executed because local Supabase validation remains blocked by the host Supabase CLI architecture issue documented in Prompt 3B/3C.

## Must Not Claim

- Do not claim RLS passed unless the SQL ran against a disposable local or approved staging Supabase.
- Do not claim remote storage validation passed unless bucket policies and signed URL behavior were tested.
- Do not treat local/mock storage writes as production storage validation.
