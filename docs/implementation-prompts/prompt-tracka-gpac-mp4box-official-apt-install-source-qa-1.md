# TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-QA-1

Next gate: QA-review only for the GPAC/MP4Box official APT install-source execution evidence.

Required source truth:

- Decision to review: `tracka_gpac_mp4box_official_apt_install_source_execution_passed_ready_for_install_source_qa`
- Repository: `https://dist.gpac.io/gpac/linux/debian`
- Codename: `bookworm`
- Component: `main`
- Blocked component: `nightly`
- Key endpoint: `https://dist.gpac.io/gpac/linux/gpg.asc`
- Keyring: `/usr/share/keyrings/gpac-archive-keyring.gpg`
- Source file: `/etc/apt/sources.list.d/gpac.sources`
- Preferences file: `/etc/apt/preferences.d/gpac.pref`
- Package: `gpac`
- Candidate proven in execution evidence: `26.02-rev0-g118e60a90-HEAD`
- Architecture proven in execution evidence: `arm64`
- MP4Box binary presence path: `/usr/bin/MP4Box`

QA must accept only install-source/package-presence evidence unless a separately approved prompt authorizes runtime commands. Do not run GPAC, MP4Box, media processing, Bento4, VapourSynth, Revideo, Hyperframe, GStreamer, MKVToolNix, FFmpeg/FFprobe, Docker build/run, apt source mutation, apt key import, apt update, package install, render/export, workers/routes/providers, Supabase/GCS, beta, or production.

Product-ready local OSS tools remain `0`; Track B FFmpeg/FFprobe ownership remains preserved; #577 remains excluded.
