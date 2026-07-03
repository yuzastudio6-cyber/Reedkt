# Use-Case Routing And Ranking Review

The deterministic ranking is approved for the next controlled runtime dry-run gate as a default tie-breaker, not a universal quality claim.

Use-case routing:

- Source introspection: `ffprobe`, `mediainfo`, `exiftool`
- Structured metadata analysis: `duckdb`, `polars_nodejs_polars`
- Image/color analysis: `sharp_libvips`, `opencolorio`, `openimageio`
- Image processing fallback: `imagemagick`
- Video frame analysis: `opencv`, `pyav`, `pyscenedetect`
- OCR text analysis: `tesseract`, `paddlepaddle`, `paddleocr`
- High-risk explicit transforms: `ffmpeg`

The next gate must still prove that product routing chooses tools by approved recipe and use case. It must not route every request through the top global rank.
