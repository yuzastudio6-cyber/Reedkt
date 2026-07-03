# Install And Proof Backlog

| Safe batch | Tool | ID | Current status | Required next action |
| --- | --- | --- | --- | --- |
| batch_1_core_media_binary_proof | FFmpeg | ffmpeg | system_binary_declared / smoke_only | Batch 1 should prove ffmpeg -version and a metadata-only probe in an approved container, without media processing. |
| batch_1_core_media_binary_proof | FFprobe | ffprobe | system_binary_declared / smoke_only | Batch 1 should prove ffprobe -version only, then later controlled metadata probes. |
| batch_1_track_b_core_python_imports | OpenCV | opencv | package_declared / smoke_only | Batch 1 should verify import cv2 in approved tool-readiness container, then add metadata-only fixture proof. |
| batch_1_track_b_core_python_imports | PyAV | pyav | package_declared / docs_only | Batch 1 should verify import av and defer frame decode until controlled media approval. |
| batch_1_track_b_core_python_imports | PySceneDetect | pyscenedetect | package_declared / docs_only | Batch 1 should verify import scenedetect, then plan a synthetic no-media fixture. |
| batch_1_track_b_core_node_imports | Sharp/libvips | sharp_libvips | package_declared / smoke_only | Batch 1 should verify package resolution only, then separate controlled image metadata proof. |
| batch_2_data_tool_imports | DuckDB | duckdb | package_declared / docs_only | Batch 2 should verify import duckdb and a local empty in-memory metadata query only after approval. |
| batch_2_data_tool_imports | Polars | polars | package_declared / docs_only | Batch 2 should verify import polars with a local metadata-only fixture. |
| batch_3_ocr_model_gate | PaddleOCR | paddleocr | package_declared / smoke_only | Batch 3 should validate package import and model-directory policy without OCR on media. |
| batch_3_ocr_model_gate | PaddlePaddle | paddlepaddle | package_declared / docs_only | Batch 3 should verify CPU import only, then defer GPU/runtime proof. |
| backlog_not_in_batch_1 | MediaInfo | mediainfo | docs_only / not_proven | Backlog should decide whether ffprobe covers the need or add MediaInfo to a future install proposal. |
| backlog_not_in_batch_1 | ExifTool | exiftool | docs_only / not_proven | Backlog should decide whether ExifTool is needed for provenance metadata before install approval. |
| backlog_image_tool_review | ImageMagick/GraphicsMagick | imagemagick_graphicsmagick | docs_only / not_proven | Backlog should compare against Sharp/libvips before any install proposal. |
| backlog_ocr_alternate_review | Tesseract | tesseract | docs_only / not_proven | Keep as alternate OCR backlog only after PaddleOCR proof review. |
| batch_4_sound_audio_imports | DeepFilterNet | deepfilternet | package_declared / docs_only | Batch 4 should verify package/import in controlled runtime without processing audio. |
| backlog_audio_install_review | Signalsmith Stretch | signalsmith_stretch | docs_only / docs_only | Add install proposal and license review before any timing/stretch proof. |
| blocked_demucs_review | Demucs | demucs | blocked / blocked | Keep blocked until explicit Demucs provenance/legal/human approval packet. |
| backlog_audio_install_review | AudioFlux | audioflux | docs_only / docs_only | Backlog install/proof proposal for analysis-only SoundSync candidate. |
| blocked_removed_candidate | RNNoise | rnnoise | docs_only / blocked | Keep inactive unless future owner explicitly reopens RNNoise review. |
| backlog_audio_alternate_review | librosa | librosa | docs_only / not_proven | Backlog only; AudioFlux is the selected launch analysis candidate. |
| backlog_audio_alternate_review | soundfile/libsndfile | soundfile_libsndfile | missing / not_proven | Backlog only if future audio IO proof needs it. |
| backlog_audio_alternate_review | Sox | sox | missing / not_proven | Backlog only; prefer FFmpeg/AudioFlux lanes unless owner approves. |
| blocked_audio_alternate_review | Rubber Band | rubber_band | blocked / blocked | Keep blocked unless legal/product review re-enables it. |
| backlog_audio_alternate_review | aubio | aubio | missing / not_proven | Backlog only after AudioFlux proof review. |
| blocked_audio_alternate_review | Essentia | essentia | blocked / blocked | Keep blocked unless future review re-enables. |
| backlog_audio_sfx_review | MMAudio | mmaudio | docs_only / docs_only | Separate provider/local classification review before install/proof. |
| batch_5_speech_runtime_imports | Faster Whisper | faster_whisper | package_declared / smoke_only | Verify import and model-weight directory policy in speech runtime approval. |
| backlog_speech_alternate_review | whisper.cpp | whisper_cpp | docs_only / not_proven | Backlog as alternate local speech path after faster-whisper proof. |
| backlog_model_serving_review | vLLM | vllm | missing / not_proven | Backlog only if local model serving becomes an approved path. |
| backlog_model_weight_review | Qwen3-VL | qwen3_vl | missing / not_proven | Do not classify provider Qwen evidence as local OSS proof; require model-weight/legal approval for local VLM. |
| backlog_model_runtime_review | ONNX Runtime | onnxruntime | docs_only / not_proven | Backlog model runtime proof only after a local model owner selects it. |
| batch_6_gpu_model_imports | Torch/TorchVision | torch_torchvision | package_declared / smoke_only | Batch 6 should verify import torch without model execution in approved runtime. |
| batch_6_gpu_model_imports | Transformers | transformers | package_declared / docs_only | Batch 6 should verify package resolution only after model-weight approval path is defined. |
| batch_7_ai_vision_model_imports | SAM2 | sam2 | package_declared / smoke_only | Batch 7 should prove package import/model path policy only; no video segmentation. |
| batch_7_ai_vision_model_imports | BiRefNet | birefnet | package_declared / smoke_only | Batch 7 should prove dependency import and blocked model-weight policy. |
| backlog_ai_vision_alternate_review | rembg | rembg | docs_only / not_proven | Backlog alternate background removal review only. |
| backlog_ai_vision_alternate_review | transparent-background | transparent_background | docs_only / not_proven | Backlog alternate background removal review only. |
| batch_7_ai_vision_model_imports | Real-ESRGAN | real_esrgan | package_declared / smoke_only | Batch 7 should verify import and model path policy only. |
| batch_8_render_ai_runtime_imports | FILM | film | system_binary_declared / smoke_only | Batch 8 should verify runtime container metadata only; no frame interpolation. |
| batch_6_gpu_model_imports | Kornia | kornia | package_declared / docs_only | Batch 6 should verify import only after GPU runtime review. |
| batch_5_speech_runtime_imports | CTranslate2 | ctranslate2 | package_declared / docs_only | Batch 5 should verify import/version only. |
| backlog_dataviz_review | D3 | d3 | docs_only / docs_only | Backlog route-only chart metadata proof or package declaration review. |
| backlog_dataviz_review | ECharts | echarts | docs_only / docs_only | Backlog chart package selection review. |
| backlog_creative_graphics_review | PixiJS | pixijs | docs_only / not_proven | Backlog only if Remotion/CSS cannot cover planned graphics. |
| backlog_creative_graphics_review | Three.js | three_js | docs_only / not_proven | Backlog 3D graphics review before dependency proposal. |
| backlog_creative_graphics_review | Babylon.js | babylon_js | docs_only / not_proven | Backlog alternate 3D graphics review. |
| backlog_creative_graphics_review | Lottie | lottie | docs_only / not_proven | Backlog motion asset review before execution. |
| backlog_creative_graphics_review | Konva | konva | docs_only / not_proven | Backlog canvas graphics review. |
| backlog_dataviz_review | Vega-Lite | vega_lite | docs_only / not_proven | Backlog chart candidate review. |
| backlog_color_tool_review | OpenColorIO | opencolorio | docs_only / not_proven | Backlog optional color management review. |
| backlog_color_tool_review | OpenImageIO | openimageio | docs_only / not_proven | Backlog optional image IO review. |
| batch_8_render_metadata_proof | Remotion | remotion | package_declared / smoke_only | Batch 8 should prove version/build metadata only, not rendering. |
| batch_8_render_metadata_proof | OpenTimelineIO | opentimelineio | package_declared / docs_only | Batch 8 should verify import otio with synthetic empty metadata only after approval. |
| backlog_render_alternate_review | Hyperframe | hyperframe | docs_only / not_proven | Backlog timeline helper review. |
| batch_8_render_metadata_proof | libass | libass | system_binary_declared / smoke_only | Batch 8 should verify libass support metadata only. |
| backlog_render_alternate_review | GStreamer | gstreamer | missing / not_proven | Backlog only if FFmpeg/Remotion cannot cover planned media IO. |
| backlog_render_alternate_review | Bento4/MP4Box | bento4_mp4box | missing / not_proven | Backlog packaging review after FFmpeg/private export proof. |
| backlog_render_alternate_review | mkvtoolnix | mkvtoolnix | missing / not_proven | Backlog only if container format requirements emerge. |
| blocked_render_plugin_review | VapourSynth | vapoursynth | docs_only / blocked | Keep blocked until separate worker/plugin review. |
| blocked_render_alternate_review | Revideo | revideo | docs_only / blocked | Keep blocked unless future render owner reopens review. |
| batch_9_browser_map_metadata_proof | Playwright/Chromium | playwright_chromium | package_declared / smoke_only | Batch 9 should verify package/browser metadata only; no live capture unless separately approved. |
| batch_9_browser_map_metadata_proof | MapLibre | maplibre | package_declared / docs_only | Batch 9 should verify package resolution only. |
| batch_9_browser_map_metadata_proof | Turf | turf | package_declared / docs_only | Batch 9 should verify import only with synthetic metadata. |
| backlog_geospatial_review | GDAL/OGR | gdal_ogr | missing / not_proven | Backlog geospatial install review only after MapLibre/Turf proof. |
| backlog_geospatial_review | Tippecanoe | tippecanoe | missing / not_proven | Backlog vector tile review only if needed. |
| backlog_geospatial_review | PMTiles | pmtiles | missing / not_proven | Backlog private tile packaging review only. |
| backlog_geospatial_review | deck.gl | deck_gl | docs_only / not_proven | Backlog map visualization review after MapLibre proof. |
| backlog_geospatial_review | CesiumJS | cesium_js | docs_only / not_proven | Backlog 3D map review only if required. |
| provider_api_not_oss_batch | Qwen/DeepSeek provider APIs | qwen_deepseek_provider_api | blocked / blocked | Keep separated from OSS inventory; use provider governance packets only. |
| provider_api_not_oss_batch | Lyria provider API | lyria_provider_api | blocked / blocked | Keep separated from OSS audit and behind provider/worker approvals. |
| provider_api_not_oss_batch | Mirelo provider API | mirelo_provider_api | blocked / blocked | Keep separated from OSS audit and future provider approval. |
