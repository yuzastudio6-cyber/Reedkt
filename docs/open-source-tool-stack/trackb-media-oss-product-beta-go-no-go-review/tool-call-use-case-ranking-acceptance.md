# Tool Call Use Case Ranking Acceptance

The deterministic ranking matrix is accepted for source-truth and dry-run routing review only.
Global dry-run order: `ffprobe`, `mediainfo`, `exiftool`, `duckdb`, `polars_nodejs_polars`, `sharp_libvips`, `opencolorio`, `openimageio`, `imagemagick`, `opencv`, `pyav`, `pyscenedetect`, `tesseract`, `paddlepaddle`, `paddleocr`, `ffmpeg`.
Metadata analysis order: `ffprobe`, `mediainfo`, `exiftool`, `duckdb`, `polars_nodejs_polars`.
Video analysis order: `ffprobe`, `mediainfo`, `pyav`, `opencv`, `pyscenedetect`.
Color/image order: `sharp_libvips`, `opencolorio`, `openimageio`, `imagemagick`, `opencv`.
OCR order: `tesseract`, `paddlepaddle`, `paddleocr`.
`ffmpeg` remains the deferred high-risk transform tool until a separate product runtime approval permits actual media transforms.
