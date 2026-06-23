# TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-EXECUTION-1

Use this prompt after `TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-PLAN-1` lands with decision `tracka_gstreamer_mkvtoolnix_private_fixture_plan_passed_ready_for_controlled_generated_private_fixture_execution`.

Goal: execute one bounded Track A GStreamer/MKVToolNix controlled generated synthetic-but-private fixture proof using only the fixture, command, privacy, cleanup, and reporting plan from `docs/track-a/gstreamer-mkvtoolnix/private-fixture-plan/`.

Approved future fixture classes:

- GStreamer: bounded generated synthetic source pipeline, preferred family `gst-launch-1.0 -q videotestsrc num-buffers=3 ! fakesink`, no file output.
- MKVToolNix: generate temp `generated-private-subtitles.srt`, mux to temp `generated-private-subtitle-only.mkv`, then identify only that generated MKV.

Required future temp root: `/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1/<runId>/`

Do not use user media, private media, real media, broad private folders, GCS/private artifact sources, public artifacts, signed URLs, render/export, FFmpeg/FFprobe, Remotion, browser capture, workers/routes/providers, Supabase/SQL/GCS, beta, production, raw prompts, or secret payload printing.

All generated fixtures must stay temporary, be checksummed only as safe metadata, and be cleaned before commit.
