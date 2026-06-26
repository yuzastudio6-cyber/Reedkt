# AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN: plan controlled no-public-IP L4 proof VM creation, no inference`

Goal: create a no-execution VM creation plan for the cost-friendly L4 proof path using the completed private wheelhouse and IAP-only access model. This prompt may plan exact create/delete commands but must not create the VM or run inference.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md`
- `docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-3-result.md`
- `docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

Required future VM constraints:

- project: `reeditpro`;
- zone: `us-central1-b`;
- machine type: `g2-standard-4`;
- accelerator: one `nvidia-l4`;
- VM name: `reeditpro-ai-broll-wan-l4-proof`;
- service account: `reeditpro-ai-broll-proof-sa`;
- target tag: `ai-video-broll-wan-l4-proof`;
- external IP disabled;
- IAP-only SSH/transfer;
- auto-delete boot disk;
- no Cloud NAT;
- no source repository clone;
- no runtime internet dependency install;
- dependency install uses only the private wheelhouse transferred over IAP;
- no model import, no inference, no generated media in this VM create plan.

Expected next prompt if the VM creation plan passes:

`AI-VIDEO-BROLL-GEN-9J-VM-CREATE-EXECUTE: create controlled no-public-IP L4 proof VM, no inference`

Do not create a VM, disk, router, Cloud NAT, firewall rule, service account, service account key, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request. Do not run IAP transfer commands. Do not install dependencies on a VM. Do not import models, call `from_pretrained`, call `torch.load`, run inference, create generated frames or video, run FFmpeg, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, install packages into the repository, clone source repositories, or claim beta, production, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.
