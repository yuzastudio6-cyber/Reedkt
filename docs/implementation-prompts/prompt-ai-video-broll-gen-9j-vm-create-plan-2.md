# AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN-2 Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN-2: re-plan controlled no-public-IP L4 proof VM creation with aligned Python runtime, no inference`

Goal: repeat the controlled no-public-IP L4 VM creation plan now that a Python 3.12 / `cp312` private wheelhouse exists for the inspected GCP Deep Learning VM image runtime.

Use these source documents first:

- `docs/ai-video-broll-generation-python-runtime-alignment-result.md`
- `docs/ai-video-broll-generation-python-runtime-alignment-change-log.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md`
- `docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

Required recheck:

- verify the Python 3.12 wheelhouse manifest still reports `66` real wheels;
- verify the aggregate SHA-256 matches `55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64`;
- verify no AppleDouble sidecars are present;
- verify inspected image family Python runtime remains aligned to Python 3.12 or update the plan if image facts changed;
- re-check GCP project, zone, machine type, L4 accelerator, quotas, proof service account, IAP firewall rule, and absence of existing proof VM/disk/address/reservation;
- draft the VM create/delete command shape with no external IP and IAP-only access;
- keep VM creation blocked unless the recheck passes.

Expected next prompt if the VM creation plan recheck passes:

`AI-VIDEO-BROLL-GEN-9J-VM-CREATE-EXECUTE: create controlled no-public-IP L4 proof VM, no inference`

Do not create a VM, disk, router, Cloud NAT, firewall rule, service account, service account key, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request. Do not run IAP transfer commands. Do not install dependencies on a VM. Do not clone source repositories. Do not import models, call `from_pretrained`, call `torch.load`, run inference, create generated frames or video, run FFmpeg, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, or claim beta, production, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.
