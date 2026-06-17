# Next Install/Proof Batches

Current missing optional package/binary execution status:

- Decision: `missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts`.
- Approved packages added: `duckdb@1.4.4` and `nodejs-polars@0.25.1`.
- Proven: `nodejs-polars` import/version plus an in-memory metadata dataframe check.
- Blocked: DuckDB import/query proof, because `--ignore-scripts` left the native binding unavailable.
- Missing: FFmpeg and FFprobe system binaries; neither was installed.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_PACKAGE_INSTALL_SCRIPT_REVIEW`.
- Media processing, worker/route/provider execution, Docker/container mutation, Supabase/GCS mutation, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.

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

<!-- OPEN_SOURCE_BATCH_1_EXECUTION_STATUS:start -->
## Batch 1 Execution Result

Decision: `open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools`.

Passed without installing dependencies or mutating `package-lock.json`:

- Sharp/libvips import/version proof.
- Route/capability manifest validation.
- Fixture/report validation.
- Open-source inventory/proof matrix validation.

Missing optional targets recorded without install attempts:

- DuckDB local module.
- Polars local module.
- FFmpeg system binary.
- FFprobe system binary.

Next prompt: `OPEN_SOURCE_TOOL_STACK_BATCH_1_QA_REVIEW`.
<!-- OPEN_SOURCE_BATCH_1_EXECUTION_STATUS:end -->

<!-- OPEN_SOURCE_BATCH_1_QA_REVIEW_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_BATCH_1_QA_REVIEW:

- Decision: `open_source_tool_stack_batch_1_qa_passed_with_missing_optional_tools_ready_for_missing_optional_install_review`.
- Accepted central Batch 1 evidence: Sharp/libvips import/version proof, route/capability manifest validation, fixture/report validation, and open-source inventory/proof matrix validation.
- Missing optional tools: DuckDB local module, Polars local module, FFmpeg system binary, and FFprobe system binary.
- Missing optional tools are not counted as installed or proven.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW`.
- Real tool, route, worker, provider, media/audio/render/image/browser/map, Supabase/GCS, public artifact, signed URL, raw prompt, beta, and production scopes remain blocked.
<!-- OPEN_SOURCE_BATCH_1_QA_REVIEW_STATUS:end -->

<!-- OPEN_SOURCE_MISSING_OPTIONAL_INSTALL_REVIEW_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW:

- Decision: `missing_optional_install_review_passed_ready_for_package_and_binary_approval`.
- DuckDB future package candidate: `duckdb`; not installed or proven here.
- Polars future package candidate: `nodejs-polars`; not installed or proven here.
- FFmpeg/FFprobe future strategy: system or worker-container binaries only; no npm wrapper and no media probing here.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL`.
- Real installs, package-lock mutation, import smoke, version probes, tool/route/worker/provider execution, media/audio/render/image/browser/map work, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
<!-- OPEN_SOURCE_MISSING_OPTIONAL_INSTALL_REVIEW_STATUS:end -->

<!-- OPEN_SOURCE_MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_APPROVAL:

- Decision: `missing_optional_package_and_binary_approval_passed_ready_for_execution`.
- DuckDB future package candidate: `duckdb`; not installed or proven here.
- Polars future package candidate: `nodejs-polars`; not installed or proven here.
- Future package command: `npm install duckdb nodejs-polars --save-exact --ignore-scripts --no-audit --no-fund`.
- FFmpeg/FFprobe future path: existing-binary check-only commands, with absence fail-closed unless a separate worker/container owner approval supplies binaries.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_PACKAGE_AND_BINARY_EXECUTION`.
- Real installs, package-lock mutation, import smoke, version probes, fixture proofs, system binary installation, container mutation, tool/route/worker/provider execution, media/audio/render/image/browser/map work, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
<!-- OPEN_SOURCE_MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_STATUS:end -->

<!-- OPEN_SOURCE_PACKAGE_INSTALL_SCRIPT_REVIEW_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_PACKAGE_INSTALL_SCRIPT_REVIEW:

- Decision: `package_install_script_review_passed_ready_for_duckdb_native_rebuild_execution`.
- Future DuckDB-only command, still not executed in this phase: `npm rebuild duckdb --ignore-scripts=false --no-audit --no-fund`.
- Polars remains accepted from PR #455 and was not rerun here.
- DuckDB remains unproven until the native rebuild execution passes.
- FFmpeg/FFprobe remain separate system-binary review items.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_EXECUTION`.
- Runtime/product scopes remain blocked. Supabase classification: no write / none / none / no.
<!-- OPEN_SOURCE_PACKAGE_INSTALL_SCRIPT_REVIEW_STATUS:end -->

<!-- OPEN_SOURCE_DUCKDB_NATIVE_REBUILD_QA_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_DUCKDB_NATIVE_REBUILD_QA_REVIEW:

- Decision: `duckdb_native_rebuild_qa_passed_ready_for_ffmpeg_ffprobe_system_binary_review`.
- DuckDB is accepted as installed/proven from PR #466 native rebuild, import/API, and in-memory query evidence.
- Polars remains accepted/proven from PR #455 and was not rerun in PR #466 or this QA phase.
- FFmpeg and FFprobe remain missing/unproven and route to `OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW`.
- No npm install, npm rebuild, lifecycle script, proof rerun, version probe, tool/worker/route/provider/media, Supabase/GCS, public artifact, signed URL, raw prompt, beta, or production scope is enabled.
- Supabase classification: no write / none / none / no.
<!-- OPEN_SOURCE_DUCKDB_NATIVE_REBUILD_QA_STATUS:end -->

<!-- OPEN_SOURCE_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_STATUS:start -->
OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW:

- Decision: `ffmpeg_ffprobe_system_binary_review_passed_ready_for_tracka_source_of_truth_merge`.
- DuckDB remains accepted/proven from PR #466 evidence; Polars remains accepted/proven from PR #455 evidence.
- FFmpeg and FFprobe remain missing/unproven in the central lane.
- PR #463 is relevant Track A FFmpeg/FFprobe/libass runtime-path evidence, but it is not present on the central source-of-truth branch and must be reconciled before central version-probe approval.
- Future FFmpeg/FFprobe version probes are not approved by this phase.
- Next prompt: `TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE`.
- Supabase classification: no write / none / none / no.
<!-- OPEN_SOURCE_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_STATUS:end -->

<!-- TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_STATUS:start -->
TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_MERGE:

- Decision: `tracka_ffmpeg_ffprobe_source_of_truth_reconciliation_passed_ready_for_version_probe_approval`.
- Reconciliation method: `docs_only_central_reconciliation`.
- PR #463 remains non-central Track A reference evidence; its diff was not replayed or cherry-picked.
- Central branch has `docker/prod/render-worker/Dockerfile`, but PR #463 Track A runtime-path reports/scripts are recorded as absent unless a later owner merge/replay lands them.
- FFmpeg and FFprobe remain not installed/proven centrally; future version probes are not approved by this phase.
- Next prompt: `OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL`.
- Supabase classification: no write / none / none / no.
<!-- TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_STATUS:end -->
