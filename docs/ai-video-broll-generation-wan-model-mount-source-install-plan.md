# AI Video B-roll Wan Model Mount And Source Install Plan

## Status

Decision: `ai_video_broll_wan_model_mount_source_install_plan_ready_no_inference`

This packet defines the future Wan/Wan2.1 runtime mount and source-install review boundary. It does not copy model weights, install dependencies, import modules, run inference, create generated video, start Docker, create a VM, mutate GCP, dispatch workers, call providers, touch Supabase, run SQL, upload storage, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, or claim runtime readiness.

## Source Evidence

- Model: `Wan-AI/Wan2.1-T2V-1.3B`
- Source revision: `37ec512624d61f7aa208f7ea8140a131f93afc9a`
- Controlled evidence: `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- Registry evidence: `docs/ai-video-broll-generation-model-weight-evidence-alignment.md`
- Worker source envelope: `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`
- Dependency pin file: `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

## Mount Path Plan

Canonical future production-style mount path:

```text
/opt/reeditpro/model-weights/ai-video-broll/wan2.1-t2v-1.3b/
```

Controlled proof runner cache prefix:

```text
/tmp/reeditpro-private-model-cache/
```

The current runner is intentionally narrower than the production model-weight template. A future no-inference mount validator must either:

- validate a controlled copy from the approved private cache into `/tmp/reeditpro-private-model-cache/wan2.1-t2v-1.3b/`, or
- update the runner in a separately reviewed prompt to accept the canonical `/opt/reeditpro/model-weights/ai-video-broll/wan2.1-t2v-1.3b/` mount.

No copy, mount, symlink, upload, VM transfer, or cache mutation occurs in this packet.

## Source Install Review Plan

The future Wan runtime source-install review is limited to the existing controlled dependency file:

- `torch==2.12.1`
- `torchvision==0.27.1`
- `diffusers==0.38.0`
- `transformers==5.12.1`
- `accelerate==1.14.0`
- `safetensors==0.8.0`
- `huggingface-hub==1.21.0`
- `sentencepiece==0.2.1`
- `protobuf==7.35.1`
- `einops==0.8.2`
- `numpy==2.5.0`
- `pillow==12.2.0`

No dependency is installed now. Future install review must verify Python/CUDA compatibility, offline wheelhouse provenance, no runtime internet access, no source builds on the proof VM, no model auto-download, and no secrets.

## Runtime Gates

- modelWeightsCopiedNow: false
- modelMountCreatedNow: false
- dependencyInstalledNow: false
- sourceRepositoryClonedNow: false
- modelImportsRun: false
- modelInferenceRun: false
- generatedVideoCreated: false
- generatedAssetsCreated: false
- vmCreated: false
- dockerRun: false
- gcpMutationCreated: false
- providerCallsMade: false
- workersDispatched: false
- supabaseTouched: false
- sqlExecuted: false
- storageUploaded: false
- signedUrlsCreated: false
- publicArtifactsCreated: false
- creditMutationCreated: false
- betaUnlocked: false
- productionUnlocked: false

## Remaining Blockers

- `GPUS_ALL_REGIONS` quota is still 0 and blocks L4 VM creation.
- The proof runner accepts only the private proof cache prefix until a later reviewed mount validator or runner update.
- The Wan cache is original Wan runtime-essential layout; execution still needs approved adapter/runtime layout validation.
- Dependency source install has not been executed on a GPU VM and remains owner-review-only.
- No approved worker payload, private artifact manifest, QA evidence, cost evidence, or beta gate exists for generated B-roll.

## Next Prompt

`AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-4: author no-inference Wan mount validator, no model import`
