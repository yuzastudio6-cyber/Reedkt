# Ranking Confirmation

The limited internal beta dry-run lane preserves the Track B ranking policy: least-risky matching tool first.

Global order:

1. `ffprobe`
2. `mediainfo`
3. `exiftool`
4. `duckdb`
5. `polars_nodejs_polars`
6. `sharp_libvips`
7. `opencolorio`
8. `openimageio`
9. `imagemagick`
10. `opencv`
11. `pyav`
12. `pyscenedetect`
13. `tesseract`
14. `paddlepaddle`
15. `paddleocr`
16. `ffmpeg`

This keeps metadata/probe routes before heavier analysis, deterministic OCR before ML OCR, color configuration before image-buffer handling, and FFmpeg deferred to explicit transform recipes.
