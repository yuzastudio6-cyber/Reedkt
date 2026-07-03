# Blocked Register

| Tool | ID | Owner | Blockers | Required next action |
| --- | --- | --- | --- | --- |
| FFmpeg | ffmpeg | TRACK_B_MEDIA_PROCESSING | license/configuration review before broad execution | Batch 1 should prove ffmpeg -version and a metadata-only probe in an approved container, without media processing. |
| FFprobe | ffprobe | TRACK_B_MEDIA_PROCESSING | same container proof gate as FFmpeg | Batch 1 should prove ffprobe -version only, then later controlled metadata probes. |
| OpenCV | opencv | TRACK_B_MEDIA_PROCESSING | no uncontrolled media processing; worker approval required | Batch 1 should verify import cv2 in approved tool-readiness container, then add metadata-only fixture proof. |
| PyAV | pyav | TRACK_B_MEDIA_PROCESSING | no approved media decode execution in this phase | Batch 1 should verify import av and defer frame decode until controlled media approval. |
| PySceneDetect | pyscenedetect | TRACK_B_MEDIA_PROCESSING | scene detection on real media remains blocked | Batch 1 should verify import scenedetect, then plan a synthetic no-media fixture. |
| Sharp/libvips | sharp_libvips | TRACK_B_MEDIA_PROCESSING | dependency/security/LGPL review before broader execution | Batch 1 should verify package resolution only, then separate controlled image metadata proof. |
| DuckDB | duckdb | TRACK_B_MEDIA_PROCESSING | no data processing execution approved | Batch 2 should verify import duckdb and a local empty in-memory metadata query only after approval. |
| Polars | polars | TRACK_B_MEDIA_PROCESSING | no data transformation execution approved | Batch 2 should verify import polars with a local metadata-only fixture. |
| PaddleOCR | paddleocr | TRACK_B_MEDIA_PROCESSING | OCR runtime/model proof and privacy review required | Batch 3 should validate package import and model-directory policy without OCR on media. |
| PaddlePaddle | paddlepaddle | TRACK_B_MEDIA_PROCESSING | runtime/model availability and GPU policy review required | Batch 3 should verify CPU import only, then defer GPU/runtime proof. |
| MediaInfo | mediainfo | TRACK_B_MEDIA_PROCESSING | no package/container evidence found on this branch | Backlog should decide whether ffprobe covers the need or add MediaInfo to a future install proposal. |
| ExifTool | exiftool | TRACK_B_MEDIA_PROCESSING | no package/container evidence found on this branch | Backlog should decide whether ExifTool is needed for provenance metadata before install approval. |
| ImageMagick/GraphicsMagick | imagemagick_graphicsmagick | TRACK_B_MEDIA_PROCESSING | no package/container evidence found on this branch | Backlog should compare against Sharp/libvips before any install proposal. |
| Tesseract | tesseract | TRACK_B_MEDIA_PROCESSING | PaddleOCR is the committed OCR package path; no Tesseract install evidence found | Keep as alternate OCR backlog only after PaddleOCR proof review. |
| DeepFilterNet | deepfilternet | SOUND_MUSIC_AUDIO | no real audio cleanup execution approved | Batch 4 should verify package/import in controlled runtime without processing audio. |
| Signalsmith Stretch | signalsmith_stretch | SOUND_MUSIC_AUDIO | no package/container proof found; worker-only candidate | Add install proposal and license review before any timing/stretch proof. |
| Demucs | demucs | SOUND_MUSIC_AUDIO | blocked pending provenance/legal/human approval; no stem separation execution | Keep blocked until explicit Demucs provenance/legal/human approval packet. |
| AudioFlux | audioflux | SOUND_MUSIC_AUDIO | no package/container evidence found on this branch | Backlog install/proof proposal for analysis-only SoundSync candidate. |
| RNNoise | rnnoise | SOUND_MUSIC_AUDIO | Sound study records RNNoise as removed/not active when cited | Keep inactive unless future owner explicitly reopens RNNoise review. |
| librosa | librosa | SOUND_MUSIC_AUDIO | no package/container evidence found on this branch | Backlog only; AudioFlux is the selected launch analysis candidate. |
| soundfile/libsndfile | soundfile_libsndfile | SOUND_MUSIC_AUDIO | no committed package/container evidence found | Backlog only if future audio IO proof needs it. |
| Sox | sox | SOUND_MUSIC_AUDIO | no committed package/container evidence found | Backlog only; prefer FFmpeg/AudioFlux lanes unless owner approves. |
| Rubber Band | rubber_band | SOUND_MUSIC_AUDIO | not selected for launch; Signalsmith Stretch is selected candidate | Keep blocked unless legal/product review re-enables it. |
| aubio | aubio | SOUND_MUSIC_AUDIO | no package/container evidence found | Backlog only after AudioFlux proof review. |
| Essentia | essentia | SOUND_MUSIC_AUDIO | not selected for launch; legal/product review required to reopen | Keep blocked unless future review re-enables. |
| MMAudio | mmaudio | SOUND_MUSIC_AUDIO | planning/provider-style SFX candidate only; no local runtime evidence found | Separate provider/local classification review before install/proof. |
| Faster Whisper | faster_whisper | WORKER_RUNTIME_JOBS | real transcription execution requires separate worker/media approval | Verify import and model-weight directory policy in speech runtime approval. |
| whisper.cpp | whisper_cpp | WORKER_RUNTIME_JOBS | registry/planning evidence only; no install evidence found | Backlog as alternate local speech path after faster-whisper proof. |
| vLLM | vllm | PROVIDER_GATEWAY | no repo-local/container evidence found; provider calls are separate | Backlog only if local model serving becomes an approved path. |
| Qwen3-VL | qwen3_vl | PROVIDER_GATEWAY | no local model/container evidence found; Qwen provider API evidence is separate | Do not classify provider Qwen evidence as local OSS proof; require model-weight/legal approval for local VLM. |
| ONNX Runtime | onnxruntime | PROVIDER_GATEWAY | no package/container evidence found on this branch | Backlog model runtime proof only after a local model owner selects it. |
| Torch/TorchVision | torch_torchvision | AI_TOOLS_CREATIVE_GRAPHICS | GPU/model execution and model weights remain blocked | Batch 6 should verify import torch without model execution in approved runtime. |
| Transformers | transformers | AI_TOOLS_CREATIVE_GRAPHICS | model download/execution remains blocked | Batch 6 should verify package resolution only after model-weight approval path is defined. |
| SAM2 | sam2 | AI_TOOLS_CREATIVE_GRAPHICS | model weights and media execution remain blocked | Batch 7 should prove package import/model path policy only; no video segmentation. |
| BiRefNet | birefnet | AI_TOOLS_CREATIVE_GRAPHICS | model/source review required before execution | Batch 7 should prove dependency import and blocked model-weight policy. |
| rembg | rembg | AI_TOOLS_CREATIVE_GRAPHICS | registry evidence only; BiRefNet is the committed runtime lane | Backlog alternate background removal review only. |
| transparent-background | transparent_background | AI_TOOLS_CREATIVE_GRAPHICS | registry evidence only | Backlog alternate background removal review only. |
| Real-ESRGAN | real_esrgan | AI_TOOLS_CREATIVE_GRAPHICS | enhancement execution requires separate controlled media/model approval | Batch 7 should verify import and model path policy only. |
| FILM | film | TRACK_A_RENDER_EXPORT | slow-motion/frame interpolation execution remains separate | Batch 8 should verify runtime container metadata only; no frame interpolation. |
| Kornia | kornia | AI_TOOLS_CREATIVE_GRAPHICS | GPU image processing remains blocked | Batch 6 should verify import only after GPU runtime review. |
| CTranslate2 | ctranslate2 | WORKER_RUNTIME_JOBS | speech runtime execution remains blocked | Batch 5 should verify import/version only. |
| D3 | d3 | AI_TOOLS_CREATIVE_GRAPHICS | no chart rendering execution approved | Backlog route-only chart metadata proof or package declaration review. |
| ECharts | echarts | AI_TOOLS_CREATIVE_GRAPHICS | no package/runtime proof found | Backlog chart package selection review. |
| PixiJS | pixijs | AI_TOOLS_CREATIVE_GRAPHICS | registry/planning only | Backlog only if Remotion/CSS cannot cover planned graphics. |
| Three.js | three_js | AI_TOOLS_CREATIVE_GRAPHICS | registry/planning only | Backlog 3D graphics review before dependency proposal. |
| Babylon.js | babylon_js | AI_TOOLS_CREATIVE_GRAPHICS | registry/planning only | Backlog alternate 3D graphics review. |
| Lottie | lottie | AI_TOOLS_CREATIVE_GRAPHICS | registry/planning only | Backlog motion asset review before execution. |
| Konva | konva | AI_TOOLS_CREATIVE_GRAPHICS | registry/planning only | Backlog canvas graphics review. |
| Vega-Lite | vega_lite | AI_TOOLS_CREATIVE_GRAPHICS | registry/planning only | Backlog chart candidate review. |
| OpenColorIO | opencolorio | TRACK_B_MEDIA_PROCESSING | manual dependency/license review required | Backlog optional color management review. |
| OpenImageIO | openimageio | TRACK_B_MEDIA_PROCESSING | manual dependency/license review required | Backlog optional image IO review. |
| Remotion | remotion | TRACK_A_RENDER_EXPORT | final render/export execution remains blocked | Batch 8 should prove version/build metadata only, not rendering. |
| OpenTimelineIO | opentimelineio | TRACK_A_RENDER_EXPORT | timeline transformation execution remains blocked | Batch 8 should verify import otio with synthetic empty metadata only after approval. |
| Hyperframe | hyperframe | TRACK_A_RENDER_EXPORT | registry evidence only | Backlog timeline helper review. |
| libass | libass | TRACK_A_RENDER_EXPORT | subtitle burn-in/render execution remains blocked | Batch 8 should verify libass support metadata only. |
| GStreamer | gstreamer | TRACK_A_RENDER_EXPORT | no repo-local package/container evidence found | Backlog only if FFmpeg/Remotion cannot cover planned media IO. |
| Bento4/MP4Box | bento4_mp4box | TRACK_A_RENDER_EXPORT | no repo-local package/container evidence found | Backlog packaging review after FFmpeg/private export proof. |
| mkvtoolnix | mkvtoolnix | TRACK_A_RENDER_EXPORT | no repo-local package/container evidence found | Backlog only if container format requirements emerge. |
| VapourSynth | vapoursynth | TRACK_A_RENDER_EXPORT | worker-only and plugin review required | Keep blocked until separate worker/plugin review. |
| Revideo | revideo | TRACK_A_RENDER_EXPORT | explicitly forbidden in non-GPU container readiness; not selected launch path | Keep blocked unless future render owner reopens review. |
| Playwright/Chromium | playwright_chromium | WEB_SEARCH_CAPTURE | browser capture remains controlled and allowlisted only | Batch 9 should verify package/browser metadata only; no live capture unless separately approved. |
| MapLibre | maplibre | MAP_GEOSPATIAL | map rendering remains blocked | Batch 9 should verify package resolution only. |
| Turf | turf | MAP_GEOSPATIAL | geospatial computation remains metadata-only until approved | Batch 9 should verify import only with synthetic metadata. |
| GDAL/OGR | gdal_ogr | MAP_GEOSPATIAL | no repo-local package/container evidence found | Backlog geospatial install review only after MapLibre/Turf proof. |
| Tippecanoe | tippecanoe | MAP_GEOSPATIAL | no repo-local package/container evidence found | Backlog vector tile review only if needed. |
| PMTiles | pmtiles | MAP_GEOSPATIAL | no repo-local package/container evidence found | Backlog private tile packaging review only. |
| deck.gl | deck_gl | MAP_GEOSPATIAL | registry/planning only | Backlog map visualization review after MapLibre proof. |
| CesiumJS | cesium_js | MAP_GEOSPATIAL | registry/planning only | Backlog 3D map review only if required. |
| Qwen/DeepSeek provider APIs | qwen_deepseek_provider_api | PROVIDER_GATEWAY | provider/API-only item; not an OSS/local tool unless separate local/container evidence is added | Keep separated from OSS inventory; use provider governance packets only. |
| Lyria provider API | lyria_provider_api | SOUND_MUSIC_AUDIO | provider/API-only; no local OSS tool proof | Keep separated from OSS audit and behind provider/worker approvals. |
| Mirelo provider API | mirelo_provider_api | SOUND_MUSIC_AUDIO | provider/API-only SFX candidate; no local OSS proof | Keep separated from OSS audit and future provider approval. |

Global blocked scopes remain: toolExecutionAllowed: false, routeExecutionAllowed: false, workerExecutionAllowed: false, providerExecutionAllowed: false, runtimeExecutionAllowed: false, mediaProcessingAllowed: false, supabaseWritesAllowed: false, publicArtifactsAllowed: false, signedUrlsAsSourceOfTruthAllowed: false, rawPromptExecutionAllowed: false, productionUnlockAllowed: false.
