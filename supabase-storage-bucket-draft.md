# Supabase Storage Bucket Draft

## Default Policy

All buckets are private by default. Public access, if ever allowed, should be a future product and security decision, not a schema default.

Access should generally use signed URLs or backend-mediated reads. Worker writes should use service-role permissions in future backend milestones.

## Planned Buckets

### `source-media`

- Purpose: original uploaded clips and source files.
- Private/public: private.
- User readable: yes, through signed URLs or backend-mediated access.
- Worker writable: no for original source uploads; workers may read through approved job context.
- Signed URL recommended: yes.
- Retention notes: preserve while project exists unless user deletion/privacy policy requires removal.
- Policy notes: source media must never be public.

### `generated-assets`

- Purpose: generated images, AI-video clips, cards, keyframes, and other provider outputs.
- Private/public: private.
- User readable: yes, through project-scoped signed URLs.
- Worker writable: yes.
- Signed URL recommended: yes.
- Retention notes: retain with project and asset version history.
- Policy notes: generated assets are project-scoped and tied to approved snapshot/generation request records.

### `processed-media`

- Purpose: future worker outputs such as trimmed clips, normalized audio, processed frames, and intermediate media.
- Private/public: private.
- User readable: maybe through app-mediated previews after QA.
- Worker writable: yes.
- Signed URL recommended: yes.
- Retention notes: define retention by artifact role and project lifecycle.
- Policy notes: worker-only writes; users should not directly write processed files.

### `previews`

- Purpose: future preview renders and browser-safe review outputs.
- Private/public: private by default.
- User readable: yes, through signed URLs.
- Worker writable: yes.
- Signed URL recommended: yes.
- Retention notes: previews may be shorter-lived than final exports.
- Policy notes: browser-safe previews are not production rendering.

### `exports`

- Purpose: final export files.
- Private/public: private by default.
- User readable: yes, through signed download links.
- Worker writable: yes.
- Signed URL recommended: yes.
- Retention notes: retain according to workspace plan and export policy.
- Policy notes: exports may later allow signed download links, not public buckets by default.

### `thumbnails`

- Purpose: thumbnails, posters, and small review images.
- Private/public: private by default.
- User readable: yes, through signed URLs or backend-mediated delivery.
- Worker writable: yes.
- Signed URL recommended: yes.
- Retention notes: retain while the parent asset/project exists.
- Policy notes: thumbnails can reveal source content and should remain private.

### `qa-artifacts`

- Purpose: QA reports, visual/audio QA snapshots, evidence cards, and review artifacts.
- Private/public: private.
- User readable: limited project-scoped access.
- Worker writable: yes.
- Signed URL recommended: yes.
- Retention notes: retain as long as needed for audit and revision decisions.
- Policy notes: QA artifacts may contain sensitive source details and should stay private.

### `worker-temp`

- Purpose: temporary worker intermediates.
- Private/public: private.
- User readable: no by default.
- Worker writable: yes.
- Signed URL recommended: no durable signed URLs.
- Retention notes: short retention; clean aggressively after job completion.
- Policy notes: worker temp files should not be exposed directly to users.

