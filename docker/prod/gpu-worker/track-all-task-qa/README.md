# WeEditPro Track All SAM 3.1 L4 task QA

This directory defines the fixed, least-privilege CUDA image candidate for the
post-SAM mask-measurement stage. It is a separate image from the heavy SAM 3.1
model runtime: SAM 3.1 remains A100 80 GB primary with a separately qualified
L4 fallback, while this deterministic task-QA operation is normal L4 GPU work.

The worker runs only `tool.kornia.refine_mask.v1`. It rereads the exact SAM
mask manifest and every lossless PNG for every approved subject and frame,
performs the substantive morphology and temporal measurements on CUDA through
Torch/Kornia, and cross-checks every mask through OpenCV CUDA. CPU is limited
to bounded PNG decoding, private-file hashing, and response serialization; a
CPU-only substantive QA path does not exist.

The fixed mount is:

```text
/mnt/reeditpro/private/canonical-professional-gpu/sam3_1/v1/invocations/<server invocation>/
  output/mask-manifest.json
  output/frame-......png
  task-qa/task.json
  task-qa/response.json       # create-only
```

The request carries no path, URL, command, code, environment, model, media
bytes, price, usage, or customer-credit claim. The invocation identity is the
only environment selector and is validated before the fixed path is formed.
The response is worker evidence only. The canonical backend must still reread
the immutable image release, execution envelope, launch, terminal Cloud Run
observation, exact platform usage, billing-account-effective L4 price, attempt
cost, SAM result admission, and independent private scene review before it can
compile the task-QA measurement accepted by Track All.

The private Cloud Build capsule contains only a hash-locked wheelhouse, the
reviewed OpenCV-CUDA receipt/build, and the exact NVIDIA CUDA 12.8
forward-compatibility package/receipt. It contains no SAM checkpoint, model
weight, credential, or customer media. Build source alone grants no image
release, L4 dispatch, QA approval, credit settlement, delivery, or production
authority.

Operational release remains fail-closed until an immutable digest has an SPDX
SBOM, zero critical/high/unknown vulnerability findings, KMS signature, SLSA
provenance, real L4 device/kernel qualification, complete-frame adversarial
quality evidence, scale-back-to-zero evidence, and the exact current
billing-account-effective cost receipt.
