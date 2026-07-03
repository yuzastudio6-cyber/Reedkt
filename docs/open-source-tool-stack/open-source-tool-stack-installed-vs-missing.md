# Installed Vs Missing Audit

No host or container execution was performed. The statuses below are evidence classifications only.

| Install status | Count | Tools |
| --- | --- | --- |
| package_declared | 22 | opencv, pyav, pyscenedetect, sharp_libvips, duckdb, polars, paddleocr, paddlepaddle, deepfilternet, faster_whisper, torch_torchvision, transformers, sam2, birefnet, real_esrgan, kornia, ctranslate2, remotion, opentimelineio, playwright_chromium, maplibre, turf |
| system_binary_declared | 4 | ffmpeg, ffprobe, film, libass |
| docs_only | 28 | mediainfo, exiftool, imagemagick_graphicsmagick, tesseract, signalsmith_stretch, audioflux, rnnoise, librosa, mmaudio, whisper_cpp, onnxruntime, rembg, transparent_background, d3, echarts, pixijs, three_js, babylon_js, lottie, konva, vega_lite, opencolorio, openimageio, hyperframe, vapoursynth, revideo, deck_gl, cesium_js |
| missing | 11 | soundfile_libsndfile, sox, aubio, vllm, qwen3_vl, gstreamer, bento4_mp4box, mkvtoolnix, gdal_ogr, tippecanoe, pmtiles |
| blocked | 6 | demucs, rubber_band, essentia, qwen_deepseek_provider_api, lyria_provider_api, mirelo_provider_api |
| unknown | 0 |  |
| installed | 0 |  |

Important interpretation:

- `package_declared` means a package or requirement is declared in repo files, not that the tool was executed.
- `system_binary_declared` means a Dockerfile/readiness expectation names a binary, not that the binary was run.
- `missing` means this branch has no committed package/container evidence for the candidate.
- `blocked` means committed policy keeps the candidate out of install/proof until a separate review.
