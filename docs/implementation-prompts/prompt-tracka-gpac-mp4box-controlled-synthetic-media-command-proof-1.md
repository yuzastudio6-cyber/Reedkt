# TRACKA-GPAC-MP4BOX-CONTROLLED-SYNTHETIC-MEDIA-COMMAND-PROOF-1

Next gate: bounded synthetic media-command proof for GPAC/MP4Box.

Required source truth:

- Runtime proof decision: `tracka_gpac_mp4box_controlled_runtime_proof_passed_ready_for_controlled_synthetic_media_command_proof`
- Install-source QA decision: `tracka_gpac_mp4box_official_apt_install_source_qa_passed_ready_for_controlled_runtime_proof`
- Package: `gpac=26.02-rev0-g118e60a90-HEAD`
- Architecture: `arm64`
- MP4Box path: `/usr/bin/MP4Box`
- GPAC CLI path: `/usr/bin/gpac`

Allowed future execution, if explicitly approved: build or reuse the render-worker image and run a tiny generated synthetic fixture through a narrow MP4Box command path under `--network none`. User/private/real media, arbitrary media probing, FFmpeg/FFprobe, render/export, public artifacts, signed URLs, Supabase/GCS, beta, production, and product runtime remain blocked unless separately approved.

Product-ready local OSS tools remain `0`; Track B FFmpeg/FFprobe ownership remains preserved; #577 remains excluded.
