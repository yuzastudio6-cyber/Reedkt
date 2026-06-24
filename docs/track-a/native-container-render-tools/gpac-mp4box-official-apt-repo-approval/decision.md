# Decision

Decision: `tracka_gpac_mp4box_official_apt_repo_approval_passed_ready_for_pinning_keyring_install_source_plan`

Approved for future planning only: `official_gpac_apt_repository`

Future repository URI: `https://dist.gpac.io/gpac/linux/debian`

Future codename: `bookworm`

Future component: `main`

Blocked component: `nightly`

Future key endpoint: `https://dist.gpac.io/gpac/linux/gpg.asc`

Future package candidate: `gpac`

This decision approves the official GPAC APT repository source class only for a future pinning/keyring/install-source plan. It does not approve installing GPAC, running MP4Box, mutating Dockerfiles, adding apt sources, importing apt keys, running `apt update`, changing requirements, changing package-lock, changing runtime source, or using GPAC/MP4Box in product/runtime scope.

Bento4 remains `separate_not_selected_for_mp4box_command_path`. VapourSynth remains separately blocked pending owner/environment source approval. Revideo remains evaluation-only owner-gated. Hyperframe remains handoff-only. GStreamer/MKVToolNix remain QA-accepted bounded generated fixture evidence and were not rerun.

Product-ready local OSS tools: `0`

Track B FFmpeg/FFprobe ownership remains preserved.

#577 remains open/draft/blocked and excluded as source-of-truth.

Supabase classification: no write / environment none / SQL none / migration no

Next prompt: `TRACKA-GPAC-MP4BOX-PINNING-KEYRING-INSTALL-SOURCE-PLAN-1`
