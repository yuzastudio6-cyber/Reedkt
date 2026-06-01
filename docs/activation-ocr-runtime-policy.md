# OCR Runtime Policy

Phase 37C implements the first OCR runtime verification path as CPU-first, local-first, and generated-fixture only. It uses a pinned isolated Python venv, pinned PaddlePaddle/PaddleOCR packages, OpenCV headless image support, Pillow/numpy, and a private model copy path under `/tmp`.

Runtime model auto-download is forbidden. The safe-zone v1 runtime profile must use the Phase 37B private det/rec/dictionary assets and must set `use_doc_orientation_classify=false`, `use_doc_unwarping=false`, and `use_textline_orientation=false` where supported by the installed PaddleOCR constructor. The verified dictionary path is passed when a supported PaddleOCR dictionary-path parameter is available. `PP-LCNet_x1_0_textline_ori` is optional/deferred and any runtime attempt to fetch it by default must fail the runtime verification gate.

The generated OCR fixtures are high-contrast UI text, lower caption safe-zone conflict text, multi-region UI text, low-contrast warning text, small-text warning text, and deferred rotated text. Required generated fixtures must pass recall, confidence, and broad-region checks before Phase 37D can be considered.

GPU OCR runtime is deferred unless later evidence proves CPU is insufficient. Provider calls, public access, Revideo, production, external beta, broad real media, real-video OCR, and caption/render integration remain blocked.
