# TRACKB_MEDIA_OSS_INSTALL_PROOF_MILESTONE_PLAN

## Summary

Create the next docs/diagnostics-only milestone plan for `TRACK_B_MEDIA_OSS_STEWARD` after the owner registry lands. The milestone must plan install-proof sequencing for the 11 Track B media OSS tools that remain blocked/not installed-proven; it must not install, probe, process media, render/export, execute workers/routes/providers, mutate Supabase/GCS, create public artifacts, create signed URLs, run raw prompts, unlock beta, or unlock production.

## Source Evidence

- Owner ID: `TRACK_B_MEDIA_OSS_STEWARD`
- Owned tools: 16
- Accepted/proven bounded Batch 1 tools: FFmpeg, FFprobe, Sharp/libvips, DuckDB, Polars / nodejs-polars
- Remaining blocked/not installed-proven tools: OpenCV, PyAV, PySceneDetect, PaddleOCR, PaddlePaddle, MediaInfo, ExifTool, ImageMagick / GraphicsMagick, Tesseract, OpenColorIO, OpenImageIO
- End-to-end product-ready Track B tools: 0

## Future Milestone Candidates

1. Metadata and inspection utilities: ExifTool, MediaInfo, Tesseract, ImageMagick / GraphicsMagick.
2. Video/image analysis utilities: OpenCV, PyAV, PySceneDetect.
3. OCR stack review: PaddleOCR and PaddlePaddle.
4. Color and image pipeline review: OpenColorIO and OpenImageIO.
5. Track B steward rollup after approved install-proof execution.

Each future milestone requires a separate approval packet before dependency installation, binary installation, version probes, import proofs, media file probing, image processing, OCR execution, color processing, worker execution, route/provider execution, or render/export.

## Required Safety

Do not claim 40+ tools are installed/proven end-to-end. Do not claim all 16 Track B tools are product-ready. Preserve Supabase classification: no write / environment none / SQL none / migration no.
