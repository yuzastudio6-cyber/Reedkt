# ReeditPro Production Container Templates

Milestone 5 defined production image templates. Milestone 10 upgrades the
CPU/render/QA/tool-readiness image definitions with core non-GPU install
declarations. Codex must not build these images, push them, deploy them,
download model weights, process user media, or call providers.

## Images

- `api`: backend API service only. No heavy media tools, GPU dependencies, or model weights.
- `cpu-worker`: CPU analysis/proxy/timeline image definition with FFmpeg/ffprobe, Python, PyAV, PySceneDetect, OpenCV headless, DuckDB, Polars, OpenTimelineIO, and Sharp/libvips system support.
- `gpu-worker`: GPU AI image definition for future approved model recipes. Milestone 11 declares PyTorch/CTranslate2/faster-whisper/Kornia/OpenCV/DeepFilterNet/Demucs packages, documents source-review-only tools, and creates empty model-weight placeholders only.
- `render-worker`: Remotion/FFmpeg/libass render image definition with Sharp/libvips and OpenTimelineIO handoff support.
- `qa-worker`: output validation image definition with FFmpeg/ffprobe, Python, OpenCV headless, and Sharp/libvips support.
- `tool-readiness-worker`: version/import/readiness check image definition for safe CPU/render checks.

These templates document expected runtime boundaries. Real build hardening,
pinned package versions, legal review, and vulnerability scanning happen in
later milestones.

FFmpeg/ffprobe declarations use distro packages for dev/readiness image
construction only. Final commercial LGPL-safe build verification remains pending
manual review under `docker/prod/ffmpeg-lgpl-build-policy.md`.

GPU model/checkpoint weights are never included in these images by default.
Every GPU model tool requires a reviewed model-weight manifest before paid
production execution.
