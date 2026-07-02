# Production Caption Preview Policy

Caption preview is optional and local-dev/container-safe only. It uses FFmpeg/libass with allowlisted args, never Revideo, and never final export.

Preview is disabled by default. If FFmpeg, libass input, source video, ASS caption file, or output path is unavailable, preview skips with a clear reason.

No user source media is processed except explicit approved/local-dev artifact paths.
