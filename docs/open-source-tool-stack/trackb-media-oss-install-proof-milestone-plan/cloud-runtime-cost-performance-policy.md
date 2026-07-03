# Cloud Runtime Cost/Performance Policy

Track B should be cost-friendly, not GPU-avoidant.

- CPU workers are the default for metadata inspection, tiny synthetic proofs, small fixtures, and tools that are CPU/RAM-bound.
- GPU workers are future/on-demand only for heavy OCR, high-volume CV, hardware decode/encode, high-resolution processing, or beta-quality latency needs.
- Milestone 1 remains CPU-only/default and does not create or run workers.

Future packaging direction:

- `trackb-media-cpu-worker`: ExifTool, MediaInfo, Tesseract, ImageMagick / GraphicsMagick, OpenCV CPU, PyAV, PySceneDetect, OpenColorIO, OpenImageIO, Sharp/libvips, DuckDB, Polars, FFmpeg, FFprobe.
- `trackb-media-gpu-worker`: PaddlePaddle GPU, PaddleOCR GPU, optional OpenCV GPU, optional FFmpeg hardware acceleration.
