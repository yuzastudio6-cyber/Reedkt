# Next Install/Proof Batches

The first recommended next phase is `OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_EXECUTION_BATCH_1`. This document does not run installation or execution; it records the approved future proof scope after the dependency baseline repair and Batch 1 rerun approval.

## backlog_ai_vision_alternate_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| rembg | rembg | docs_only | not_proven | Backlog alternate background removal review only. |
| transparent-background | transparent_background | docs_only | not_proven | Backlog alternate background removal review only. |

## backlog_audio_alternate_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| librosa | librosa | docs_only | not_proven | Backlog only; AudioFlux is the selected launch analysis candidate. |
| soundfile/libsndfile | soundfile_libsndfile | missing | not_proven | Backlog only if future audio IO proof needs it. |
| Sox | sox | missing | not_proven | Backlog only; prefer FFmpeg/AudioFlux lanes unless owner approves. |
| aubio | aubio | missing | not_proven | Backlog only after AudioFlux proof review. |

## backlog_audio_install_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Signalsmith Stretch | signalsmith_stretch | docs_only | docs_only | Add install proposal and license review before any timing/stretch proof. |
| AudioFlux | audioflux | docs_only | docs_only | Backlog install/proof proposal for analysis-only SoundSync candidate. |

## backlog_audio_sfx_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| MMAudio | mmaudio | docs_only | docs_only | Separate provider/local classification review before install/proof. |

## backlog_color_tool_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| OpenColorIO | opencolorio | docs_only | not_proven | Backlog optional color management review. |
| OpenImageIO | openimageio | docs_only | not_proven | Backlog optional image IO review. |

## backlog_creative_graphics_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| PixiJS | pixijs | docs_only | not_proven | Backlog only if Remotion/CSS cannot cover planned graphics. |
| Three.js | three_js | docs_only | not_proven | Backlog 3D graphics review before dependency proposal. |
| Babylon.js | babylon_js | docs_only | not_proven | Backlog alternate 3D graphics review. |
| Lottie | lottie | docs_only | not_proven | Backlog motion asset review before execution. |
| Konva | konva | docs_only | not_proven | Backlog canvas graphics review. |

## backlog_dataviz_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| D3 | d3 | docs_only | docs_only | Backlog route-only chart metadata proof or package declaration review. |
| ECharts | echarts | docs_only | docs_only | Backlog chart package selection review. |
| Vega-Lite | vega_lite | docs_only | not_proven | Backlog chart candidate review. |

## backlog_geospatial_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| GDAL/OGR | gdal_ogr | missing | not_proven | Backlog geospatial install review only after MapLibre/Turf proof. |
| Tippecanoe | tippecanoe | missing | not_proven | Backlog vector tile review only if needed. |
| PMTiles | pmtiles | missing | not_proven | Backlog private tile packaging review only. |
| deck.gl | deck_gl | docs_only | not_proven | Backlog map visualization review after MapLibre proof. |
| CesiumJS | cesium_js | docs_only | not_proven | Backlog 3D map review only if required. |

## backlog_image_tool_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| ImageMagick/GraphicsMagick | imagemagick_graphicsmagick | docs_only | not_proven | Backlog should compare against Sharp/libvips before any install proposal. |

## backlog_model_runtime_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| ONNX Runtime | onnxruntime | docs_only | not_proven | Backlog model runtime proof only after a local model owner selects it. |

## backlog_model_serving_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| vLLM | vllm | missing | not_proven | Backlog only if local model serving becomes an approved path. |

## backlog_model_weight_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Qwen3-VL | qwen3_vl | missing | not_proven | Do not classify provider Qwen evidence as local OSS proof; require model-weight/legal approval for local VLM. |

## backlog_not_in_batch_1

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| MediaInfo | mediainfo | docs_only | not_proven | Backlog should decide whether ffprobe covers the need or add MediaInfo to a future install proposal. |
| ExifTool | exiftool | docs_only | not_proven | Backlog should decide whether ExifTool is needed for provenance metadata before install approval. |

## backlog_ocr_alternate_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Tesseract | tesseract | docs_only | not_proven | Keep as alternate OCR backlog only after PaddleOCR proof review. |

## backlog_render_alternate_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Hyperframe | hyperframe | docs_only | not_proven | Backlog timeline helper review. |
| GStreamer | gstreamer | missing | not_proven | Backlog only if FFmpeg/Remotion cannot cover planned media IO. |
| Bento4/MP4Box | bento4_mp4box | missing | not_proven | Backlog packaging review after FFmpeg/private export proof. |
| mkvtoolnix | mkvtoolnix | missing | not_proven | Backlog only if container format requirements emerge. |

## backlog_speech_alternate_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| whisper.cpp | whisper_cpp | docs_only | not_proven | Backlog as alternate local speech path after faster-whisper proof. |

## batch_1_core_media_binary_proof

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| FFmpeg | ffmpeg | system_binary_declared | smoke_only | Batch 1 should prove ffmpeg -version and a metadata-only probe in an approved container, without media processing. |
| FFprobe | ffprobe | system_binary_declared | smoke_only | Batch 1 should prove ffprobe -version only, then later controlled metadata probes. |

## batch_1_track_b_core_node_imports

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Sharp/libvips | sharp_libvips | package_declared | smoke_only | Batch 1 should verify package resolution only, then separate controlled image metadata proof. |

## batch_1_track_b_core_python_imports

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| OpenCV | opencv | package_declared | smoke_only | Batch 1 should verify import cv2 in approved tool-readiness container, then add metadata-only fixture proof. |
| PyAV | pyav | package_declared | docs_only | Batch 1 should verify import av and defer frame decode until controlled media approval. |
| PySceneDetect | pyscenedetect | package_declared | docs_only | Batch 1 should verify import scenedetect, then plan a synthetic no-media fixture. |

## batch_2_data_tool_imports

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| DuckDB | duckdb | package_declared | docs_only | Batch 2 should verify import duckdb and a local empty in-memory metadata query only after approval. |
| Polars | polars | package_declared | docs_only | Batch 2 should verify import polars with a local metadata-only fixture. |

## batch_3_ocr_model_gate

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| PaddleOCR | paddleocr | package_declared | smoke_only | Batch 3 should validate package import and model-directory policy without OCR on media. |
| PaddlePaddle | paddlepaddle | package_declared | docs_only | Batch 3 should verify CPU import only, then defer GPU/runtime proof. |

## batch_4_sound_audio_imports

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| DeepFilterNet | deepfilternet | package_declared | docs_only | Batch 4 should verify package/import in controlled runtime without processing audio. |

## batch_5_speech_runtime_imports

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Faster Whisper | faster_whisper | package_declared | smoke_only | Verify import and model-weight directory policy in speech runtime approval. |
| CTranslate2 | ctranslate2 | package_declared | docs_only | Batch 5 should verify import/version only. |

## batch_6_gpu_model_imports

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Torch/TorchVision | torch_torchvision | package_declared | smoke_only | Batch 6 should verify import torch without model execution in approved runtime. |
| Transformers | transformers | package_declared | docs_only | Batch 6 should verify package resolution only after model-weight approval path is defined. |
| Kornia | kornia | package_declared | docs_only | Batch 6 should verify import only after GPU runtime review. |

## batch_7_ai_vision_model_imports

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| SAM2 | sam2 | package_declared | smoke_only | Batch 7 should prove package import/model path policy only; no video segmentation. |
| BiRefNet | birefnet | package_declared | smoke_only | Batch 7 should prove dependency import and blocked model-weight policy. |
| Real-ESRGAN | real_esrgan | package_declared | smoke_only | Batch 7 should verify import and model path policy only. |

## batch_8_render_ai_runtime_imports

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| FILM | film | system_binary_declared | smoke_only | Batch 8 should verify runtime container metadata only; no frame interpolation. |

## batch_8_render_metadata_proof

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Remotion | remotion | package_declared | smoke_only | Batch 8 should prove version/build metadata only, not rendering. |
| OpenTimelineIO | opentimelineio | package_declared | docs_only | Batch 8 should verify import otio with synthetic empty metadata only after approval. |
| libass | libass | system_binary_declared | smoke_only | Batch 8 should verify libass support metadata only. |

## batch_9_browser_map_metadata_proof

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Playwright/Chromium | playwright_chromium | package_declared | smoke_only | Batch 9 should verify package/browser metadata only; no live capture unless separately approved. |
| MapLibre | maplibre | package_declared | docs_only | Batch 9 should verify package resolution only. |
| Turf | turf | package_declared | docs_only | Batch 9 should verify import only with synthetic metadata. |

## blocked_audio_alternate_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Rubber Band | rubber_band | blocked | blocked | Keep blocked unless legal/product review re-enables it. |
| Essentia | essentia | blocked | blocked | Keep blocked unless future review re-enables. |

## blocked_demucs_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Demucs | demucs | blocked | blocked | Keep blocked until explicit Demucs provenance/legal/human approval packet. |

## blocked_removed_candidate

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| RNNoise | rnnoise | docs_only | blocked | Keep inactive unless future owner explicitly reopens RNNoise review. |

## blocked_render_alternate_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Revideo | revideo | docs_only | blocked | Keep blocked unless future render owner reopens review. |

## blocked_render_plugin_review

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| VapourSynth | vapoursynth | docs_only | blocked | Keep blocked until separate worker/plugin review. |

## provider_api_not_oss_batch

| Tool | ID | Install status | Proof status | Next action |
| --- | --- | --- | --- | --- |
| Qwen/DeepSeek provider APIs | qwen_deepseek_provider_api | blocked | blocked | Keep separated from OSS inventory; use provider governance packets only. |
| Lyria provider API | lyria_provider_api | blocked | blocked | Keep separated from OSS audit and behind provider/worker approvals. |
| Mirelo provider API | mirelo_provider_api | blocked | blocked | Keep separated from OSS audit and future provider approval. |

<!-- OPEN_SOURCE_BATCH_1_APPROVAL_STATUS:start -->
## Batch 1 Rerun Approval Packet Status

Decision: `approved_for_future_open_source_tool_stack_batch_1_install_proof_execution`.

The reviewed Batch 1 candidates are DuckDB, Polars, Sharp/libvips, FFmpeg, FFprobe, route/capability manifest validation, fixture/report validation, and open-source inventory/proof matrix validation. They are approved only for a future no-install, no-lock-mutation proof execution packet that must fail closed if an expected package or binary is unavailable.

Next prompt: `OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_EXECUTION_BATCH_1`.
<!-- OPEN_SOURCE_BATCH_1_APPROVAL_STATUS:end -->
