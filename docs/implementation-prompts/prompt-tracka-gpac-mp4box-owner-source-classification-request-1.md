# TRACKA-GPAC-MP4BOX-OWNER-SOURCE-CLASSIFICATION-REQUEST-1

Goal: request an explicit owner source classification for the GPAC/MP4Box package-source blocker.

Source-of-truth context:

- `TRACKA-GPAC-MP4BOX-PACKAGE-SOURCE-OWNER-ENVIRONMENT-FOLLOWUP-1` decision: `tracka_gpac_mp4box_owner_environment_followup_blocked_no_owner_environment_source_approval`.
- PR #713 decision: `blocked_no_owner_environment_package_source_approval`.
- PR #706 decision: `blocked_no_safe_package_source_policy_available`.
- PR #702 decision: `blocked_no_safe_package_source_resolution_available`.
- PR #711 preserves post-PR706/PR708 reconciliation metadata.
- PR #701 and PR #708 are closed without merge and remain stale context only.
- #577 remains open/draft/blocked and excluded as source-of-truth.

Required owner output: approve or reject an exact GPAC/MP4Box source class for the current render-worker environment. Until that classification exists, do not add GPAC, MP4Box, Bento4, third-party repositories, Dockerfile declarations, package dependencies, source-build scripts, binary downloads, package-lock changes, requirements changes, or runtime commands.

Blocked scope: no GPAC/MP4Box execution, Bento4 execution, Docker, FFmpeg/FFprobe, media processing, render/export, Supabase/SQL/GCS, signed/public artifacts, beta, production, package install, or dependency mutation.

Product-ready local OSS tools: `0`. Track B FFmpeg/FFprobe ownership remains preserved. Supabase classification: no write / environment none / SQL none / migration no.
