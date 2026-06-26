# AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-FIX Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-FIX: request or verify GPUS_ALL_REGIONS quota for controlled L4 proof VM, no VM create/no inference`

Goal: repair the blocker discovered by `AI-VIDEO-BROLL-GEN-9J-VM-CREATE-EXECUTE`, where the approved no-public-IP L4 proof VM create command was rejected because global GPU quota `GPUS_ALL_REGIONS` has limit `0`.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-vm-create-execute-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md`
- `docs/ai-video-broll-generation-python-runtime-alignment-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md`

Allowed actions:

- inspect quota state with read-only `gcloud` commands;
- inspect whether `GPUS_ALL_REGIONS` can be increased through the current account/project;
- document the required minimum quota for one controlled L4 proof VM;
- if explicitly permitted by the implementation prompt and safe in the account, file or prepare only the minimum one-GPU global quota request required for the proof VM;
- record sanitized evidence and stop before VM creation.

Required target:

- `GPUS_ALL_REGIONS` must be at least `1`;
- regional `NVIDIA_L4_GPUS` in `us-central1` must remain at least `1`;
- target VM shape remains one `g2-standard-4` with one `nvidia-l4`;
- no public IP, IAP-only access, proof service account, and no-inference boundaries remain unchanged.

Do not create a VM. Do not create disks, static addresses, reservations, service accounts, service-account keys, firewall rules, routers, Cloud NAT, buckets, custom images, Artifact Registry images, or Cloud Run jobs. Do not run IAP transfer commands. Do not SSH. Do not install dependencies. Do not import models, call `from_pretrained`, call `torch.load`, run inference, create generated frames or video, run FFmpeg, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, or claim beta, production, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.

Expected next prompt if quota becomes sufficient:

`AI-VIDEO-BROLL-GEN-9J-VM-CREATE-EXECUTE-2: retry controlled no-public-IP L4 proof VM create, no inference`
