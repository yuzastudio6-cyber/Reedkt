# AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes`

Goal: have the project owner request the minimum global GPU quota required for the AI_VIDEO_BROLL_GENERATION controlled L4 proof VM.

Use these source documents first:

- `docs/ai-video-broll-generation-gpu-global-quota-fix-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-execute-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md`

Manual owner action:

- open the Google Cloud quota UI for project `reeditpro`;
- find quota metric `GPUS_ALL_REGIONS`;
- request limit `1`;
- keep regional `NVIDIA_L4_GPUS` in `us-central1` at limit `1` or higher;
- use a reason scoped to one controlled no-public-IP L4 proof VM for AI_VIDEO_BROLL_GENERATION;
- do not request broader GPU capacity, public IP capacity, network capacity, storage capacity, Cloud Run capacity, worker capacity, or production/beta quota.

Codex should not perform repo changes in this prompt. Codex may only verify quota after the owner says the request is approved.

Do not create a VM. Do not create disks, static addresses, reservations, service accounts, service-account keys, firewall rules, routers, Cloud NAT, buckets, custom images, Artifact Registry images, or Cloud Run jobs. Do not install SDK components. Do not run IAP transfer commands. Do not SSH. Do not install dependencies. Do not import models, call `from_pretrained`, call `torch.load`, run inference, create generated frames or video, run FFmpeg, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, or claim beta, production, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.

Expected next prompt after the owner reports quota approval:

`AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-VERIFY: verify GPUS_ALL_REGIONS quota increase, no VM/no inference`
