# TRACKA-GPAC-MP4BOX-CONTROLLED-RUNTIME-PROOF-1

Next gate: bounded runtime proof for GPAC/MP4Box after install-source QA.

Required source truth:

- Install-source QA decision: `tracka_gpac_mp4box_official_apt_install_source_qa_passed_ready_for_controlled_runtime_proof`
- Install-source execution decision: `tracka_gpac_mp4box_official_apt_install_source_execution_passed_ready_for_install_source_qa`
- Repository: `https://dist.gpac.io/gpac/linux/debian`
- Codename/component: `bookworm` / `main`
- Blocked component: `nightly`
- Package: `gpac`
- Candidate proven in PR #738 evidence: `26.02-rev0-g118e60a90-HEAD`
- Architecture: `arm64`
- MP4Box binary path: `/usr/bin/MP4Box`

Allowed future execution, if the prompt is explicitly approved: build or reuse the render-worker image from the current source and run network-disabled, non-media runtime checks for GPAC/MP4Box such as binary version/provenance. Media commands, user/private/real media, broad probing, render/export, public artifacts, signed URLs, Supabase/GCS, beta, and production remain blocked unless separately approved.

Product-ready local OSS tools remain `0`; Track B FFmpeg/FFprobe ownership remains preserved; #577 remains excluded.
