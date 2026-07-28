# Production GPU Worker Plan

## First GPU Target

The first production GPU test template uses Cloud Run Jobs with:

- GPU type: `nvidia-l4`
- GPU count: `1`
- `--no-gpu-zonal-redundancy`
- CPU: at least `4`
- Memory: at least `16Gi`
- Parallelism: `1`
- Controlled max retries
- Service account: `reeditpro-gpu-worker-sa`

This is a template only. No source milestone deploys GPU workers, runs GPU
smoke jobs, downloads model weights, or processes customer media.

## Future Premium Option

RTX PRO 6000 Blackwell or equivalent is future/premium/evaluation only. It requires:

- region availability;
- quota approval;
- cost approval;
- at least 20 CPU and 80Gi memory;
- model-weight and license approval;
- QA thresholds for every recipe using it.

## Runtime Rules

- One GPU per instance by default.
- GPU jobs execute approved plan snapshots, never raw chat.
- Unknown or non-commercial model weights are blocked until reviewed.
- Provider/model secrets are not granted to the GPU worker by default in Milestone 3.
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

L4 remains the first target. RTX PRO 6000 remains future/premium/evaluation only and is not the default GPU worker target.
## Milestone 17 GPU Cost Controls

M17 keeps GPU production jobs blocked. L4 remains the default future GPU target, while RTX PRO 6000 is future/premium/manual-approval-only.

Before any GPU worker deployment, humans must approve model weights, licenses, cost budgets, concurrency limits, timeouts, retry caps, and kill switches. No model weights are downloaded by M17.
