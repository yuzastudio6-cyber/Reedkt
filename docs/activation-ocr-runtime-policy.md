# OCR Runtime Policy

The future Phase 37C OCR runtime is CPU-first. It should use a pinned Python runtime, pinned PaddlePaddle CPU runtime, pinned PaddleOCR package, OpenCV headless image support, Pillow/numpy, and a private model copy path.

Runtime model auto-download is forbidden. GPU OCR runtime is deferred unless later evidence proves CPU is insufficient. Provider calls, public access, Revideo, production, external beta, and broad real media remain blocked.
