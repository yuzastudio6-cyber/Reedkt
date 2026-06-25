# ReeditPro GPU Worker Image

Milestone 11 prepares the GPU AI worker image foundation for future
transcription, segmentation, masks, enhancement, interpolation, and AI audio
tools. It does not execute those tools.

The image targets Cloud Run Jobs with NVIDIA L4 first:

- one GPU per instance;
- minimum 4 CPU and 16Gi memory for L4;
- `--no-gpu-zonal-redundancy`;
- parallelism 1 by default.

RTX PRO 6000 remains future/premium/evaluation only and requires 20 CPU, 80Gi
memory, region/quota/cost approval, model-weight approval, and QA approval.

Model-weight directories are empty placeholders. Production execution requires
approved manifests and reviewed weights mounted or provided by a later milestone.

The image runs `docker/prod/ai-graphics-gpu-install-smoke.py` during build to
prove import-only installation for the AI graphics GPU package set. That smoke
does not require a CUDA device, load model weights, process media, or call
providers.
