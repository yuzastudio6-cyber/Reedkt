# Tool-Call Ranking Review

Track B now has deterministic ranking metadata for all 16 owned tools. The ranking is not a universal claim that one tool is always better than another; it is a fail-closed default order for future dry-run routing when a recipe has not yet narrowed the tool class.

Default dry-run order: `ffprobe`, `mediainfo`, `exiftool`, `duckdb`, `polars_nodejs_polars`, `sharp_libvips`, `opencolorio`, `openimageio`, `imagemagick`, `opencv`, `pyav`, `pyscenedetect`, `tesseract`, `paddlepaddle`, `paddleocr`, `ffmpeg`.

The policy is to prefer the least risky matching tool first: metadata and probe-style routes before heavier analysis, deterministic OCR before ML OCR, color configuration before image-buffer handling, and media transforms only when an approved recipe explicitly requires them.

All ranking entries are dry-run-only and execution-disabled.
