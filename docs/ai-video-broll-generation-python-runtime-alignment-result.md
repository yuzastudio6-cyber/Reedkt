# AI Video B-roll Generation Python Runtime Alignment Result

Decision: `ai_video_broll_gen_9j_python_runtime_alignment_complete_python312_wheelhouse_ready_for_vm_create_plan_recheck`

AI-VIDEO-BROLL-GEN-9J-PYTHON-RUNTIME-ALIGNMENT resolved the Python ABI mismatch found by the VM create plan. The inspected Google Deep Learning VM image candidates report Python 3.12, so this gate built a new private Python 3.12 / `cp312` Linux x86_64 binary wheelhouse outside the repository while preserving the previous Python 3.13 / `cp313` wheelhouse unchanged.

The new wheelhouse is complete for the committed AI B-roll proof requirements plus the explicit Torch/CUDA Linux runtime dependency set. An offline `--no-index --find-links` resolver-copy from the private wheelhouse passed with 66 wheels. This aligns the dependency bundle to the inspected Python 3.12 GCP image families and allows the next gate to re-plan controlled no-public-IP VM creation.

This gate did not create a VM, disk, network, service account, service account key, firewall rule, router, Cloud NAT, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, quota request, IAP transfer, SSH session, virtual environment, dependency install on a VM, model download, model import, inference run, generated frame, generated video, media file, Supabase row, SQL mutation, provider call, worker dispatch, signed URL, public artifact, credit row, beta unlock, production unlock, runtime-readiness claim, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `docs/ai-video-broll-generation-gcp-private-vm-create-plan.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-change-log.md`
- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-python-runtime-alignment.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md`
- `docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md`
- `docs/ai-video-broll-generation-python-cuda-compatibility-plan.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Runtime Alignment

| Area | Result |
| --- | --- |
| Selected alignment route | Build Python 3.12 private binary wheelhouse for inspected GCP image runtime |
| Inspected image Python | `3.12` |
| New wheelhouse Python | `3.12` |
| New wheelhouse ABI | `cp312` |
| Previous wheelhouse Python | `3.13` |
| Previous wheelhouse status | preserved and unmodified |
| VM create execution ready | no |
| VM create plan recheck ready | yes |

## Private Wheelhouse Output

| Area | Result |
| --- | --- |
| Private wheelhouse root | `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps` |
| Target wheelhouse | `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64` |
| Checksum manifest | `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json` |
| Requirements source | `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt` |
| Target Python | `cp312` / Python 3.12 |
| Target runtime | Linux x86_64 L4 GPU VM using inspected Deep Learning VM Python 3.12 image families |
| Real wheel count | `66` |
| Aggregate bytes | `2802483442` |
| Aggregate SHA-256 | `55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64` |
| Direct requirement download | passed |
| Linux GPU runtime dependency resolution | passed |
| CUDA Toolkit Linux extras | explicitly bundled |
| Offline no-index resolver-copy | passed |
| Source builds | not allowed, not used |
| AppleDouble sidecars | absent |
| Ready for VM create plan recheck | yes |
| VM creation allowed now | no |

## Runtime Dependencies Resolved

- `cuda-toolkit[cudart,cufft,cufile,cupti,curand,cusolver,cusparse,nvjitlink,nvrtc,nvtx]==13.0.2`
- `nvidia-cublas==13.1.0.3.*`
- `cuda-bindings==13.3.1`
- `cuda-pathfinder==1.5.5`
- `nvidia-cudnn-cu13==9.20.0.48`
- `nvidia-cusparselt-cu13==0.8.1`
- `nvidia-nccl-cu13==2.29.7`
- `nvidia-nvshmem-cu13==3.4.5`
- `triton==3.7.1`
- `nvidia-cuda-runtime==13.0.96.*`
- `nvidia-cufft==12.0.0.61.*`
- `nvidia-cufile==1.15.1.6.*`
- `nvidia-cuda-cupti==13.0.85.*`
- `nvidia-curand==10.4.0.35.*`
- `nvidia-cusolver==12.0.4.66.*`
- `nvidia-cusparse==12.6.3.3.*`
- `nvidia-nvjitlink==13.0.88.*`
- `nvidia-cuda-nvrtc==13.0.88.*`
- `nvidia-nvtx==13.0.85.*`

## Result

```json ai-video-broll-gen-9j-python-runtime-alignment-result
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-PYTHON-RUNTIME-ALIGNMENT",
  "decision": "ai_video_broll_gen_9j_python_runtime_alignment_complete_python312_wheelhouse_ready_for_vm_create_plan_recheck",
  "sourceBranch": "codex/ai-video-broll-gen-9j-vm-create-plan",
  "sourceCommit": "58c1ee0",
  "selectedAlignmentRoute": "build_python312_private_binary_wheelhouse_for_inspected_gcp_image_runtime",
  "inspectedImageRuntime": {
    "pythonVersion": "3.12",
    "imageFamilies": [
      "common-cu129-ubuntu-2404-nvidia-580",
      "pytorch-2-9-cu129-ubuntu-2404-nvidia-580"
    ]
  },
  "targetWheelhouse": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64",
  "checksumManifest": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json",
  "requirementsManifest": "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "previousWheelhouse": {
    "path": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64",
    "pythonVersion": "3.13",
    "abi": "cp313",
    "preserved": true
  },
  "target": {
    "pythonVersion": "3.12",
    "implementation": "cp",
    "abi": "cp312",
    "platforms": [
      "manylinux_2_28_x86_64",
      "manylinux_2_27_x86_64",
      "manylinux_2_25_x86_64",
      "manylinux_2_24_x86_64",
      "manylinux_2_18_x86_64",
      "manylinux_2_17_x86_64",
      "manylinux_2_12_x86_64",
      "manylinux_2_5_x86_64",
      "manylinux2014_x86_64",
      "manylinux2010_x86_64",
      "manylinux1_x86_64"
    ],
    "intendedRuntime": "linux_x86_64_l4_gpu_vm_deep_learning_python312"
  },
  "wheelhouseManifest": {
    "realWheelCount": 66,
    "aggregateBytes": 2802483442,
    "aggregateSha256": "55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64",
    "appleDoubleSidecarsExcluded": true
  },
  "dependencyStatus": {
    "directRequirementsWheelDownloadPassed": true,
    "linuxRuntimeDependencyResolutionPassed": true,
    "cudaToolkitLinuxExtrasExplicitlyBundled": true,
    "offlineNoIndexResolverCopyPassed": true,
    "offlineResolvedWheelCount": 66,
    "sourceBuildsUsed": false,
    "wheelhouseComplete": true,
    "wheelhouseReadyForVmCreatePlanRecheck": true,
    "vmCreateAllowedNow": false,
    "nextGateRequiresVmCreatePlanRecheck": true
  },
  "runtimeFlags": {
    "vmCreated": false,
    "gcpMutated": false,
    "iapTransferExecuted": false,
    "dependencyInstalledOnVm": false,
    "sourceRepositoryCloned": false,
    "modelDownloaded": false,
    "modelImported": false,
    "pipelineInstantiated": false,
    "modelFromPretrainedCalled": false,
    "torchLoadCalled": false,
    "modelInferenceRun": false,
    "generatedFramesCreated": false,
    "generatedVideoCreated": false,
    "mediaProcessingRun": false,
    "ffmpegRun": false,
    "providerCalled": false,
    "workerDispatched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "storageUploaded": false,
    "signedUrlsCreated": false,
    "publicArtifactsCreated": false,
    "creditMutationCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "runtimeReadinessClaimed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN-2: re-plan controlled no-public-IP L4 proof VM creation with aligned Python runtime, no inference"
}
```

## No-Scope Statement

No VM is created. No disk is created. No network is created or changed. No Cloud NAT or router is created. No service account, service account key, firewall rule, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request is created. No IAP transfer is run. No SSH command is run. No dependency is installed on a VM. No source repository is cloned. No virtual environment is created. No model weight is downloaded. No model import is attempted. No pipeline is instantiated. No `from_pretrained` call is made. No `torch.load` is called. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No model proof execution flag is passed. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN-2: re-plan controlled no-public-IP L4 proof VM creation with aligned Python runtime, no inference`
