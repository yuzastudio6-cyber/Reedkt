# GPU Tool Version Policy

Milestone 11 does not pin final production versions. Exact GPU package versions,
CUDA compatibility, vulnerability review, model-card review, and benchmark
approval happen before production execution.

M11 package declarations are grouped as:

- package-declared: PyTorch, TorchVision, CTranslate2, faster-whisper, Kornia,
  OpenCV headless, DeepFilterNet, and Demucs;
- optional/planned: PaddleOCR and PaddlePaddle GPU;
- pending source install review: BiRefNet, SAM 3.1, Real-ESRGAN, and FILM.

SAM 2 is historical-only. New plan, fallback, repair, and runtime admission must
use the separately pinned and qualified SAM 3.1 operation.

Readiness may validate declarations and optional imports. It must not run
inference, load weights, process user media, call providers, or require a local
GPU unless a later strict environment check explicitly asks for that.
