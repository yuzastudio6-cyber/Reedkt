# AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-FIX Prompt

Prompt: `AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-FIX: resolve Torch Linux GPU runtime wheel source, no VM/no inference`

Goal: repair the private dependency wheelhouse plan by identifying an approved wheel source or compatible pinned dependency set for the Torch Linux GPU runtime dependencies required by the no-public-IP L4 proof VM path. This prompt must not create a VM and must not import or run any model.

Use these source documents first:

- `docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-result.md`
- `docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-change-log.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-3-result.md`
- `docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64/SHA256SUMS.json`

Required investigation:

- verify the Torch Linux wheel runtime dependency metadata;
- identify whether an approved public wheel index, PyTorch channel, NVIDIA package index, or version-pin adjustment can satisfy the Linux GPU runtime dependencies without source builds;
- keep the result private-wheelhouse-only and transfer-ready-only;
- document any exact index source and license/provenance notes before accepting it;
- regenerate the checksum manifest only if a complete binary wheelhouse can be built;
- keep VM creation blocked unless the wheelhouse is complete and the diagnostic proves it.

Current unresolved dependency set:

- `cuda-toolkit[cudart,cufft,cufile,cupti,curand,cusolver,cusparse,nvjitlink,nvrtc,nvtx]==13.0.2`
- `nvidia-cublas<=13.1.1.3,>=13.1.0.3`
- `cuda-bindings<14,>=13.0.3`
- `nvidia-cudnn-cu13==9.20.0.48`
- `nvidia-cusparselt-cu13==0.8.1`
- `nvidia-nccl-cu13==2.29.7`
- `nvidia-nvshmem-cu13==3.4.5`
- `triton==3.7.1`

Expected next prompt if the wheelhouse is repaired and complete:

`AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-4: verify IAP wheelhouse transfer readiness, no VM/no inference`

Do not create a VM, disk, router, Cloud NAT, firewall rule, service account, service account key, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request. Do not import models, call `from_pretrained`, call `torch.load`, run inference, create generated frames or video, run FFmpeg, touch Supabase, execute SQL, call providers, dispatch workers, create signed URLs, create public artifacts, mutate credits, install packages into the repository, clone source repositories, or claim beta, production, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.
