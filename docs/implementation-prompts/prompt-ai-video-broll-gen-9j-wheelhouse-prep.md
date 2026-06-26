# AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-PREP Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-PREP: build local dependency wheelhouse for IAP transfer, no VM/no inference`

Goal: build and validate the local dependency wheelhouse required by the no-public-IP L4 proof VM path. This prompt may install/download Python wheel artifacts only into a private local wheelhouse directory outside the repo, then write a checksum manifest and diagnostics. It must not create a VM and must not import or run the model.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-vm-preflight-3-result.md`
- `docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

Required behavior:

- use a private local cache path outside the repository;
- use the committed requirements manifest exactly;
- create a wheelhouse checksum manifest with file names, sizes, and SHA-256 values;
- reject source repository clones;
- reject model downloads;
- reject generated media;
- reject provider API calls;
- reject Supabase/SQL/storage/signed URL/public artifact paths;
- keep VM creation blocked after this prompt unless a later VM preflight confirms transfer readiness.

Preferred private output path:

```text
/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps
```

Expected next prompt if the wheelhouse build and checksum manifest pass:

`AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-4: verify IAP wheelhouse transfer readiness, no VM/no inference`

Do not create a VM, disk, router, Cloud NAT, firewall rule, service account, service account key, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request. Do not import models, call `from_pretrained`, run inference, create generated frames or video, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, or claim beta/production/runtime readiness.
