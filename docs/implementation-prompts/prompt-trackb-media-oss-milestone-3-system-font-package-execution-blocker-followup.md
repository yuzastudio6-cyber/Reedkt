# Track B Milestone 3 System Font Package Execution Blocker Follow-Up

Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_3_SYSTEM_FONT_PACKAGE_EXECUTION_BLOCKER_FOLLOWUP`

Resolve only the Docker build blocker from the system-font package execution phase.

Source truth:
- Decision: `trackb_media_oss_milestone3_system_font_package_execution_blocked_by_docker_build`.
- Target Dockerfile: `docker/prod/ocr-runtime/Dockerfile`.
- Package patch preserved `libgomp1 libgl1 libglib2.0-0` and added `fonts-noto-cjk`.
- Docker build failed before image creation while loading `python:3.12-slim` metadata with `DeadlineExceeded: context deadline exceeded`.

Allowed future scope:
- Re-run only the approved OCR runtime Docker build and container-local CPU checks after the build blocker is addressed.
- Keep exact PingFang blocked and do not use `fonts-noto-cjk-extra` unless separately approved.

Blocked scope:
- No OCR inference, model/font asset download/copy/upload, GPU, FFmpeg/FFprobe, media/render, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, or production.
