# AI Video B-roll Generation Runtime Dependency Matrix

Status: `ai_video_broll_gen_3_runtime_dependency_matrix_no_execution`

This matrix ranks future dependency lanes by use case and cost. It is not an install manifest.

| Use case | Preferred model lane | Dependency lane | CPU/GPU expectation | Duplicate-risk control |
| --- | --- | --- | --- | --- |
| Realistic stock-style B-roll | Wan / Wan2.1 T2V 1.3B first | Shared PyTorch + diffusers plan | Small preview GPU review required | Reuse AI video B-roll lane; do not duplicate provider router. |
| Product/environment filler | Wan / Wan2.1 T2V 1.3B, then Wan 14B after review | Shared PyTorch + diffusers plan, official repo only if required | Small to high GPU review required | Remotion still owns final composition. |
| Image-to-video or keyframe clip | LTX / LTX-Video or Wan I2V after source approval | Shared PyTorch + diffusers plan | Small/mid GPU review required | GPT-Image-2 owns still/keyframe creation; AI video only animates assets. |
| Fast preview | LTX / LTX-Video | Shared PyTorch + diffusers plan | Small preview GPU review required | Preview is private and not final export. |
| Research/fallback | Mochi 1 | uv-style isolated Python project plan | High VRAM review required | Research only; no default route. |
| Premium cinematic benchmark | HunyuanVideo | none | blocked | Legal/territory/commercial gate required. |

## Dependency Buckets

| Bucket | Planned contents | Gate 3 status |
| --- | --- | --- |
| Core Python | Python 3.10+ virtual environment, packaging tools, model-loader dependencies | planned only |
| PyTorch stack | PyTorch, torchvision if required, CUDA-compatible build after owner review | planned only |
| Diffusers stack | diffusers, transformers, accelerate, safetensors, huggingface-hub where required | planned only |
| Wan official stack | official repository requirements only if shared Diffusers path is insufficient | deferred |
| LTX official stack | exact-version LTX packages only after version split acceptance | deferred |
| Mochi stack | uv-style project, optional performance packages, output-video dependency handoff | research-only |
| Media/export stack | FFmpeg/ffprobe, image/video export helpers | blocked and owned by Track A/Track B |
| Container/cloud stack | Docker, Cloud Run, GCP GPU images, Artifact Registry | blocked pending owner review |

## Gate 3 Runtime Flags

- `dependenciesInstalled: false`
- `virtualEnvironmentCreated: false`
- `modelWeightsDownloaded: false`
- `modelImported: false`
- `inferenceRun: false`
- `generatedVideoCreated: false`
- `dockerOrGcpTouched: false`
- `workerDispatched: false`
- `betaUnlocked: false`
- `productionUnlocked: false`
