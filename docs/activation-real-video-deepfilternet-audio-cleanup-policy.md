# Phase 36D Real-Video DeepFilterNet Audio Cleanup Policy

Phase 36D allows exactly one controlled real-video audio AI cleanup sample using
the approved Phase 32 chain and DeepFilterNet v0.5.6 artifacts already stored in
private staging GCS.

Allowed:

- Private GCS read/write for approved Phase 36D prefixes.
- CPU-only Cloud Run Job execution.
- FFmpeg audio extraction and private review remux.
- DeepFilterNet v0.5.6 CLI execution with the approved ONNX archive.

Blocked:

- Arbitrary user media or any new source video.
- RNNoise, Demucs, providers, Revideo, FILM, and slow motion.
- External model/tool downloads or alternate DeepFilterNet artifacts.
- Public URLs, public buckets, signed URLs as source of truth, and secrets.
- Final delivery, production, external beta, paid production, and broad real
  media.
