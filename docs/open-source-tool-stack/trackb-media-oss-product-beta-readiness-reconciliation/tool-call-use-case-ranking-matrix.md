# Tool Call Use Case Ranking Matrix

Ranking remains a dry-run routing aid only; it does not authorize live execution.
Global dry-run order: `ffprobe`, `mediainfo`, `exiftool`, `duckdb`, `polars_nodejs_polars`, `sharp_libvips`, `opencolorio`, `openimageio`, `imagemagick`, `opencv`, `pyav`, `pyscenedetect`, `tesseract`, `paddlepaddle`, `paddleocr`, `ffmpeg`.
Metadata analysis order: `ffprobe`, `mediainfo`, `exiftool`, `duckdb`, `polars_nodejs_polars`.
Video analysis order: `ffprobe`, `mediainfo`, `pyav`, `opencv`, `pyscenedetect`.
Color/image order: `sharp_libvips`, `opencolorio`, `openimageio`, `imagemagick`, `opencv`.
OCR order: `tesseract`, `paddlepaddle`, `paddleocr`.
`ffmpeg` remains the deferred high-risk transform tool until separate product runtime approval.
