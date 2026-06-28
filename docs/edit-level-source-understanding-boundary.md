# Edit Level Source Understanding Boundary

RP-EDITLEVEL-06 is mock/local source understanding routing only.

It does not:

- call Qwen 3.7;
- call Qwen2.5-VL;
- call DeepSeek;
- call providers;
- run media extraction, ffmpeg, ffprobe, Whisper, SoundSync, visual/audio/graphic workers, or Docker;
- render/export or start progress;
- reserve/spend credits or mutate wallets;
- upload files, read uploaded/media file bytes, or fetch external URLs;
- create production HTTP routes;
- create or modify Supabase migrations;
- run Supabase CLI or gcloud;
- change current planner behavior;
- rename runtime `basic | pro | premium`;
- modify `ChatNativeEditor` runtime behavior.

All package side-effect flags remain false, with `mockOnly: true`.

Read-only migration baseline remains 25 files unless a separate migration milestone changes it.
