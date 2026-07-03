# Tool-Call Ranking Closeout

Track B closes the dry-run monitoring sequence with deterministic ranking accepted for future tool-call routing metadata only.

Default ranking:

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

Use-case routing remains scoped, not universal. Metadata probing prefers `ffprobe` / `mediainfo` / `exiftool`; structured analysis prefers `duckdb` / `polars_nodejs_polars`; image/color paths prefer `sharp_libvips`, `opencolorio`, `openimageio`, `imagemagick`, and `opencv` by task shape; video decode and scene analysis prefer `pyav` / `pyscenedetect`; OCR/ML CPU paths prefer `tesseract`, then bounded Paddle runtime/OCR evidence; media transforms keep `ffmpeg` as a later explicit operation path.

This closeout does not approve direct product tool calls. Future runtime approval still needs approved snapshot binding, credit gate checks, fail-closed worker dispatch, private artifact policy, result schemas, QA/fallback policy, sanitized logs, monitoring, and rollback.
