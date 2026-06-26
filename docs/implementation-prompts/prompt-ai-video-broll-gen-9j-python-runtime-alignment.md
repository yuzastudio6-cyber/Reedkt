# AI-VIDEO-BROLL-GEN-9J-PYTHON-RUNTIME-ALIGNMENT Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-PYTHON-RUNTIME-ALIGNMENT: align VM Python runtime with private wheelhouse, no VM/no inference`

Goal: resolve the Python runtime mismatch found by AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN before any controlled L4 VM create execution prompt is allowed.

The current private wheelhouse is built for Python 3.13 / `cp313`. The inspected Google Deep Learning VM image candidates for the no-public-IP L4 proof path report Python 3.12. This prompt must choose one safe alignment route and produce validation evidence without creating a VM or running inference.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-vm-create-plan.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-change-log.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md`
- `docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md`
- `docs/ai-video-broll-generation-python-cuda-compatibility-plan.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64/SHA256SUMS.json`

Allowed alignment routes to evaluate:

1. Identify a no-public-IP L4-compatible image that clearly ships Python 3.13 with a compatible NVIDIA/CUDA stack.
2. Plan or build a new private no-index wheelhouse for the selected VM image Python runtime, likely Python 3.12 if the Deep Learning VM image family remains selected.
3. Plan a separately approved offline Python 3.13 runtime packet that can be transferred over IAP without source builds, runtime internet installs, Cloud NAT, repository clone, VM source compilation, provider calls, workers, or media execution.

Expected next prompt if alignment evidence passes:

`AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN-2: re-plan controlled no-public-IP L4 proof VM creation with aligned Python runtime, no inference`

Do not create a VM, disk, router, Cloud NAT, firewall rule, service account, service account key, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request. Do not run IAP transfer commands. Do not install dependencies on a VM. Do not install packages into the repository unless the prompt explicitly chooses and authorizes a new private wheelhouse build outside the repo. Do not clone source repositories. Do not import models, call `from_pretrained`, call `torch.load`, run inference, create generated frames or video, run FFmpeg, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, or claim beta, production, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.
