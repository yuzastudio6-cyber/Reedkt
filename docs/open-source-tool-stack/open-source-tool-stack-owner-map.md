# Owner Map

## AI_TOOLS_CREATIVE_GRAPHICS

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Torch/TorchVision | torch_torchvision | package_declared | smoke_only | Batch 6 should verify import torch without model execution in approved runtime. |
| Transformers | transformers | package_declared | docs_only | Batch 6 should verify package resolution only after model-weight approval path is defined. |
| SAM2 | sam2 | package_declared | smoke_only | Batch 7 should prove package import/model path policy only; no video segmentation. |
| BiRefNet | birefnet | package_declared | smoke_only | Batch 7 should prove dependency import and blocked model-weight policy. |
| rembg | rembg | docs_only | not_proven | Backlog alternate background removal review only. |
| transparent-background | transparent_background | docs_only | not_proven | Backlog alternate background removal review only. |
| Real-ESRGAN | real_esrgan | package_declared | smoke_only | Batch 7 should verify import and model path policy only. |
| Kornia | kornia | package_declared | docs_only | Batch 6 should verify import only after GPU runtime review. |
| D3 | d3 | docs_only | docs_only | Backlog route-only chart metadata proof or package declaration review. |
| ECharts | echarts | docs_only | docs_only | Backlog chart package selection review. |
| PixiJS | pixijs | docs_only | not_proven | Backlog only if Remotion/CSS cannot cover planned graphics. |
| Three.js | three_js | docs_only | not_proven | Backlog 3D graphics review before dependency proposal. |
| Babylon.js | babylon_js | docs_only | not_proven | Backlog alternate 3D graphics review. |
| Lottie | lottie | docs_only | not_proven | Backlog motion asset review before execution. |
| Konva | konva | docs_only | not_proven | Backlog canvas graphics review. |
| Vega-Lite | vega_lite | docs_only | not_proven | Backlog chart candidate review. |

## MAP_GEOSPATIAL

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| MapLibre | maplibre | package_declared | docs_only | Batch 9 should verify package resolution only. |
| Turf | turf | package_declared | docs_only | Batch 9 should verify import only with synthetic metadata. |
| GDAL/OGR | gdal_ogr | missing | not_proven | Backlog geospatial install review only after MapLibre/Turf proof. |
| Tippecanoe | tippecanoe | missing | not_proven | Backlog vector tile review only if needed. |
| PMTiles | pmtiles | missing | not_proven | Backlog private tile packaging review only. |
| deck.gl | deck_gl | docs_only | not_proven | Backlog map visualization review after MapLibre proof. |
| CesiumJS | cesium_js | docs_only | not_proven | Backlog 3D map review only if required. |

## PROVIDER_GATEWAY

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| vLLM | vllm | missing | not_proven | Backlog only if local model serving becomes an approved path. |
| Qwen3-VL | qwen3_vl | missing | not_proven | Do not classify provider Qwen evidence as local OSS proof; require model-weight/legal approval for local VLM. |
| ONNX Runtime | onnxruntime | docs_only | not_proven | Backlog model runtime proof only after a local model owner selects it. |
| Qwen/DeepSeek provider APIs | qwen_deepseek_provider_api | blocked | blocked | Keep separated from OSS inventory; use provider governance packets only. |

## SOUND_MUSIC_AUDIO

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| DeepFilterNet | deepfilternet | package_declared | docs_only | Batch 4 should verify package/import in controlled runtime without processing audio. |
| Signalsmith Stretch | signalsmith_stretch | docs_only | docs_only | Add install proposal and license review before any timing/stretch proof. |
| Demucs | demucs | blocked | blocked | Keep blocked until explicit Demucs provenance/legal/human approval packet. |
| AudioFlux | audioflux | docs_only | docs_only | Backlog install/proof proposal for analysis-only SoundSync candidate. |
| RNNoise | rnnoise | docs_only | blocked | Keep inactive unless future owner explicitly reopens RNNoise review. |
| librosa | librosa | docs_only | not_proven | Backlog only; AudioFlux is the selected launch analysis candidate. |
| soundfile/libsndfile | soundfile_libsndfile | missing | not_proven | Backlog only if future audio IO proof needs it. |
| Sox | sox | missing | not_proven | Backlog only; prefer FFmpeg/AudioFlux lanes unless owner approves. |
| Rubber Band | rubber_band | blocked | blocked | Keep blocked unless legal/product review re-enables it. |
| aubio | aubio | missing | not_proven | Backlog only after AudioFlux proof review. |
| Essentia | essentia | blocked | blocked | Keep blocked unless future review re-enables. |
| MMAudio | mmaudio | docs_only | docs_only | Separate provider/local classification review before install/proof. |
| Lyria provider API | lyria_provider_api | blocked | blocked | Keep separated from OSS audit and behind provider/worker approvals. |
| Mirelo provider API | mirelo_provider_api | blocked | blocked | Keep separated from OSS audit and future provider approval. |

## TRACK_A_RENDER_EXPORT

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| FILM | film | system_binary_declared | smoke_only | Batch 8 should verify runtime container metadata only; no frame interpolation. |
| Remotion | remotion | package_declared | smoke_only | Batch 8 should prove version/build metadata only, not rendering. |
| OpenTimelineIO | opentimelineio | package_declared | docs_only | Batch 8 should verify import otio with synthetic empty metadata only after approval. |
| Hyperframe | hyperframe | docs_only | not_proven | Backlog timeline helper review. |
| libass | libass | system_binary_declared | smoke_only | Batch 8 should verify libass support metadata only. |
| GStreamer | gstreamer | missing | not_proven | Backlog only if FFmpeg/Remotion cannot cover planned media IO. |
| Bento4/MP4Box | bento4_mp4box | missing | not_proven | Backlog packaging review after FFmpeg/private export proof. |
| mkvtoolnix | mkvtoolnix | missing | not_proven | Backlog only if container format requirements emerge. |
| VapourSynth | vapoursynth | docs_only | blocked | Keep blocked until separate worker/plugin review. |
| Revideo | revideo | docs_only | blocked | Keep blocked unless future render owner reopens review. |

## TRACK_B_MEDIA_PROCESSING

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| FFmpeg | ffmpeg | system_binary_declared | smoke_only | Batch 1 should prove ffmpeg -version and a metadata-only probe in an approved container, without media processing. |
| FFprobe | ffprobe | system_binary_declared | smoke_only | Batch 1 should prove ffprobe -version only, then later controlled metadata probes. |
| OpenCV | opencv | package_declared | smoke_only | Batch 1 should verify import cv2 in approved tool-readiness container, then add metadata-only fixture proof. |
| PyAV | pyav | package_declared | docs_only | Batch 1 should verify import av and defer frame decode until controlled media approval. |
| PySceneDetect | pyscenedetect | package_declared | docs_only | Batch 1 should verify import scenedetect, then plan a synthetic no-media fixture. |
| Sharp/libvips | sharp_libvips | package_declared | smoke_only | Batch 1 should verify package resolution only, then separate controlled image metadata proof. |
| DuckDB | duckdb | package_declared | docs_only | Batch 2 should verify import duckdb and a local empty in-memory metadata query only after approval. |
| Polars | polars | package_declared | docs_only | Batch 2 should verify import polars with a local metadata-only fixture. |
| PaddleOCR | paddleocr | package_declared | smoke_only | Batch 3 should validate package import and model-directory policy without OCR on media. |
| PaddlePaddle | paddlepaddle | package_declared | docs_only | Batch 3 should verify CPU import only, then defer GPU/runtime proof. |
| MediaInfo | mediainfo | docs_only | not_proven | Backlog should decide whether ffprobe covers the need or add MediaInfo to a future install proposal. |
| ExifTool | exiftool | docs_only | not_proven | Backlog should decide whether ExifTool is needed for provenance metadata before install approval. |
| ImageMagick/GraphicsMagick | imagemagick_graphicsmagick | docs_only | not_proven | Backlog should compare against Sharp/libvips before any install proposal. |
| Tesseract | tesseract | docs_only | not_proven | Keep as alternate OCR backlog only after PaddleOCR proof review. |
| OpenColorIO | opencolorio | docs_only | not_proven | Backlog optional color management review. |
| OpenImageIO | openimageio | docs_only | not_proven | Backlog optional image IO review. |

## WEB_SEARCH_CAPTURE

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Playwright/Chromium | playwright_chromium | package_declared | smoke_only | Batch 9 should verify package/browser metadata only; no live capture unless separately approved. |

## WORKER_RUNTIME_JOBS

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Faster Whisper | faster_whisper | package_declared | smoke_only | Verify import and model-weight directory policy in speech runtime approval. |
| whisper.cpp | whisper_cpp | docs_only | not_proven | Backlog as alternate local speech path after faster-whisper proof. |
| CTranslate2 | ctranslate2 | package_declared | docs_only | Batch 5 should verify import/version only. |
