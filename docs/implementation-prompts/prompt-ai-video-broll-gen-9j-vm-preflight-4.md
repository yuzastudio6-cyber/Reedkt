# AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-4 Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-4: verify IAP wheelhouse transfer readiness, no VM/no inference`

Goal: verify that the completed private binary wheelhouse can be transferred to a future no-public-IP L4 proof VM over IAP, without creating the VM and without importing or running any model.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md`
- `docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-change-log.md`
- `docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-3-result.md`
- `docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64/SHA256SUMS.json`

Required checks:

- verify the wheelhouse manifest still reports `66` real wheels;
- verify the aggregate SHA-256 matches the current manifest;
- verify no AppleDouble sidecar files are included;
- verify the future IAP transfer command shape without running it;
- verify the future no-index install command shape without running it;
- verify the future remote path is private and VM-local;
- verify the future no-public-IP VM path still uses IAP, no runtime internet install, and no source repository clone;
- keep VM creation blocked until the transfer command packet and install packet pass diagnostics.

Expected next prompt if transfer-readiness validation passes:

`AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN: plan controlled no-public-IP L4 proof VM creation, no inference`

Do not create a VM, disk, router, Cloud NAT, firewall rule, service account, service account key, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request. Do not run IAP transfer commands. Do not install dependencies on a VM. Do not import models, call `from_pretrained`, call `torch.load`, run inference, create generated frames or video, run FFmpeg, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, install packages into the repository, clone source repositories, or claim beta, production, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.
