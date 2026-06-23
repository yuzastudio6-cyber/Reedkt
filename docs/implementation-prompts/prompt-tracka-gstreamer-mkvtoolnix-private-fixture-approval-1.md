# TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-APPROVAL-1

Use this prompt after `TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-SCOPE-DECISION-1` lands with decision `tracka_gstreamer_mkvtoolnix_private_fixture_scope_decision_passed_ready_for_private_fixture_approval`.

Goal: approve, but do not execute, a tightly bounded future private fixture for Track A GStreamer/MKVToolNix.

Required source truth:

- PR #652 controlled synthetic fixture proof is merged.
- Private fixture scope decision packet is merged.
- `TRACKA-GSTREAMER-MKVTOOLNIX-PRIVATE-FIXTURE-SCOPE-DECISION-1R` post-merge safety closure has been read.
- Product-ready end-to-end local OSS tools remain `0`.
- FFmpeg/FFprobe remain Track B-owned shared dependencies only.
- The pushed PR #659 path did not execute FFmpeg/FFprobe.
- A local unpushed ad hoc safety-scan quoting error invoked `ffprobe` with no media input, produced no artifacts, is not accepted source evidence, and must not be repeated.

Approval packet must define:

- exact fixture source and generation plan,
- privacy classification,
- checksum manifest plan,
- temp-only storage,
- sanitized logging,
- cleanup verification,
- no public artifact delivery,
- no signed URL delivery,
- no GCS upload unless separately approved,
- no render/export,
- no beta or production unlock.
- planning/approval-only status unless a later guarded execution packet explicitly authorizes private fixture execution.
- no FFmpeg/FFprobe execution unless Track B coordinates and owns that evidence.
- no private fixture execution unless a future guarded execution packet approves it.

Do not run GStreamer, MKVToolNix, FFmpeg, FFprobe, Docker, Remotion, media processing, workers/routes/providers, Supabase, SQL, GCS, public artifacts, signed URLs, beta, production, raw prompts, or PR merges in the approval phase.
