# CPU/GPU Compute Policy

The Track B policy is cost-friendly, not GPU-avoidant. CPU is the default for metadata-only, lightweight, and fast-enough proof work. GPU is justified when latency, memory pressure, high-volume processing, or beta-quality edit experience would make CPU execution slow or timeout-prone.

| Compute class | Tools |
| --- | --- |
| CPU-only/default | FFprobe, Sharp/libvips, DuckDB, Polars / nodejs-polars, MediaInfo, ExifTool, Tesseract |
| CPU default, GPU optional/recommended later | FFmpeg, OpenCV, PyAV, PySceneDetect, ImageMagick / GraphicsMagick, OpenColorIO, OpenImageIO |
| CPU tiny proof first, GPU recommended/required for heavy beta workloads | PaddleOCR, PaddlePaddle |

Milestone 1 is CPU-only/default. No GPU, media processing, media file probing, render/export, or worker runtime is approved now.
