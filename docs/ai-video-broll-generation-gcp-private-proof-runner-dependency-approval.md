# AI Video B-roll Generation GCP Private Proof Runner Dependency Approval

Decision: `ai_video_broll_gen_9j_runtime_setup_private_runner_dependency_path_approved_ready_for_runner_authoring`

AI-VIDEO-BROLL-GEN-9J-RUNTIME-SETUP approves a concrete future runner path and dependency setup boundary for the private Wan 1.3B L4 tabletop proof. This gate is approval/planning only. It does not create the runner file, create a VM, install dependencies, transfer the model cache, import the model, instantiate a pipeline, run inference, generate frames, generate video, encode media, mutate Google Cloud, touch Supabase, call providers, dispatch workers, or claim `dry_run_passed` or `generated_local_fixture_passed`.

The direct 9J-RETRY-2 execution gate remains blocked until the approved committed runner file exists and passes a no-VM/no-inference static validation gate.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-runtime-setup.md`
- `docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-result.md`
- `docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md`
- `docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md`
- `docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md`
- `docs/ai-video-broll-generation-controlled-dependency-install-result.md`
- `docs/ai-video-broll-generation-controlled-model-loader-import-result.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `product-plan.md`
- `intent-led-edit-planning.md`
- `model-routing-policy.md`
- `open-source-tool-registry.md`
- `render-strategy-planner.md`
- `docs/activation-gcp-staging-command-policy.md`

## External Runtime Notes

- Hugging Face Diffusers documents `WanPipeline` text-to-video usage for `Wan-AI/Wan2.1-T2V-1.3B-Diffusers` and states the small T2V example requires about 11 GB VRAM. Source: https://huggingface.co/docs/diffusers/v0.33.1/api/pipelines/wan
- The Wan model card says the T2V 1.3B lane supports 480P and recommends 480P over 720P for stability; it also documents single-GPU options such as `--offload_model True` and `--t5_cpu` for memory pressure. Source: https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B-Diffusers
- ReEditPro does not approve the official examples as-is. The future runner must remain offline-only, use the private approved cache, avoid prompt extension APIs, avoid public downloads, avoid `export_to_video` unless a later Track B/Track A gate accepts media encoding, and delete all temporary output before VM cleanup.

## Approved Runner Path

| Field | Decision |
| --- | --- |
| Runner mode | future committed script path |
| Approved future path | `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py` |
| Runner file created now | no |
| Temporary VM ad hoc script | rejected |
| Prebuilt private image path | rejected |
| Direct 9J-RETRY-2 allowed now | no |
| Next required gate | add the fail-closed runner file with static validation only |

The runner must be committed before execution so review and diagnostics can verify command-line arguments, offline mode, cache layout assumptions, output cleanup, evidence redaction, timeout behavior, and no secret/public URL paths before any VM is created.

## Dependency Setup Boundary

The future VM proof may install dependencies only after the next no-VM runner-authoring gate and a later execution preflight repeat the owner boundary. The approved future dependency source is:

```text
server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt
```

Future dependency setup rules:

- create a VM-local virtual environment under `/tmp/reeditpro-ai-video-broll-proof-venv`;
- install only the exact approved manifest file copied from the repository;
- do not install model source repositories;
- do not clone Wan, LTX, Mochi, Hunyuan, ComfyUI, or provider repositories;
- do not install prompt-extension API clients beyond the already approved manifest;
- do not install FFmpeg, ffprobe, imageio-ffmpeg, OpenCV, xFormers, FlashAttention, Triton, or CUDA packages unless a later owner gate explicitly adds them;
- delete the VM-local virtual environment before VM deletion;
- capture only sanitized package/version evidence.

This approval does not run `pip`, create a venv, or prove the VM dependency install today.

## Offline Cache Boundary

The future runner must use only the private cache for:

```text
Wan-AI/Wan2.1-T2V-1.3B
revision 37ec512624d61f7aa208f7ea8140a131f93afc9a
```

Required environment:

```text
HF_HUB_OFFLINE=1
TRANSFORMERS_OFFLINE=1
DIFFUSERS_OFFLINE=1
HF_HOME=/tmp/reeditpro-private-hf-home
```

The current private cache is the original approved Wan 1.3B runtime-essential file set. It is not yet proven to be a Diffusers-format `Wan-AI/Wan2.1-T2V-1.3B-Diffusers` cache. Therefore the runner-authoring gate must choose and validate one of these approaches before execution:

1. a committed wrapper that uses the original approved cache layout without cloning source repositories; or
2. a separate future approved cache-conversion/download gate for Diffusers-format weights.

No runtime network model fetch is approved.

## Cache Aggregate Reconciliation

9J-RETRY verified every manifest-listed file size and SHA-256. The sum of the 10 listed file sizes is:

```text
17567083322
```

The historical aggregate field in the Gate 6 manifest says:

```text
17567424122
```

For future transfer-cost evidence, use the per-file verified total `17567083322` unless a later manifest-correction gate updates the historical aggregate. A future execution gate must still verify every file and checksum immediately before transfer.

## Future Runner Contract

The future runner file must be fail-closed and must require explicit arguments:

```text
python3 server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py \
  --offline-model-cache /tmp/reeditpro-private-model-cache/wan-1-3b \
  --fixture non-user-media-tabletop \
  --max-runtime-minutes 60 \
  --output-dir /tmp/reeditpro-private-proof-output \
  --evidence-json /tmp/reeditpro-private-proof-output/sanitized-proof-evidence.json
```

The runner must reject:

- missing offline environment flags;
- model cache paths outside `/tmp/reeditpro-private-model-cache`;
- output paths outside `/tmp/reeditpro-private-proof-output`;
- network model fetch;
- public URLs;
- signed URL markers;
- provider credentials;
- service account key files;
- raw chat prompts as execution payload;
- user media paths;
- any fixture other than `non-user-media-tabletop`;
- any model ID or revision other than the approved Wan 1.3B revision.

## Evidence Capture

Future sanitized evidence may include:

- runner version;
- dependency versions;
- GPU model and memory summary;
- offline mode flags;
- model revision and cache checksum summary;
- fixture ID;
- planned prompt and negative prompt IDs or text from the approved Gate 8 fixture only;
- start/end timestamps;
- runtime duration;
- whether temporary frames were created;
- whether temporary outputs were deleted;
- VM cleanup verification;
- cost duration estimate.

Future evidence must not include:

- service account email values;
- access tokens;
- raw credentials;
- provider keys;
- signed URLs;
- public URLs;
- user media;
- generated media payloads committed to git;
- storage object paths created by the proof;
- product project IDs beyond `reeditpro`.

## Still Blocked

- Creating or running a VM.
- Creating disks, networks, service accounts, keys, firewall rules, buckets, Artifact Registry images, reservations, Cloud Run jobs, or quota requests.
- Installing dependencies.
- Importing model modules.
- Calling `from_pretrained`.
- Loading weights through PyTorch or Diffusers.
- Text encoding, denoising, scheduler steps, VAE decode, or inference.
- Creating generated frames or generated video.
- Encoding media or running FFmpeg.
- Uploading storage objects.
- Creating signed URLs or public artifacts.
- Calling providers.
- Dispatching workers.
- Touching Supabase or SQL.
- Creating credit estimates, approvals, reservations, spends, refunds, or releases.
- Claiming beta readiness, production readiness, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.

## Result

```json ai-video-broll-gen-9j-runtime-setup-private-runner-dependency-approval
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-RUNTIME-SETUP",
  "decision": "ai_video_broll_gen_9j_runtime_setup_private_runner_dependency_path_approved_ready_for_runner_authoring",
  "sourceBranch": "codex/ai-video-broll-gen-9j-retry-controlled-l4-private-proof",
  "sourceCommit": "0786355a",
  "runnerApproval": {
    "runnerPathApproved": true,
    "runnerMode": "future_committed_script_path",
    "approvedFutureRunnerPath": "server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py",
    "runnerFileCreatedNow": false,
    "approvedRunnerPathExistsNow": false,
    "temporaryVmAdHocScriptApproved": false,
    "prebuiltPrivateImagePathApproved": false,
    "directRetry2AllowedNow": false,
    "runnerAuthoringGateRequired": true
  },
  "dependencyApproval": {
    "futureVmLocalDependencyInstallMayUseApprovedManifest": true,
    "requirementsManifest": "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
    "vmLocalVenvPath": "/tmp/reeditpro-ai-video-broll-proof-venv",
    "dependencyInstallRunNow": false,
    "sourceRepoCloneAllowed": false,
    "ffmpegInstallAllowed": false,
    "xformersInstallAllowed": false,
    "flashAttentionInstallAllowed": false,
    "tritonInstallAllowed": false
  },
  "cacheApproval": {
    "modelId": "Wan-AI/Wan2.1-T2V-1.3B",
    "modelRevision": "37ec512624d61f7aa208f7ea8140a131f93afc9a",
    "offlineCacheOnly": true,
    "runtimeNetworkModelFetchAllowed": false,
    "diffusersFormatCacheProven": false,
    "originalWanCacheLayoutApproved": true,
    "cacheLayoutMustBeHandledByRunnerAuthoringGate": true,
    "manifestListedFileTotalBytes": 17567083322,
    "historicalAggregateBytes": 17567424122,
    "futureTransferCostBytes": 17567083322
  },
  "fixtureBoundary": {
    "fixture": "non-user-media-tabletop",
    "userMediaAllowed": false,
    "rawChatUsedAsExecutionPlan": false,
    "promptExtensionApiAllowed": false,
    "publicUrlAllowed": false,
    "signedUrlAllowed": false
  },
  "runtimeFlags": {
    "vmCreated": false,
    "diskCreated": false,
    "networkCreated": false,
    "serviceAccountCreated": false,
    "firewallRuleCreated": false,
    "gcpMutatingCommandsExecuted": false,
    "dependencyInstallAllowedNow": false,
    "dependencyInstallRun": false,
    "modelImportAllowedNow": false,
    "modelImportRun": false,
    "pipelineInstantiationAllowedNow": false,
    "pipelineInstantiated": false,
    "modelFromPretrainedAllowedNow": false,
    "modelFromPretrainedCalled": false,
    "torchLoadAllowedNow": false,
    "torchLoadCalled": false,
    "textEncodingAllowedNow": false,
    "textEncodingRun": false,
    "denoisingStepAllowedNow": false,
    "denoisingStepRun": false,
    "schedulerRunAllowedNow": false,
    "schedulerRun": false,
    "vaeEncodeDecodeAllowedNow": false,
    "vaeEncodeDecodeRun": false,
    "modelInferenceAllowedNow": false,
    "modelInferenceRun": false,
    "generatedFramesAllowedNow": false,
    "generatedFramesCreated": false,
    "generatedVideoAllowedNow": false,
    "generatedVideoCreated": false,
    "mediaProcessingAllowed": false,
    "ffmpegAllowed": false,
    "providerCallsAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlAllowed": false,
    "storageUploadAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "creditMutationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-RUNNER-AUTHOR: add fail-closed private L4 proof runner, no VM/no inference"
}
```

## No-Scope Statement

No dependency is installed. No virtual environment is created. No model weights are downloaded. No model import is attempted. No runner file is created. No pipeline is instantiated. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No Docker container is built or started. No VM, disk, network, service account, firewall rule, bucket, Artifact Registry image, reservation, Cloud Run job, or quota request is created. No additional Google Cloud API is enabled. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-RUNNER-AUTHOR: add fail-closed private L4 proof runner, no VM/no inference`
