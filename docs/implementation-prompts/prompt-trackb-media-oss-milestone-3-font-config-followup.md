# Track B Milestone 3 Font Config Follow-Up

Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_3_FONT_CONFIG_FOLLOWUP`

## Summary

Continue from the system-font package execution blocker follow-up. The Docker metadata timeout is resolved, `fonts-noto-cjk` is installed in the rebuilt OCR runtime image, PaddlePaddle CPU import/tensor proof passed, and PaddleOCR import remains blocked because PaddleX attempts `PingFang-SC-Regular.ttf` asset fetch under `--network none`.

## Scope

- Review only safe local/system-font configuration options that prevent PaddleX from fetching `PingFang-SC-Regular.ttf`.
- Do not download, copy, upload, stage, or commit font/model assets.
- Do not run OCR inference, GPU jobs, FFmpeg/FFprobe, media processing, workers/routes/providers, Supabase/GCS, beta, or production.
- Preserve `fonts-noto-cjk` as the primary package and keep `fonts-noto-cjk-extra` fallback-only.

## Required Evidence

- Source audit for PR #625 and this follow-up.
- Font-config strategy that maps PaddleX font lookup to installed Noto CJK files without private assets.
- Container-only `--network none` import/API-shape proof if configuration is approved.
- Cleanup, safety scan, and Supabase classification: no write / environment none / SQL none / migration no.
