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

This is a template only. Milestone 11 still does not deploy GPU workers, run GPU smoke jobs, download model weights, or process media.

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

## Milestone 11 Image Foundation

The GPU worker image will be produced later from `docker/prod/gpu-worker/Dockerfile`. M11 adds package declarations and model-weight manifest templates only. It does not build the image, execute a GPU job, download weights, or run inference.

L4 remains the first target. RTX PRO 6000 remains future/premium/evaluation only and is not the default GPU worker target.
## Milestone 17 GPU Cost Controls

M17 keeps GPU production jobs blocked. L4 remains the default future GPU target, while RTX PRO 6000 is future/premium/manual-approval-only.

Before any GPU worker deployment, humans must approve model weights, licenses, cost budgets, concurrency limits, timeouts, retry caps, and kill switches. No model weights are downloaded by M17.
