# Production Container Image Plan

Milestone 5 defined production container image templates. Milestone 10 upgrades the CPU, render, QA, and tool-readiness images with core non-GPU install declarations. Codex still does not build images, push images, deploy Cloud Run services/jobs, download model weights, run media tools, or call providers in this milestone.

## Image Separation

| Image | Purpose | Tool boundary |
| --- | --- | --- |
| API | Backend API service only. | Node/server runtime, contracts, orchestration calls, and Secret Manager references later. No FFmpeg, GPU dependencies, model weights, or media/AI tool stack. |
| CPU worker | Future probe, proxy, analysis, OCR CPU, timeline preparation, and lightweight deterministic processing. | FFmpeg/ffprobe, Python, PyAV, PySceneDetect, OpenCV CPU, optional PaddleOCR CPU, Sharp/libvips, DuckDB, Polars, OpenTimelineIO, optional OpenImageIO/OpenColorIO after review. |
| GPU worker | Future transcription, segmentation, matting, enhancement, frame interpolation, and AI audio cleanup. | CUDA/Python/PyTorch-oriented template for faster-whisper, BiRefNet, SAM2, Kornia, DeepFilterNet, Demucs, Real-ESRGAN, FILM, OpenCV, optional PaddleOCR GPU. Model directories are placeholders only. |
| Render worker | Future programmatic composition, preview rendering, subtitle burn-in, final mux/transcode handoff. | Remotion, FFmpeg, ffprobe, libass, Sharp/libvips, OpenTimelineIO handoff, Hyperframe integration boundary. Revideo is excluded. |
| QA worker | Future output validation. | FFmpeg/ffprobe, OpenCV, Python, Sharp/libvips, optional OpenImageIO/OpenColorIO/audio analysis packages. QA blocks preview/final export when required gates fail. |
| Tool readiness worker | Future version/import/package/readiness checks. | Minimal Node/Python shell utilities. No model weights required; reports missing optional tools instead of executing recipes. |

## Milestone 10 Core Install Definitions

The CPU/render/QA/readiness images now declare FFmpeg/ffprobe, Python, PyAV, PySceneDetect, OpenCV headless, DuckDB, Polars, OpenTimelineIO, libass, and Sharp/libvips support where appropriate. These declarations are for future human image builds; they are not host installs and do not mean Codex built an image.

FFmpeg distro package use is acceptable for dev/readiness declarations, but commercial LGPL-safe production verification is still pending manual review.

## Milestone 11 GPU Install Foundation

The GPU worker image now declares CUDA-compatible runtime, Python, Node support, PyTorch/TorchVision, CTranslate2, faster-whisper, Kornia, OpenCV headless, DeepFilterNet, and Demucs package foundations. PaddleOCR/PaddlePaddle GPU remain optional/planned, while BiRefNet, SAM2, Real-ESRGAN, and FILM remain pending source-install review.

Model-weight directories are empty placeholders only. No model weights are downloaded, committed, baked into images, or treated as approved in M11.

## Render Stack Lock

The render image centers on the locked core stack:

- Hyperframe is the editor/timeline/interactive preview boundary.
- Remotion is the primary programmatic composition/render engine.
- FFmpeg owns final media export, mux, and transcode.
- libass supports subtitle burn-in where needed.
- OpenTimelineIO carries structured edit/timeline interchange.
- Revideo remains evaluation-only and is not installed as core.

## Template Boundary

Files under `docker/prod/` are production-oriented templates. Heavy package installation, model downloads, local media processing, image builds, image pushes, and Cloud Run deployment are all later human-approved steps.
## Milestone 12 Readiness Validation

M12 adds a unified readiness report that validates expected image contents for API, CPU, GPU, render, QA, and tool-readiness images. The report consumes Dockerfile declarations and tool readiness specs but does not build, push, or deploy images.

## Milestone 16A Render Image Consumption

M16A consumes render image readiness for Remotion, FFmpeg, and libass. The render image remains a template/readiness target only in Codex: no image build, Docker run, deployment, provider call, model download, arbitrary media processing, or Revideo production path is added.
