# Phase 31 Audio Cleanup Policy

Phase 31 allows deterministic FFmpeg loudness cleanup only.

- Target integrated loudness: `-16 LUFS`.
- Target true peak: `-1.5 dBTP`.
- Target loudness range: `11`.
- Preserve the approved Phase 30B video stream where safe.
- Normalize audio with FFmpeg `loudnorm`; do not denoise or separate stems.
- FFmpeg production commercial review remains blocked; this is a controlled staging activation test.
