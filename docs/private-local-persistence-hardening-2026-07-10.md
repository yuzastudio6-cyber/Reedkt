# Private Local Persistence Hardening — 2026-07-10

Status: `internal_local_boundary_hardened_not_production_storage`

Private internal-test JSON, text, manifest, QA, caption, audio, color,
enhancement, mask, timeline, slow-motion, and render metadata writers now use
`server/security/private-local-persistence.ts`.

The shared boundary provides:

- root confinement with traversal rejection;
- `0700` root and descendant directories, including pre-existing permissive roots;
- `0600` files;
- same-directory temporary files and atomic rename replacement;
- exclusive temporary creation and cleanup;
- target and parent symlink refusal;
- `O_NOFOLLOW` private reads;
- stream and text/buffer writers; and
- durability sync before replacement.

Canonical private work-graph progress now uses this boundary for immutable,
content-addressed checkpoint records and its checksum-protected atomic latest
pointer. The progress store remains tenant/package/snapshot scoped and exposes
only bounded summaries through journey recovery; it is not a distributed event
store or production queue.

Focused evidence:

```bash
npm run smoke:private-local-persistence
```

The smoke proves restrictive modes, atomic replacement of an existing inode,
temporary cleanup, traversal rejection, target/parent symlink rejection, and
adoption by the named private persistence services.

## Remaining Local Writer Work

The following media/process boundaries cannot be made safe by mechanically
replacing `writeFile`. They create external-process or temporary media outputs
and need directory-FD/sandbox ownership, output verification, and atomic
promotion designs:

- `server/media/ffmpeg-preview.ts`
- `server/workers/audio/ffmpeg-audio-adapter.ts`
- `server/workers/media/ffmpeg-media-adapter.ts`
- `server/workers/smart-cut/smart-cut-preview-runner.ts`
- `server/workers/speech/faster-whisper-command-runner.ts`
- upload/local-storage object writers

The preference compatibility pass is now complete for the current private
backend boundary. Saved Edit Preferences, Exact Edit Preferences, Preference
Intelligence / Preference DNA, and Edit Brief authority all use the shared
symlink-safe reader/writer while preserving their existing paths and persisted
JSON envelopes. Their focused authority smokes prove restrictive modes,
restart-compatible readback, target-symlink refusal, parent-symlink refusal,
and no mutation of the external symlink destination. The shared persistence
smoke also statically prevents these named services from returning to direct
`mkdir`, `writeFile`, or `createWriteStream` persistence.

Other project, internal edit-state, and browser-capture stores that are not
listed in the focused evidence above still require compatibility review before
their storage boundary can be promoted.

This hardening is for single-host internal testing. It is not a replacement
for private GCS generation-bound objects, canonical Supabase records, malware
isolation, worker sandboxes, retention policy, or deployed IAM evidence.
