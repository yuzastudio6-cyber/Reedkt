# Phase 26B Model Download

Phase 26B turns the Phase 26 approval for `Systran/faster-whisper-tiny` into
private staging model availability evidence.

It downloads only the approved tiny model outside the repo, computes checksums,
uploads the snapshot and manifest files to private staging GCS, and updates the
activation reports with revision/checksum evidence.

Still blocked:

- larger Whisper models
- BiRefNet, SAM2, DeepFilterNet, Demucs, Real-ESRGAN, FILM, PaddleOCR GPU
- providers
- GPU deployment
- transcription execution
- real user media processing
- production, paid production, external beta, and broad real user media testing

Phase 28 can become model-availability-ready after Phase 26B, but execution is
still blocked until a speech runtime image/job is deployed and verified.
