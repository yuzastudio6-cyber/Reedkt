# Edit Brief Attachment Model

Status: architecture/docs only. This report defines future `ProjectEditSession` Marker attachments and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Attachment Kinds

- `broll_video`
- `image`
- `music_track`
- `soundtrack`
- `sfx`
- `voiceover`
- `document`
- `reference_label`
- `reference_url_metadata_only`

## UI Behavior

- Attachments appear as clean chips in the Marker drawer.
- Chips can show label, kind, source, status, and mock/local boundary.
- Click-to-preview can be planned later.
- Missing or invalid assets should produce Marker QA warnings.

## Safety Boundary

Attachments are metadata-only first. No file bytes, upload, URL fetch, media processing, signed URL, storage write, worker, render, provider call, credit action, or Supabase write is allowed in RP-EDITBRIEF-01.
