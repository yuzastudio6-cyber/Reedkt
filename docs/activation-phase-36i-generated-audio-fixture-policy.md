# Phase 36I Generated Audio Fixture Policy

Phase 36I generated fixtures are deterministic 48 kHz mono WAV inputs:

- `generated-stretch-sine-noise-125`: 2.0s sine/noise, stretch `1.25x`, expected `2.5s ±2%`.
- `generated-stretch-chirp-075`: 2.0s chirp/sweep, stretch `0.75x`, expected `1.5s ±2%`.
- `generated-stretch-click-track-150`: 2.0s click/transient stress fixture, stretch `1.5x`, expected `3.0s ±5%`.

Generated audio payloads may be written only to temp/private artifact storage. Committed reports contain hashes, metrics, fixture IDs, and privacy summaries only.
