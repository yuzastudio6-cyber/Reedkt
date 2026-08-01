# Living Frame shared GPU parent hardened package matrix candidate

Status date: 2026-07-30

Status:
`official_package_matrix_observed_not_build_admitted`

Contract:
`living-frame-shared-gpu-parent-hardened-package-matrix-candidate-v1`

## Purpose

This namespaced contract gives the canonical backend owner an exact,
machine-verifiable starting matrix for replacing the vulnerable shared GPU
parent used by both SAM2 and ComfyUI.

The official PyTorch previous-version matrix publishes Torch `2.6.0` with
TorchVision `0.21.0` for CUDA `12.4`:

<https://docs.pytorch.org/get-started/previous-versions/>

The PyTorch 2.6 release also changes the default `torch.load` behavior to
`weights_only=true`, so exact checkpoint and graph regressions are mandatory:

<https://pytorch.org/blog/pytorch2-6/>

## Exact published core artifacts

The candidate binds official `linux/amd64`, CPython 3.10 artifacts:

| Role | Version | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Torch | `2.6.0+cu124` | 768,431,694 | `7f2ba7f7c0459320a521696f6b5bccc187f59890b23c9dfb6c49b0b87c6bfc97` |
| TorchVision | `0.21.0+cu124` | 7,282,128 | `3d3e74018eaa7837c73e3764dad3b7792b7544401c25a42977e9744303731bd3` |
| Triton | `3.2.0` | 253,090,354 | `b3e54983cd51875855da7c68ec05c05cf8bb08df361b1d5b69e05e40b0c9bd62` |
| NVIDIA cuSPARSELt | `0.6.2` | 150,057,751 | `df2c24502fd76ebafe7457dbc4716b2fec071aabaed4fb7691a201cde03704d9` |

The combined published byte length is `1,178,861,927`.

## Observed dependency delta

The exact current parent already reports the CUDA 12.4 dependency versions
required by the Torch 2.6 metadata for CUDA runtime, NVRTC, CUPTI, cuDNN,
cuBLAS, cuFFT, cuRAND, cuSolver, cuSparse, NCCL, NVTX, NVJitLink, and SymPy.

Two core changes are required:

- Triton `3.1.0` → `3.2.0`;
- add `nvidia-cusparselt-cu12==0.6.2`, whose distribution metadata is absent
  from the current parent.

This is not a complete offline closure. Pillow, Transformers, and inherited
system-package metadata findings also remain unresolved.

## Mandatory regression boundary

Before the candidate can become a build input, the canonical owner must:

1. produce the complete hash-locked offline dependency closure;
2. build a new non-root, no-runtime-download parent and derived images;
3. perform a complete Linux-host SBOM, vulnerability, license, VCS, secret,
   and signature disposition;
4. rerun SAM2 source/config/checkpoint load plus temporal inference;
5. rerun the exact ComfyUI five-model base/LoRA/ControlNet/IP-Adapter graph
   families and custom-node schema checks;
6. record real L4 resources, private outputs, persistence, QA, and review; and
7. version every source/runtime/request/result contract that currently pins
   Torch `2.5.1+cu124`.

## Authority boundary

This candidate:

- downloads no packages;
- builds no image;
- starts no GPU attempt;
- registers or dispatches no operation;
- creates no asset or cost receipt;
- authorizes no billing, public delivery, or production.

It is a frozen qualification input only.
