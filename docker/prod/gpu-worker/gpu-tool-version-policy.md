# GPU Tool Version Policy

Milestone 11 now pins the direct AI graphics GPU package declarations so worker
image builds are reproducible enough for install proof. Exact production
promotion still requires CUDA compatibility, vulnerability review, model-card
review, benchmark approval, and runtime QA before production execution.

M11 package declarations are grouped as:

- package-declared and pinned for AI graphics install proof: PyTorch
  `2.5.1+cu124`, TorchVision `0.20.1+cu124`, Transformers `4.57.6`,
  Kornia `0.8.1`, OpenCV headless `4.12.0.88`, rembg GPU `2.0.76`,
  transparent-background `1.3.4`, and Real-ESRGAN `0.3.0`;
- package-declared for adjacent GPU worker lanes: CTranslate2,
  faster-whisper, DeepFilterNet, and Demucs;
- source-declared: pinned facebookresearch/SAM2 source install;
- model-loader path: BiRefNet through Transformers plus an approved private
  model snapshot;
- optional/planned: PaddleOCR and PaddlePaddle GPU;
- pending source install review: FILM.

Worker image builds run import-only install smokes. They must not run inference,
load weights, process user media, call providers, or require a local GPU unless a
later strict environment check explicitly asks for that.
