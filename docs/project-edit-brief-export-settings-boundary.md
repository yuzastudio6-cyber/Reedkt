# Project Edit Brief Export Settings Boundary

Export Settings are visible from Edit Brief because marker timing, safe areas, captions, and delivery intent affect future planning. They remain session-level `ProjectEditSession` metadata, not Brief-owned execution state.

## Required False Flags

- provider/model calls: false
- Supabase/storage writes: false
- signed URLs: false
- file bytes read: false
- external URL fetch: false
- media processing: false
- worker/job creation: false
- generation/render/export jobs: false
- credit reservation/spend: false

## Runtime Boundary

RP-EDITBRIEF-09 adds no new route IDs, no migration, no Supabase command, no production HTTP route, no real export/render/progress UI, no `ChatNativeEditor` changes, and no cleanup/staging/commit. The panel is mock/local only pending owner review.

Boundary phrase: no render/export, no file bytes, no URL fetch, no media processing, no Supabase command.

## RP-EDITBRIEF-12 Verification

Export Settings review/save is included in the full Edit Brief E2E path. The panel remains session-level mock metadata only: no render/export/progress, media probing, file-byte read, URL fetch, worker, provider/model, Supabase command, migration, or credit behavior is enabled. Production ready: false and owner approval remains pending.
