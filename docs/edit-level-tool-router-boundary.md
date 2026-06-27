# Edit Level Tool Router Boundary

RP-EDITLEVEL-05 is mock/local routing metadata only.

The router resolves capability plans only; it does not execute tools, has no media processing, no render, and no credits.

It does not:

- call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers, ffmpeg, ffprobe, Whisper, SoundSync, or media workers;
- process uploaded media or read uploaded/media file bytes;
- create production HTTP routes;
- run or modify Supabase migrations;
- run Supabase CLI, gcloud, Docker, or sound runtime;
- render/export, start progress, reserve credits, spend credits, or mutate wallets;
- change current planner behavior;
- change current render behavior;
- rename current runtime `basic | pro | premium` values;
- modify `ChatNativeEditor` runtime behavior.

All route/package side-effect flags remain false, with `mockOnly: true`.

Read-only migration baseline remains 25 files unless a separate migration milestone changes it.
