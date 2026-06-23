# TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-PLAN-1

Use this prompt after `TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-APPROVAL-1` lands with decision `tracka_gstreamer_mkvtoolnix_private_fixture_approval_passed_ready_for_private_fixture_plan`.

Goal: define the exact generated synthetic-but-private fixture plan for Track A GStreamer/MKVToolNix without executing it.

Required source truth:

- PR #652 controlled synthetic fixture proof is merged.
- PR #659 private fixture scope decision is merged.
- Private fixture approval packet is merged.
- Product-ready end-to-end local OSS tools remain `0`.
- FFmpeg/FFprobe remain Track B-owned shared dependencies only.

The plan must define exact fixture generation, privacy classification, command matrix, temp-only paths, checksum manifest, sanitized logging, cleanup verification, blocked scopes, and future execution validation.

Do not run GStreamer, MKVToolNix, FFmpeg, FFprobe, Docker, Remotion, media processing, workers/routes/providers, Supabase, SQL, GCS, public artifacts, signed URLs, beta, production, raw prompts, or PR merges in the planning phase.
