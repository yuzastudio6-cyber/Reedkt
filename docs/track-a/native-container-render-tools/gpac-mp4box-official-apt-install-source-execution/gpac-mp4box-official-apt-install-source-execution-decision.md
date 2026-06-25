# GPAC/MP4Box Official APT Install Source Execution Decision

Decision: `tracka_gpac_mp4box_official_apt_install_source_execution_passed_ready_for_install_source_qa`

The approved official GPAC APT install-source lane passed. The render-worker Dockerfile added the official GPAC `bookworm/main` source with `Signed-By`, package-only pinning, exact candidate selection, install simulation, exact `gpac=26.02-rev0-g118e60a90-HEAD` install, and network-disabled package/binary presence checks.

Accepted proof:

- Docker build passed for `reeditpro-tracka-gpac-mp4box-official-apt-install-source-execution-1:20260624T234132Z-834b63e`.
- `apt-cache policy gpac` selected `26.02-rev0-g118e60a90-HEAD` from `https://dist.gpac.io/gpac/linux/debian bookworm/main` for `arm64`.
- `dpkg-query -W gpac` returned `gpac	26.02-rev0-g118e60a90-HEAD	arm64`.
- `command -v MP4Box` returned `/usr/bin/MP4Box`.

Not accepted as proof and not approved: GPAC/MP4Box runtime behavior, `MP4Box -version`, media processing, render/export, product runtime, beta, or production.

Next prompt: `TRACKA-GPAC-MP4BOX-OFFICIAL-APT-INSTALL-SOURCE-QA-1`.

Product-ready local OSS tools: `0`. Track B FFmpeg/FFprobe ownership remains preserved. #577 remains open/draft/blocked and excluded as source-of-truth. Supabase classification: no write / environment none / SQL none / migration no.
