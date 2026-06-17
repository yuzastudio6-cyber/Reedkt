# TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE

Use the central source-of-truth branch after the FFmpeg/FFprobe system-binary review lands.

Decision from this review: `ffmpeg_ffprobe_system_binary_review_passed_ready_for_tracka_source_of_truth_merge`.

Goal: reconcile or merge the Track A PR #463 FFmpeg/FFprobe/libass runtime path evidence into the central source-of-truth path before any central FFmpeg/FFprobe version-probe approval.

Do not run FFmpeg, FFprobe, Docker builds, media processing, render/export, workers, routes, providers, Supabase/GCS mutation, public artifacts, signed URLs, raw prompts, beta, or production unless a later prompt explicitly approves that exact scope.
