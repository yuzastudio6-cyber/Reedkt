# Edit Level Tool Capability Router

RP-EDITLEVEL-05 adds a mock/local Tool Capability Router for `normal`, `premium`, and `ultra_premium`.

The router resolves capability plans only. It does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers, media tools, ffmpeg, ffprobe, Whisper, SoundSync workers, render/export, Supabase, storage, progress, or credits.

## Result

Each routing package includes:

- selected Edit Level and public display name;
- required, recommended, optional, future-only, blocked, and degraded capabilities;
- user-facing and technical summaries;
- explicit fallbacks;
- side-effect flags proving mock/local behavior.

## Boundary

Current runtime `basic | pro | premium` remains unchanged. Public canonical levels still map to legacy runtime values only at the UI prop boundary:

- `normal -> basic`
- `premium -> pro`
- `ultra_premium -> premium`

Recommended next milestone: `RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing`.
