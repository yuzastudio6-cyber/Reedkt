# Production GPU Worker Tool Install Policy

The GPU worker is for future model-backed AI tasks after model-weight and worker readiness approval.

## Package Groups

- PyTorch and TorchVision: GPU tensor/vision foundation.
- Transformers: model runtime foundation for approved private model snapshots such as BiRefNet and future vision/language model paths.
- CTranslate2 and faster-whisper: future speech transcription runtime.
- Kornia and OpenCV headless: mask refinement and GPU/CV operations.
- rembg with GPU backend and transparent-background: background-removal fallback candidates after model/cache policy approval.
- SAM2 pinned source install and Real-ESRGAN package declaration: GPU model package candidates after source/build/model-weight gates.
- DeepFilterNet and Demucs: future audio cleanup and stem separation candidates.
- PaddleOCR/PaddlePaddle GPU: optional/planned OCR path.
- BiRefNet uses the Transformers model-loader path plus an approved private `ZhengPeng7/BiRefNet` snapshot. FILM remains pending source-install review before stable image declarations.

## Boundaries

GPU packages belong only in `gpu_ai_worker`. API, CPU, and render images must not carry model-heavy packages. Package declarations do not approve inference, model loading, media processing, production execution, or beta readiness. Those gates require worker image build proof, import smoke, approved private model-weight manifests, approved fixtures, and approved snapshot/credit gates.
