# AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-3 Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-3: re-check controlled L4 proof VM readiness, no inference`

Goal: re-check the controlled L4 proof VM readiness after IAP API enablement and dependency-path approval. This prompt must not create a VM. It must decide whether the future VM creation gate is ready or still blocked by the missing wheelhouse/dependency bundle.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-2-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

Required checks:

- re-check project is `reeditpro`;
- re-check target zone is `us-central1-b`;
- re-check `g2-standard-4` and `nvidia-l4` remain available and quota-safe;
- re-check `iap.googleapis.com` remains enabled;
- re-check IAP SSH firewall rule exists with source `35.235.240.0/20` and target tag `ai-video-broll-wan-l4-proof`;
- re-check proof service account has zero user-managed keys;
- re-check no existing proof VM, disk, static address, reservation, or custom image exists;
- re-check external-IP proof VM remains rejected;
- re-check selected dependency path is local wheelhouse transfer over IAP;
- verify whether an approved local wheelhouse/dependency bundle and checksum manifest exist.

Decision rules:

- If IAP is enabled but the wheelhouse is missing, keep VM creation blocked and recommend `AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-PREP: build local dependency wheelhouse for IAP transfer, no VM/no inference`.
- If IAP is enabled and an approved wheelhouse plus checksum manifest exist, recommend `AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PACKET: prepare no-public-IP L4 proof VM creation command packet, no execution`.
- If IAP is disabled again, recommend `AI-VIDEO-BROLL-GEN-9J-GCP-IAP-EGRESS-FIX-RETRY: re-enable IAP API and re-check dependency path, no VM/no inference`.

Do not create a VM, disk, router, Cloud NAT, firewall rule, service account, service account key, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request. Do not install dependencies, build a wheelhouse, create a virtual environment, import models, call `from_pretrained`, run inference, create generated frames or video, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, or claim beta/production/runtime readiness.
