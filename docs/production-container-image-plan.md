# Production Container Image Plan

Current WeEditPro supersession: this milestone history does not authorize the
old generic CPU-heavy media topology or SAM 2. SAM 2 is historical-read-only.
The active quality-first policy assigns heavy model work to A100 80 GB,
standard GPU media work to L4, and permits L4 as a heavy-model fallback only
after independent quality qualification. Jobs are user-triggered and
scale-from-zero; CPU is control-plane/bookkeeping only, not a substantive
media or inference fallback.

Milestone 5 defined production container image templates. Milestone 10 upgrades the CPU, render, QA, and tool-readiness images with core non-GPU install declarations. Codex still does not build images, push images, deploy Cloud Run services/jobs, download model weights, run media tools, or call providers in this milestone.

## Image Separation

| Image | Purpose | Tool boundary |
| --- | --- | --- |
| API | Backend API service only. | Node/server runtime, contracts, orchestration calls, and Secret Manager references later. No FFmpeg, GPU dependencies, model weights, or media/AI tool stack. |
| Control-plane worker | Validation, orchestration, persistence, queue coordination, and bounded bookkeeping only. | No substantive media processing, model inference, CPU media fallback, or model weights. |
| GPU workers | Transcription, SAM 3.1 segmentation/tracking, matting, enhancement, frame interpolation, AI audio cleanup, hardware media processing, and deterministic GPU QA through separate purpose-bound images. | CUDA/Python/PyTorch foundations with A100 80 GB heavy primary, L4 normal processing, and separately qualified L4 heavy fallback. SAM 2 is excluded from new builds and dispatch. |
| L4 render worker | Programmatic composition, preview rendering, subtitle burn-in, final mux/transcode handoff. | L4-qualified Remotion/Chromium and FFmpeg hardware encode/decode profiles, plus ffprobe, libass, Sharp/libvips, OpenTimelineIO handoff, and the Hyperframe integration boundary. Revideo is excluded. |
| L4 QA worker | Output validation and deterministic visual/media measurements. | L4-qualified FFmpeg/ffprobe, OpenCV CUDA, Kornia/Torch CUDA, Sharp/libvips, and separately reviewed OpenImageIO/OpenColorIO/audio profiles. QA blocks preview/final export when required gates fail. |
| Tool readiness worker | Future version/import/package/readiness checks. | Minimal Node/Python shell utilities. No model weights required; reports missing optional tools instead of executing recipes. |

## Milestone 10 Core Install Definitions

The historical CPU/render/QA/readiness templates declared FFmpeg/ffprobe,
Python, PyAV, PySceneDetect, OpenCV headless, DuckDB, Polars, OpenTimelineIO,
libass, and Sharp/libvips support where appropriate. Current execution must
follow the quality-first GPU placement policy; this historical declaration is
not authority to run substantive media work on CPU.

FFmpeg distro package use is acceptable for dev/readiness declarations, but commercial LGPL-safe production verification is still pending manual review.

## Milestone 11 GPU Install Foundation

The historical generic GPU image declared CUDA-compatible runtime, Python,
Node support, PyTorch/TorchVision, CTranslate2, faster-whisper, Kornia,
OpenCV headless, DeepFilterNet, and Demucs package foundations. Current SAM
3.1 work uses dedicated offline image candidates with immutable supply-chain
and route-specific qualification. PaddleOCR/PaddlePaddle GPU remain
optional/planned, while BiRefNet, Real-ESRGAN, and FILM remain pending
source-install review. SAM 2 has no current install path.

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

Human build scripts now require an exactly clean checkout, derive the commit/tree instead of trusting caller-authored source identity, and pass those values into fixed OCI source labels. API and worker server artifacts are built inside Docker from that source. The render template no longer copies the separate mock-only Remotion worker artifact. These changes make later immutable-image inspection meaningful, but do not build or qualify any image by themselves.
## Milestone 12 Readiness Validation

M12 adds a unified readiness report that validates expected image contents for API, CPU, GPU, render, QA, and tool-readiness images. The report consumes Dockerfile declarations and tool readiness specs but does not build, push, or deploy images.

The independent host verifier can produce a non-promotable local receipt after matching a confined in-container candidate to an exact clean commit/tree, immutable repository digest, image role, and OCI labels. Static readiness does not consume that receipt, and production image qualification remains false until reviewed manual license/model/source-install evidence and a later canonical release authority exist.

## Milestone 16A Render Image Consumption

M16A consumes render image readiness for Remotion, FFmpeg, and libass. The render image remains a template/readiness target only in Codex: no image build, Docker run, deployment, provider call, model download, arbitrary media processing, or Revideo production path is added.
