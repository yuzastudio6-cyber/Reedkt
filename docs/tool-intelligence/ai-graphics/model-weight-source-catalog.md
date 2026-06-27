# AI Graphics Model-Weight Source Catalog

Decision: `ai_graphics_model_weight_source_catalog_prepared_with_review_blocks`

Status: prepared with review blocks.

This catalog narrows the GPU/model-weight path for the 8 heavy AI graphics tools without downloading weights, loading models, running GPU runtime, or approving beta/production execution.

## Scope

- Total AI graphics tools: 21.
- GPU-runtime targeted tools: 8.
- Foundation GPU tools without standalone model-weight manifests: `torch_torchvision`, `transformers`, `kornia`.
- Model-weight source catalog tools: `sam2`, `birefnet`, `real_esrgan`, `rembg`, `transparent_background`.
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
| `sam2` | `facebook_sam2_1_hiera_tiny_existing_staging_evidence` | internal evidence verified; private manifest still required | `server/activation/sam2-runtime/sam2-runtime-policy.ts`, `server/activation/sam2-runtime/approved-sam2-runtime-evidence.ts` | Convert existing SAM2.1 tiny evidence into a reviewed private manifest using an accepted private namespace, then run native L4 proof. |
| `birefnet` | `zhengpeng7_birefnet_official_weights_review_candidate` | source identified; review required | none | Select exact checkpoint, review license/provenance/quality/security, checksum it, create private manifest, then run native L4 proof. |
| `real_esrgan` | `xinntao_real_esrgan_x4plus` | internal evidence verified; private manifest still required | `server/activation/enhancement-model-approval/enhancement-model-candidate-registry.ts`, `server/activation/enhancement-model-approval/enhancement-model-license-evidence.ts` | Create reviewed private RealESRGAN_x4plus manifest with checksum and review evidence, then run native L4 proof. |
| `rembg` | `danielgatis_rembg_model_menu_selection_required` | model menu identified; selection required | none | Choose one rembg model/cache option, review license/provenance and cutout quality, checksum private artifact tree, create private manifest, then run native L4 proof. |
| `transparent_background` | `plemeri_transparent_background_inspyrenet_review_candidate` | source identified; review required | none | Select exact transparent-background/InSPyReNet checkpoint, review license/provenance/quality/security, checksum private artifact tree, create private manifest, then run native L4 proof. |

## Source URLs

- SAM2 source: `https://github.com/facebookresearch/sam2`.
- BiRefNet weights source candidate: `https://huggingface.co/ZhengPeng7/BiRefNet`.
- BiRefNet code source candidate: `https://github.com/ZhengPeng7/BiRefNet`.
- Real-ESRGAN source: `https://github.com/xinntao/Real-ESRGAN`.
- RealESRGAN_x4plus release asset candidate: `https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth`.
- rembg source/model menu candidate: `https://github.com/danielgatis/rembg`.
- transparent-background source candidate: `https://github.com/plemeri/transparent-background`.
- InSPyReNet source candidate: `https://github.com/plemeri/InSPyReNet`.

## Review Blocks

- Reviewed private model/checkpoint manifest refs are still missing for all five model-weight tools.
- Private artifact refs must use `private://`, `reeditpro-private://`, or `reeditpro-private-artifact-ref-`; public, signed, HTTP(S), raw `gs://`, and arbitrary placeholder refs remain rejected as manifest inputs.
- SAM2 existing `gs://` staging evidence is recorded only as internal source evidence, not an accepted manifest `privateArtifactRef`.
- Exact checksum, source/license evidence, model-card/provenance evidence, commercial-use review, redistribution review, quality review, security review, and owner beta approval remain required.
- Native linux/amd64 NVIDIA L4 proof remains required before any model load or inference.

## Booleans

- `modelWeightSourceCatalogPrepared`: true.
- `all8GpuRuntimeToolsCovered`: true.
- `all5ModelWeightSourceToolsCovered`: true.
- `sourceCandidatesIdentifiedForAll5ModelWeightTools`: true.
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
