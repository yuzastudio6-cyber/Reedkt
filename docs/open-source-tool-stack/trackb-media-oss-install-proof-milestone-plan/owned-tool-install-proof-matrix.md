# Owned Tool Install/Proof Matrix

Owner: `TRACK_B_MEDIA_OSS_STEWARD`

| Tool | Current status | Milestone | Future proof expectation |
| --- | --- | --- | --- |
| FFmpeg | Accepted/proven bounded | M5 | Runtime planning only; current proof is Track A container version-only |
| FFprobe | Accepted/proven bounded | M5 | Media-probe approval required before file probing |
| Sharp/libvips | Accepted/proven bounded | Existing | Import/version only; no real image processing |
| DuckDB | Accepted/proven bounded | Existing | Native rebuild, import/API shape, tiny in-memory query |
| Polars / nodejs-polars | Accepted/proven bounded | Existing | Import/version and tiny in-memory dataframe metadata |
| OpenCV | Blocked/not installed-proven | M2 | CPU-first import/version and tiny synthetic CV fixture |
| PyAV | Blocked/not installed-proven | M2 | CPU-first import/version and tiny synthetic container/header fixture |
| PySceneDetect | Blocked/not installed-proven | M2 | CPU-first import/version and synthetic scene-boundary fixture |
| PaddleOCR | Blocked/not installed-proven | M3 | CPU tiny proof first; GPU review for heavy OCR |
| PaddlePaddle | Blocked/not installed-proven | M3 | CPU tiny proof first; GPU review for PaddleOCR/heavy ML |
| MediaInfo | Blocked/not installed-proven | M1 | CPU-only version proof and tiny synthetic media-header fixture if safe |
| ExifTool | Blocked/not installed-proven | M1 | CPU-only version proof and tiny synthetic metadata fixture |
| ImageMagick / GraphicsMagick | Blocked/not installed-proven | M1 | ImageMagick preferred, CPU-default tiny synthetic image transform |
| Tesseract | Blocked/not installed-proven | M1 | CPU-only version proof and tiny synthetic OCR fixture |
| OpenColorIO | Blocked/not installed-proven | M4 | CPU proof first; GPU later only for separately approved preview/render color workflows |
| OpenImageIO | Blocked/not installed-proven | M4 | CPU proof first; GPU later only for separately approved advanced image pipeline workflows |

No tool is end-to-end product-ready from this plan. Milestone 1 is approved only as a future execution lane.
