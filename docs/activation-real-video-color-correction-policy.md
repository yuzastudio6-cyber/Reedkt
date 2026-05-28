# Phase 32 Color Correction Policy

Phase 32 allows FFmpeg-only clean color review/correction.

- Prefer no-op color-reviewed export when analysis does not justify visible correction.
- Minimal correction may use only allowlisted `eq` adjustments.
- No arbitrary FFmpeg args, unapproved LUTs, OpenColorIO, OpenImageIO, GPU, or providers.
- Preserve the Phase 31 audio stream when safe.
- FFmpeg production commercial review remains blocked; this is a controlled staging activation test.
