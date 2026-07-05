# AI Graphics Model-Weight Source Catalog

Decision: `ai_graphics_model_weight_source_catalog_prepared_with_review_blocks`

Status: prepared with review blocks.

This catalog narrows the GPU/model-weight path for the 8 heavy AI graphics tools without downloading weights, loading models, running GPU runtime, or approving beta/production execution.

## Scope

- Total AI graphics tools: 21.
- GPU-runtime targeted tools: 8.
- Foundation GPU tools without standalone model-weight manifests: `torch_torchvision`, `transformers`, `kornia`.
- Model-weight source catalog tools: `sam2`, `birefnet`, `real_esrgan`, `rembg`, `transparent_background`.
- Internal staging-evidence-backed model-weight candidates: 3 (`sam2`, `birefnet`, `real_esrgan`).
- Suggested private manifest SHA-256 values from existing internal evidence: 3.
- Private artifact SHA-256 still required from reviewed artifact bytes: 2 (`rembg`, `transparent_background`).
- Private manifests approved now: 0.
- Beta-ready model-weight tools: 0.

## GPU Runtime Policy

- `gpuRuntimeOnDemandOnly`: true.
- `noIdleGpuRuntimeApproved`: true.
- `startsOnlyForApprovedWorkerOrToolCall`: true.
- `cpuFallbackAllowedForHeavyTools`: false.

GPU capacity remains future worker-only and starts only for an approved proof command or approved Worker/Tool Route handoff. Idle GPU runtime is not approved.

## Source Candidates

| Tool | Candidate | Status | Existing Evidence | Next Action |
| --- | --- | --- | --- | --- |
| `sam2` | `facebook_sam2_1_hiera_tiny_existing_staging_evidence` | internal evidence verified; private manifest still required | `45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2` from `existing_internal_aggregate_sha256`; must match reviewed private artifact | Convert existing SAM2.1 tiny evidence into a reviewed private manifest using an accepted private namespace, then run native L4 proof. |
| `birefnet` | `zhengpeng7_birefnet_official_weights_review_candidate` | internal evidence verified; private manifest still required | `1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7` from `existing_internal_aggregate_sha256`; must match reviewed private artifact | Convert existing Phase 33 BiRefNet staging evidence into a reviewed private manifest using an accepted private namespace, then run native L4 proof. |
| `real_esrgan` | `xinntao_real_esrgan_x4plus` | internal evidence verified; private manifest still required | `4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1` from `existing_internal_file_sha256`; must match reviewed private artifact | Create reviewed private RealESRGAN_x4plus manifest with checksum and review evidence, then run native L4 proof. |
| `rembg` | `danielgatis_rembg_isnet_general_use_review_candidate` | source candidate selected; review required | `requires_private_artifact_sha256` | Review DIS/rembg `isnet-general-use.onnx` license/provenance and cutout quality, checksum private artifact tree, record `U2NET_HOME` cache layout, create private manifest, then run native L4 proof. |
| `transparent_background` | `plemeri_transparent_background_base_ckpt_review_candidate` | source candidate selected; review required | `requires_private_artifact_sha256`; upstream MD5 remains source evidence only | Review transparent-background/InSPyReNet `ckpt_base.pth` license/provenance/quality/security, verify upstream MD5 before private manifest approval, checksum private artifact tree, then run native L4 proof. |

## Source URLs

- SAM2 source: `https://github.com/facebookresearch/sam2`.
- BiRefNet weights source candidate: `https://huggingface.co/ZhengPeng7/BiRefNet`.
- BiRefNet code source candidate: `https://github.com/ZhengPeng7/BiRefNet`.
- Real-ESRGAN source: `https://github.com/xinntao/Real-ESRGAN`.
- RealESRGAN_x4plus release asset candidate: `https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth`.
- rembg selected source candidate: `https://github.com/danielgatis/rembg`.
- rembg selected model artifact candidate: `https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx`.
- rembg selected model source evidence: `https://github.com/xuebinqin/DIS`.
- transparent-background source candidate: `https://github.com/plemeri/transparent-background`.
- InSPyReNet source candidate: `https://github.com/plemeri/InSPyReNet`.
- transparent-background selected default base checkpoint candidate: `https://github.com/plemeri/transparent-background/releases/download/1.2.12/ckpt_base.pth`.
- transparent-background upstream config MD5 for `ckpt_base.pth`: `d692e3dd5fa1b9658949d452bebf1cda`.

## Review Blocks

- Reviewed private model/checkpoint manifest refs are still missing for all five model-weight tools.
- Private artifact refs must use `private://`, `reeditpro-private://`, or `reeditpro-private-artifact-ref-`; public, signed, HTTP(S), raw `gs://`, and arbitrary placeholder refs remain rejected as manifest inputs.
- SAM2 existing `gs://` staging evidence is recorded only as internal source evidence, not an accepted manifest `privateArtifactRef`.
- Exact private namespace refs, model-card/provenance refs, quality review, security review, and owner beta approval remain required. BiRefNet, SAM2, and Real-ESRGAN have staging checksum/source evidence that must still be converted into reviewed private manifest records.
- Suggested checksum values do not approve private manifests. Each value must match the reviewed private artifact tree or file before the manifest can pass validation; `rembg` and `transparent_background` still require a reviewed private artifact SHA-256.
- Native linux/amd64 NVIDIA L4 proof remains required before any model load or inference.

## Private Manifest Preparation Plan

The catalog now separates source readiness from runtime readiness:

- `sam2`, `birefnet`, and `real_esrgan` are `ready_for_private_manifest_authoring_from_existing_evidence`.
- `rembg` and `transparent_background` now have selected upstream checkpoint candidates, but remain `blocked_pending_source_selection_or_review` until private manifest source/license/checksum/provenance/quality/security review is complete.
- Local-only manifest paths must live under `.local-artifacts/ai-graphics/model-weight-manifests/.../model_tree_manifest.json`.
- The private manifest review command is `npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"`.
- The GPU proof command-plan command is `npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"`.
- Private manifest authoring does not approve model download, model load, inference, GPU runtime, Tool Route execution, Worker execution, beta, or production.

## Booleans

- `modelWeightSourceCatalogPrepared`: true.
- `all8GpuRuntimeToolsCovered`: true.
- `all5ModelWeightSourceToolsCovered`: true.
- `sourceCandidatesIdentifiedForAll5ModelWeightTools`: true.
- `privateManifestPreparationPlanPrepared`: true.
- `existingEvidenceCanAuthor3PrivateManifestDrafts`: true.
- `sourceSelectionStillBlocks2PrivateManifestDrafts`: false.
- `sourceReviewStillBlocks2PrivateManifestDrafts`: true.
- `existingEvidenceChecksumSuggestionsRecorded`: true.
- `privateArtifactSha256StillRequiredFor2`: true.
- `suggestedChecksumsDoNotApprovePrivateManifest`: true.
- `agentCanSelectForPlanning`: true.
- `agentCanExecuteToolsNow`: false.
- `routeExecutionApprovedNow`: false.
- `workerExecutionApprovedNow`: false.
- `toolExecutionApprovedNow`: false.
- `gpuRuntimeApprovedNow`: false.
- `modelWeightManifestsApprovedNow`: false.
- `modelWeightsDownloaded`: false.
- `modelWeightsLoaded`: false.
- `modelInferencePerformed`: false.
- `runtimeReadyNow`: false.
- `internalBetaReadyNow`: false.
- `externalBetaReadyNow`: false.
- `productionReadyNow`: false.
