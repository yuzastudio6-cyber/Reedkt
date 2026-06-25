# Package Presence QA

QA accepts the package presence proof from PR #738:

- `dpkg-query -W gpac` returned `gpac	26.02-rev0-g118e60a90-HEAD	arm64`.
- The selected source was official GPAC APT `https://dist.gpac.io/gpac/linux/debian bookworm/main`.
- The installed package was exactly `gpac=26.02-rev0-g118e60a90-HEAD`.

This proves package presence only. It does not prove GPAC/MP4Box runtime behavior, media command behavior, or product readiness.
