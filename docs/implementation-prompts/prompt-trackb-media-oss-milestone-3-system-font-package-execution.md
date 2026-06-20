# TRACKB_MEDIA_OSS_MILESTONE_3_SYSTEM_FONT_PACKAGE_EXECUTION

Execute only the future Track B Milestone 3 OCR runtime system-font package lane approved by `trackb_media_oss_milestone3_system_font_package_approval_passed_ready_for_fonts_noto_cjk_execution`.

Approved primary package: `fonts-noto-cjk`. `fonts-noto-cjk-extra` remains fallback-only if execution proves regular/bold Noto CJK coverage is insufficient. Patch only `docker/prod/ocr-runtime/Dockerfile`, build the local OCR runtime image, verify Noto CJK font files and local-font configuration, then run network-disabled PaddlePaddle import/tensor and PaddleOCR import/API-shape checks.

Do not download/copy/upload/stage exact PingFang, font files, or model files. Do not run OCR inference, instantiate OCR if it could load/download models, use GPU, run FFmpeg/FFprobe/media tools, execute workers/routes/providers, touch Supabase/GCS, create public artifacts or signed URLs, unlock beta/production, merge PRs, close PRs, or delete branches.
