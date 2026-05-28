# Phase 26 Model License Approval

Phase 26 adds a static/report-only model-weight and license approval workflow
for the first speech/caption model scope.

Approved for staging planning:

- `Systran/faster-whisper-tiny`
- `faster_whisper`
- `ctranslate2`
- staging speech/caption only
- Phase 28 first real video speech/caption planning

Still blocked:

- model downloads and runtime availability
- production, paid production, external beta
- broad real user media testing
- larger Whisper models
- BiRefNet, SAM2, DeepFilterNet, Demucs, Real-ESRGAN, FILM, PaddleOCR GPU
- providers and Revideo

Phase 27 GPU staging remains optional/deferred for the tiny speech/caption
scope. Phase 28 can be planned after this approval, but execution remains
blocked until the tiny model weights are explicitly downloaded/loaded into the
approved private path with revision and checksum evidence.
