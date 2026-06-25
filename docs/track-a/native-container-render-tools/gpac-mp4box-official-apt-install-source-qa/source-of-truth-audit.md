# GPAC/MP4Box Official APT Install Source QA Source Audit

Lane: `TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-QA-1`

Decision: `tracka_gpac_mp4box_official_apt_install_source_qa_passed_ready_for_controlled_runtime_proof`

This QA packet reviews merged PR #738 install-source evidence only. PR #738 merged as `bba6c200a444c2eb279ad72e5c51409b072099cb` with decision `tracka_gpac_mp4box_official_apt_install_source_execution_passed_ready_for_install_source_qa`.

Accepted source facts:

- Source class: `official_gpac_apt_repository`
- Repository: `https://dist.gpac.io/gpac/linux/debian`
- Codename/component: `bookworm` / `main`
- Blocked component: `nightly`
- Key endpoint: `https://dist.gpac.io/gpac/linux/gpg.asc`
- Source file: `/etc/apt/sources.list.d/gpac.sources`
- Keyring: `/usr/share/keyrings/gpac-archive-keyring.gpg`
- Preferences: `/etc/apt/preferences.d/gpac.pref`
- Package: `gpac`
- Candidate: `26.02-rev0-g118e60a90-HEAD`
- Architecture: `arm64`
- MP4Box path: `/usr/bin/MP4Box`

PR #735, PR #729, PR #725, PR #723, PR #711, PR #713, PR #706, PR #702, PR #697, PR #690, PR #693, PR #682, PR #680, PR #673, PR #666, PR #662, PR #659, and PR #652 remain predecessor source truth. PR #701 and PR #708 are closed stale context. PR #577 remains open/draft/blocked and excluded as source-of-truth.

This phase did not run GPAC, MP4Box, Docker, apt, Bento4, VapourSynth, Revideo, Hyperframe, GStreamer, MKVToolNix, FFmpeg/FFprobe, Remotion, media processing, workers/routes/providers, Supabase/GCS, beta, or production scope.

Next prompt: `TRACKA-GPAC-MP4BOX-CONTROLLED-RUNTIME-PROOF-1`.
