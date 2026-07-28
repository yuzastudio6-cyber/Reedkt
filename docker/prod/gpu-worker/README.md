# WeEditPro GPU Worker Image

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

The same shared image now includes a separate hash-locked Python 3.11.14
environment for the existing `rembg` tool under
`/opt/reeditpro/gpu-operations/rembg`. Its runner accepts only the canonical
exact source-frame PNG, the exact U2NetP ONNX artifact, CUDA execution, and one
private mask output. CPU fallback, runtime model download, caller paths, caller
URLs, and caller bytes are rejected. Its two measurement files are
process-bound evidence, not additional customer assets.

The Dockerfile exposes
`faster_whisper_runtime_build_candidate` as an inspection-only stage. It omits
the older broad `requirements.gpu.txt` install and performs exact package/import
checks during the build. Building that target locally proves only that the
hash-locked Linux/amd64 environment can be assembled; it is not a deployed
Cloud Run Job, a GPU inference result, or production qualification.

The Dockerfile also exposes `rembg_runtime_build_candidate`. Python 3.11.14 is
built from its exact checksum-pinned source archive because rembg 2.0.76 no
longer supports the Ubuntu 22.04 system Python. The rembg environment is locked
to 29 exact Linux/amd64 wheels, including `onnxruntime-gpu` 1.27.0. This target
is likewise inspection-only until a clean image build, NVIDIA L4 provider
load, exact model mount, source-frame mount, inference benchmark, output
reread, QA, and cost evidence all pass.

Model-weight directories remain empty placeholders. Production execution
requires approved manifests and reviewed weights delivered through the
canonical read-only mount authority. The candidate still needs a clean
Linux/amd64 image build, immutable digest inspection, L4 CUDA/model-load
benchmark, live service-identity/IAM proof, private input/output transport,
artifact QA/reconciliation, and attempt-cost evidence.
