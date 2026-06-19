# Track B Media OSS Tool Status

Decision: `trackb_media_oss_steward_registry_passed_ready_for_install_proof_milestone_plan`

Owner: `TRACK_B_MEDIA_OSS_STEWARD`

| Status group | Count | Tools |
| --- | ---: | --- |
| Accepted/proven bounded Batch 1 | 5 | FFmpeg, FFprobe, Sharp/libvips, DuckDB, Polars / nodejs-polars |
| Blocked/not installed-proven | 11 | OpenCV, PyAV, PySceneDetect, PaddleOCR, PaddlePaddle, MediaInfo, ExifTool, ImageMagick / GraphicsMagick, Tesseract, OpenColorIO, OpenImageIO |
| End-to-end product-ready | 0 | None |

FFmpeg and FFprobe are accepted only as Track A container-path version proof at `5.1.9-0+deb12u1`. That does not authorize media input, file probing, decode/encode, caption burn-in, render/export, worker/runtime execution, public artifacts, signed URLs, beta, or production.

Sharp/libvips, DuckDB, and Polars/nodejs-polars are accepted only within their committed bounded proof lanes. They are not evidence that Track B media processing is product-ready.
