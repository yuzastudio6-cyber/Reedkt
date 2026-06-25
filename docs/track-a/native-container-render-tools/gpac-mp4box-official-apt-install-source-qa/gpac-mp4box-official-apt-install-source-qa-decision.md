# GPAC/MP4Box Official APT Install Source QA Decision

Decision: `tracka_gpac_mp4box_official_apt_install_source_qa_passed_ready_for_controlled_runtime_proof`

QA accepts PR #738 as install-source/package-presence evidence:

- official GPAC APT source `https://dist.gpac.io/gpac/linux/debian`;
- suite/component `bookworm` / `main`;
- blocked component `nightly`;
- key endpoint `https://dist.gpac.io/gpac/linux/gpg.asc`;
- source/keyring/preferences paths `/etc/apt/sources.list.d/gpac.sources`, `/usr/share/keyrings/gpac-archive-keyring.gpg`, and `/etc/apt/preferences.d/gpac.pref`;
- exact package `gpac=26.02-rev0-g118e60a90-HEAD` on `arm64`;
- `/usr/bin/MP4Box` binary presence under `--network none`.

QA does not accept GPAC/MP4Box runtime behavior, `MP4Box -version`, MP4Box media commands, media processing, product runtime, beta, or production approval. Product-ready local OSS tools remain `0`. Track B FFmpeg/FFprobe ownership remains preserved. #577 remains open/draft/blocked and excluded as source-of-truth. Supabase classification: no write / environment none / SQL none / migration no.

Next prompt: `TRACKA-GPAC-MP4BOX-CONTROLLED-RUNTIME-PROOF-1`.
