# AI-VIDEO-BROLL-GEN-9J-GCP-IAP-EGRESS-FIX Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-GCP-IAP-EGRESS-FIX: enable IAP API and approve no-public-IP dependency path, no VM/no inference`

Goal: resolve the VM preflight blockers without creating a VM and without inference. This prompt may enable the Cloud Identity-Aware Proxy API only after re-verifying the project, branch, and no-runtime safety gates. It must also choose a safe dependency setup path for a no-public-IP proof VM.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-vm-preflight-2-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

Required decisions:

- re-check project is `reeditpro`;
- re-check target zone is `us-central1-b`;
- re-check `g2-standard-4` and `nvidia-l4` quota/usage;
- enable `iap.googleapis.com` only if it remains disabled and project identity is verified;
- keep VM creation blocked;
- keep external-IP VM creation rejected;
- approve exactly one no-public-IP dependency path for the next VM gate.

Dependency path options:

1. preferred for cost/security: create a local wheelhouse/dependency bundle in a later prompt and transfer it over IAP; no Cloud NAT recurring cost;
2. alternative: approve Cloud NAT/private egress in a later prompt with cost and cleanup evidence;
3. rejected now: external-IP VM with open default SSH exposure;
4. rejected now: ad hoc source repository clone on the VM;
5. rejected now: unpinned dependency installation outside `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`.

Do not create a VM, disk, router, Cloud NAT, firewall rule, service account, service account key, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request in this prompt unless the prompt is explicitly revised. Do not install dependencies, import models, call `from_pretrained`, run inference, create generated frames or video, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, or claim beta/production/runtime readiness.

Expected next prompt if IAP and dependency path approval pass:

`AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-3: re-check controlled L4 proof VM readiness, no inference`
