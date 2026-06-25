# Proof Evidence Acceptance

QA accepts PR #764 only as bounded generated synthetic media-command evidence.

Accepted evidence:
- `gpac=26.02-rev0-g118e60a90-HEAD` on `arm64`.
- `/usr/bin/MP4Box`.
- `MP4Box -add generated-synthetic-subtitles.srt:hdlr=sbtl -new generated-synthetic-subtitle-only.mp4`.
- `MP4Box -info generated-synthetic-subtitle-only.mp4`.
- Input fixture: 73 bytes, SHA-256 `8070a36d0b5f724e75512fa1ab2f722b75aaba91ec46a37936d38cb6fa9f42ea`.
- Output fixture: 857 bytes, SHA-256 `afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8`.
- `MP4Box -info` reported one `sbtl:tx3g` track with codec `tx3g`.
- Proof ran under `--network none` and cleanup passed.

QA does not accept user/private/real media readiness, arbitrary media probing, FFmpeg/FFprobe ownership transfer, render/export readiness, product runtime readiness, beta readiness, or production readiness.
