# AI-VIDEO-BROLL-GEN-9J-GCLOUD-AUTH-REFRESH Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-GCLOUD-AUTH-REFRESH: refresh local gcloud auth for read-only preflight, no VM/no inference`

Goal: refresh or select compatible local `gcloud` credentials so the next prompt can repeat read-only GCP preflight for the no-public-IP L4 proof VM path.

The Python runtime blocker is resolved by the Python 3.12 / `cp312` private wheelhouse. The remaining blocker is local `gcloud` credential refresh in non-interactive execution.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-2-result.md`
- `docs/ai-video-broll-generation-python-runtime-alignment-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

Allowed verification after auth refresh:

- `gcloud config get-value project`
- `gcloud config get-value account`
- read-only Compute project, zone, machine type, accelerator, quota, service account, firewall, and resource-existence checks;
- no secret, token, refresh-token, credential-file, or environment-value printing.

Expected next prompt if read-only auth verification passes:

`AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN-3: re-run controlled no-public-IP L4 VM create preflight, no inference`

Do not create a VM, disk, router, Cloud NAT, firewall rule, service account, service account key, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request. Do not run IAP transfer commands. Do not install dependencies on a VM. Do not clone source repositories. Do not import models, call `from_pretrained`, call `torch.load`, run inference, create generated frames or video, run FFmpeg, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, or claim beta, production, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.
