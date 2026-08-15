# WeEditPro Production GPU Worker Tool Install Policy

The GPU worker is for future model-backed AI tasks after model-weight and worker readiness approval.

Current supersession: SAM 2 is historical-read-only and has no build,
checkpoint, subprocess, router, fallback, or fresh-dispatch path. New subject
segmentation and tracking may use only the versioned SAM 3.1 operation after
its gated checkpoint, pinned source, A100 80 GB primary route, separately
qualified L4 fallback, task-QA route, supply chain, cost, and quality releases
all pass. No SAM model is installed on a developer machine.

## Package Groups

- PyTorch and TorchVision: GPU tensor/vision foundation.
- CTranslate2 and faster-whisper: future speech transcription runtime.
- Kornia and OpenCV headless: mask refinement and GPU/CV operations.
- DeepFilterNet and Demucs: future audio cleanup and stem separation candidates.
- PaddleOCR/PaddlePaddle GPU: optional/planned OCR path.
- SAM 3.1: dedicated offline, immutable cloud image candidates only; gated
  checkpoint excluded from images and mounted privately at execution time.
- BiRefNet, Real-ESRGAN, and FILM: pending source-install review before stable
  image declarations.

## Boundaries

GPU packages belong only in purpose-bound GPU images. API, control-plane CPU,
and render images must not carry model-heavy packages. Heavy models use A100
80 GB primary; L4 may be used only for normal GPU processing or a separately
quality-qualified fallback. Jobs are user-triggered, scale from zero, and must
return to zero after evidence and cost reconciliation. Historical M11 source
declarations did not run inference or authorize model use.
