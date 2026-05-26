# Production GPU Worker Tool Install Policy

The GPU worker is for future model-backed AI tasks after model-weight and worker readiness approval.

## Package Groups

- PyTorch and TorchVision: GPU tensor/vision foundation.
- CTranslate2 and faster-whisper: future speech transcription runtime.
- Kornia and OpenCV headless: mask refinement and GPU/CV operations.
- DeepFilterNet and Demucs: future audio cleanup and stem separation candidates.
- PaddleOCR/PaddlePaddle GPU: optional/planned OCR path.
- BiRefNet, SAM2, Real-ESRGAN, and FILM: pending source-install review before stable image declarations.

## Boundaries

GPU packages belong only in `gpu_ai_worker`. API, CPU, and render images must not carry model-heavy packages. M11 does not run inference, load models, produce masks, transcribe, denoise, separate stems, enhance, interpolate, or process media.
