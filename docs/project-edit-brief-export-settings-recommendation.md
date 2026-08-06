# Project Edit Brief Export Settings Recommendation

RP-EDITBRIEF-09 adds deterministic mock/local Export Settings recommendations for the Edit Brief workspace. Export Settings are session-level `ProjectEditSession` metadata that Brief can display and update; they are not Brief-owned render jobs.

## Recommendation Rules

- New standard-aspect recommendations use the `uhd_2160` professional profile by default, while the legacy delivery-preset ID remains the platform/safe-zone compatibility alias.
- `9:16` resolves to `2160x3840`; `16:9` resolves to `3840x2160`; `1:1` resolves to `2160x2160`; `4:5` resolves to `2160x2700`; and `4:3` resolves to `2880x2160`.
- The same adapter can resolve the registered `hd_1080` and `qhd_1440` frames for 1080p and 2K/1440p delivery.
- Browser source-metadata recommendations may preserve exact lower source dimensions and classify them as a registered profile or `custom`; they do not read source bytes or silently claim enhanced detail.
- `custom` preserves custom mock ratio metadata and keeps `mp4`, `h264`, and `aac`.

## Boundary

The recommendation engine accepts bounded browser metadata but never probes or processes real media. It performs no render/export, no file bytes read, no URL fetch, no media processing, no Supabase command, no worker, no provider/model call, and no credits. It is safe mock/local metadata for owner review before production export activation.
