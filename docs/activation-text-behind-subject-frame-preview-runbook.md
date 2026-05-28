# Phase 33E Text-Behind-Subject Frame Preview Runbook

Phase 33E creates one controlled private text-behind-subject PNG preview from
the approved Phase 33D representative frame, mask, and RGBA cutout.

The only approved text is `REEDITPRO`. The render worker may compose one PNG
with FFmpeg and system DejaVu font fallback. It must not process video, rerun
BiRefNet, use SAM2, call providers, use GPU, download models, create public
URLs, or use Revideo.

Execution requires `REEDITPRO_ENV=staging` and
`REEDITPRO_CONFIRM_TEXT_BEHIND_SUBJECT_FRAME_PREVIEW=true`.
