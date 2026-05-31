# Phase 45D FFmpeg/FFprobe Final Render Hardening Policy

Phase 45D is Track A visual/video only. It validates deterministic FFmpeg export hardening and FFprobe inspection against approved private artifacts.

Allowed:

- Approved Phase 32 private source video.
- Approved Phase 45A libass burn-in preview/report.
- Approved Phase 45B Remotion preview/report.
- Approved Phase 45C OpenTimelineIO timeline/report.
- One bounded private review export.
- FFmpeg and FFprobe.

Blocked:

- Arbitrary media.
- Public URLs and signed URLs as source of truth.
- User final delivery.
- Providers.
- Revideo.
- Track B tools.
- Production, external beta, paid production, and broad real media.

Execution requires `REEDITPRO_CONFIRM_FFMPEG_FINAL_RENDER_HARDENING=true` plus staging `GCP_PROJECT_ID`, `GCP_REGION`, and `REEDITPRO_ENV` locks.
