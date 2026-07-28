# ReeditPro GPU Worker Image

The GPU image is an unqualified build candidate for transcription,
segmentation, masks, enhancement, interpolation, and AI audio tools. It is not
a deployed or production-ready image.

The image targets Cloud Run Jobs with NVIDIA L4 first:

- one GPU per instance;
- minimum 4 CPU and 16Gi memory for L4;
- `--no-gpu-zonal-redundancy`;
- parallelism 1 by default.

RTX PRO 6000 remains future/premium/evaluation only and requires 20 CPU, 80Gi
memory, region/quota/cost approval, model-weight approval, and QA approval.

The candidate includes the exact hash-locked Faster Whisper Python environment
and fixed CUDA-only runner under
`/opt/reeditpro/gpu-operations/faster-whisper`. The shared TypeScript operation
router still requires a process-bound adapter and exact current attempt
authority before it may invoke that runner. The runner itself accepts only a
closed request on stdin and fixed server-owned mount locations.

Model-weight directories remain empty placeholders. Production execution
requires approved manifests and reviewed weights delivered through the
canonical read-only mount authority. The candidate still needs a clean
Linux/amd64 image build, immutable digest inspection, L4 CUDA/model-load
benchmark, live service-identity/IAM proof, private input/output transport,
artifact QA/reconciliation, and attempt-cost evidence.
