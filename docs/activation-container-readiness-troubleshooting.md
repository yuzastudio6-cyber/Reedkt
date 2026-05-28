# Activation Container Readiness Troubleshooting

Use this guide after humans run container readiness and Phase 21 parses the local text logs.

| Issue | Meaning | Next action |
| --- | --- | --- |
| Missing `ffmpeg` | CPU/render/QA image cannot satisfy media readiness. | Fix the image build inputs, rebuild manually, then rerun readiness. |
| Missing `ffprobe` | Probe/readiness checks are incomplete. | Add or fix FFmpeg probe package support in the relevant image. |
| Missing Python package | Python worker dependency is absent. | Review package install logs and lock the dependency in the image build plan. |
| Missing `cv2` | OpenCV import failed or package is absent. | Verify `opencv-python-headless` install and import path. |
| Missing Sharp/libvips | Node image processing support is absent. | Review Sharp/libvips package compatibility and rebuild manually. |
| Missing Remotion | Render worker lacks render package metadata. | Confirm render build dependencies and server build output. |
| libass pending | Subtitle support needs manual verification. | Keep as warning until a controlled libass readiness check passes. |
| libass failed | Subtitle support is broken. | Block Phase 23 until render image support is fixed. |
| OpenTimelineIO missing | Timeline interchange support is absent. | Fix CPU/render dependency installation or document a blocker. |
| GPU package missing | GPU/model worker is incomplete. | Defer for non-GPU staging or resolve before GPU phases. |
| Model-weight blocked | Model weights are absent or unapproved. | Do not download weights; wait for Phase 26 approval workflow. |
| Image tag mismatch | Logs do not match the reviewed tag. | Re-run readiness with the approved image tag. |
| Readiness log missing | No evidence exists for an image. | Collect human-run readiness output before Phase 23. |
| Docker daemon not running | Human readiness command cannot start locally. | Start Docker locally or use the approved build host; Codex still must not run Docker. |
