# Phase 47A Track Integration Audit Policy

Phase 47A reconciles Track A visual/video readiness with the latest Track B audio, OCR, VLM, and data/hybrid readiness stack. It is an audit phase only.

Execution requires `GCP_PROJECT_ID=reeditpro`, `GCP_REGION=us-central1`, `REEDITPRO_ENV=staging`, and `REEDITPRO_CONFIRM_TRACK_INTEGRATION_AUDIT=true`.

Allowed work:

- Read committed sanitized Track A and Track B evidence.
- Verify private GCS evidence/report objects.
- Produce private JSON audit artifacts under `activation-track-integration/phase47a/<runId>/`.
- Reconcile package scripts, docs, tool ownership, readiness state, and blocked gates.

Blocked work:

- No media processing.
- No provider calls.
- No Docker build/push.
- No Cloud Run deploy/execute.
- No public URLs or public bucket access.
- No final delivery.
- No production, external beta, paid production, or broad real-media unlock.
- No Revideo execution.
- No `package-lock.json` change.

Track A owns FFmpeg, FFprobe, libass, Remotion, OpenTimelineIO, OpenColorIO, OpenImageIO, BiRefNet, SAM2, Kornia, Real-ESRGAN, FILM, and the full private visual-video E2E chain.

Track B owns DeepFilterNet, Demucs, Signalsmith, PaddleOCR/PaddlePaddle, Qwen/VLM/vLLM, OpenCV/PyAV/PySceneDetect/Sharp/DuckDB/Polars, and hybrid compute routing. RNNoise remains removed from active product routing.
