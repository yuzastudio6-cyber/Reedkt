# Decision

Decision: `tracka_gpac_mp4box_pinning_keyring_install_source_plan_passed_ready_for_official_apt_install_source_execution`

Selected source class: `official_gpac_apt_repository`

Future repository URI: `https://dist.gpac.io/gpac/linux/debian`

Future codename: `bookworm`

Future component: `main`

Blocked component: `nightly`

Future source file: `/etc/apt/sources.list.d/gpac.sources`

Future key endpoint: `https://dist.gpac.io/gpac/linux/gpg.asc`

Future keyring path: `/usr/share/keyrings/gpac-archive-keyring.gpg`

Future preferences file: `/etc/apt/preferences.d/gpac.pref`

Future package candidate: `gpac`

Future install form: `gpac=<candidate-version>`

This decision approves moving to the official APT install-source execution gate only. It does not approve adding the apt source, importing the key, running `apt update`, installing `gpac`, mutating Dockerfiles, mutating requirements, mutating package-lock, mutating runtime source, running GPAC/MP4Box, processing media, or using GPAC/MP4Box in product/runtime scope.

Bento4 remains `separate_not_selected_for_mp4box_command_path`. VapourSynth remains separately blocked pending owner/environment source approval. Revideo remains evaluation-only owner-gated. Hyperframe remains handoff-only. GStreamer/MKVToolNix remain QA-accepted bounded generated fixture evidence and were not rerun.

Product-ready local OSS tools: `0`

Track B FFmpeg/FFprobe ownership remains preserved.

#577 remains open/draft/blocked and excluded as source-of-truth.

Supabase classification: no write / environment none / SQL none / migration no

Next prompt: `TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-EXECUTION-1`
