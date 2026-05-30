# OCR Runtime Policy

The future Phase 37C OCR runtime is CPU-first. It should use a pinned Python runtime, pinned PaddlePaddle CPU runtime, pinned PaddleOCR package, OpenCV headless image support, Pillow/numpy, and a private model copy path.

Runtime model auto-download is forbidden. The first safe-zone v1 runtime profile must use the Phase 37B private det/rec/dictionary assets and must set `use_doc_orientation_classify=false`, `use_doc_unwarping=false`, and `use_textline_orientation=false`. `PP-LCNet_x1_0_textline_ori` is optional/deferred and any attempt to fetch it by default must fail the runtime verification gate.

GPU OCR runtime is deferred unless later evidence proves CPU is insufficient. Provider calls, public access, Revideo, production, external beta, broad real media, real-video OCR, and caption/render integration remain blocked.
