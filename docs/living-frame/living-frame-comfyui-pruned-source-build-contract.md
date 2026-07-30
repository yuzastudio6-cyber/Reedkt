# Living Frame ComfyUI runtime-pruned source build contract

Status date: 2026-07-30

Status: `source_contract_only_runtime_execution_not_authorized`

## Purpose

The first complete Linux-local scan of the source-defined hardened ComfyUI
candidate found that the Python remediation succeeded, but the inherited GPU
parent still contributed build-only OS packages and stale installer metadata
inside the operation venv.

The new versioned build path preserves the original evidence and adds:

- `Dockerfile.local-hardened-runtime-pruned-candidate`;
- `prune-hardened-runtime-offline.sh`; and
- `verify-hardened-runtime-pruned.py`.

## Fixed behavior

The build still consumes:

- the exact canonical offline ComfyUI parent at SHA-256
  `84358d2b8272998bb3258ca18c46fad4de80118da24528aae98be39ae25bcc1b`;
- four exact Torch/TorchVision/Triton/cuSPARSELt wheels;
- two exact TorchAudio/Pillow remediation wheels; and
- the exact 27-wheel Transformers closure.

Both installation and runtime pruning run with build networking disabled. The
pruner accepts no arguments, removes operation-local `pip` and `setuptools`
metadata, purges the inherited compiler, Linux headers, Node/npm, Git/GnuPG,
OpenSSL CLI, package manager, and related build-only packages, and then reruns
the canonical installed-layout verifier.

The final verifier runs as UID/GID `65532:65532`, replays the existing hardened
runtime verifier, proves the pruned packages and executables are absent, and
preserves:

- Torch `2.6.0+cu124`;
- TorchVision `0.21.0+cu124`;
- TorchAudio `2.6.0+cu124`;
- Pillow `12.3.0`;
- Transformers `5.5.0`;
- Hugging Face Hub `1.5.0`;
- the fixed canonical runner;
- the `sam2` import denial; and
- zero model loads or graph executions.

## Authority boundary

This contract does not itself prove that an image was built or scanned. It
does not mount model weights, dispatch a GPU operation, create an asset or
cost receipt, approve QA, bill a customer, deliver publicly, or enable
production. A frozen source-build receipt and complete vulnerability/SBOM/
license evidence for the resulting digest are required next.
