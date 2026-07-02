# Project Edit Brief Export Settings Recommendation

RP-EDITBRIEF-09 adds deterministic mock/local Export Settings recommendations for the Edit Brief workspace. Export Settings are session-level `ProjectEditSession` metadata that Brief can display and update; they are not Brief-owned render jobs.

## Recommendation Rules

- `9:16` plus `instagram_reel`, `tiktok_reel`, or `youtube_shorts` recommends a matching `1080x1920` preset at `30fps`, `mp4`, `h264`, `aac`, with caption safe area on.
- `16:9` plus `youtube_standard`, `website`, or `internal_review` recommends `1920x1080` at `30fps`, `mp4`, `h264`, `aac`.
- `1:1` plus feed/ad metadata recommends `1080x1080`.
- `4:5` plus feed/ad metadata recommends `1080x1350`.
- `custom` preserves custom mock ratio metadata and keeps `mp4`, `h264`, and `aac`.

## Boundary

The recommendation engine never inspects real media. It performs no render/export, no file bytes read, no URL fetch, no media processing, no Supabase command, no worker, no provider/model call, and no credits. It is safe mock/local metadata for owner review before RP-EDITBRIEF-10.
