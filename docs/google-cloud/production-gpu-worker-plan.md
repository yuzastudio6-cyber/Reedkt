# Production GPU Worker Plan

## Active quality-first GPU topology

The prior L4-first template is historical and cannot authorize a new plan.
WeEditPro uses exactly two accelerator classes:

- A100 80 GB heavy primary: one `a2-ultragpu-1g` Google Cloud Batch job,
  12 vCPU, 170 GiB memory, and 375 GiB local scratch per approved attempt.
- L4 standard primary: one Cloud Run Job with 8 vCPU and 32 GiB memory for
  normal substantive media processing, rendering/encoding, deterministic
  inspection, and media QA.
- L4 heavy fallback: the same accelerator envelope but a distinct immutable
  release and job identity. It is eligible only after a server-owned terminal
  pre-inference A100 failure and may not reduce model, resolution, or QA.

Every route uses one GPU, one user attempt per instance, no hidden platform
retry, no prewarming/keepalive, and a minimum idle count of zero. RTX PRO 6000
is not part of the current placement or fallback policy.

## Runtime Rules

- One GPU per instance by default.
- GPU jobs execute approved plan snapshots, never raw chat.
- A funded estimate/reservation and current billing-account-effective rate
  authority are required before job creation.
- Unknown or non-commercial model weights are blocked until reviewed.
- Provider/model secrets are granted only through an exact operation-specific
  service identity and reviewed numeric secret version.
- No model/checkpoint download occurs at job time.
- Cloud Run L4's documented 535 driver branch must use the exact offline
  NVIDIA CUDA 12.8 forward-compatibility package and prove the loaded driver
  library path. Driver changes invalidate the L4 release until requalified.
- Host CPU may orchestrate bounded I/O and output serialization but cannot be
  a substantive media/model fallback.
- Revideo is not part of the GPU worker plan.

## Current operation-router boundary

The shared GPU worker now has a source-implemented operation router for the
candidate-only Faster Whisper CUDA contract. It performs exact request,
current-source, model-layout, CUDA-only, and digest-only response revalidation
through a one-shot process-bound runtime port. See
`canonical-gpu-worker-operation-router.md`.

This closes the missing source router, not the hosted runtime. Live Cloud Run
execution and immutable image qualification remain blocked. The image
candidate now has a pinned Linux/amd64 CUDA base, an isolated exact
Faster Whisper environment, the fixed runner, and a no-shell subprocess
adapter. Service identity/IAM, private input/model mounts, output artifact
commitment and QA, attempt cost, and worker completion receipts also remain
blocked. Faster Whisper remains outside the exact 50 production tool
identities.

## Historical Milestone 11 Image Foundation

Milestone 11 originally added package declarations and model-weight manifest
templates only. The current Dockerfile has since advanced to the unqualified
Faster Whisper image candidate described above, but no source milestone has
built or pushed that image, executed a GPU job, downloaded weights at runtime,
or run production inference.

This historical section does not override the active A100-heavy/L4-normal
topology above.
## Milestone 17 GPU Cost Controls

M17 historical source did not qualify a cloud route. Current qualification is
route-specific: A100 80 GB heavy primary, L4 standard primary, and the
separate L4 heavy fallback.

Before any GPU worker deployment, humans must approve model weights, licenses, cost budgets, concurrency limits, timeouts, retry caps, and kill switches. No model weights are downloaded by M17.
