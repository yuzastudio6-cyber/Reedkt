# AI Video B-roll Generation GCP Private Wheelhouse Prep Result

Decision: `ai_video_broll_gen_9j_wheelhouse_prep_blocked_missing_linux_gpu_runtime_wheels`

AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-PREP built a local Python 3.13 Linux x86_64 wheelhouse from the committed ReeditPro AI B-roll worker requirements manifest and wrote a checksum manifest in the approved private cache path outside the repository. The direct requirement wheel download succeeded, but the wheelhouse is not ready for IAP transfer because the selected `torch==2.12.1` Linux wheel declares additional Linux GPU runtime requirements that did not resolve from the attempted package indexes.

This is the right kind of failure to catch before VM creation. It means the dependency bundle is not yet sufficient for a no-public-IP L4 proof VM, even though the direct application requirements downloaded successfully.

This gate did not create a VM, disk, network, service account, service account key, firewall rule, static address, reservation, image, bucket, router, Cloud NAT, Artifact Registry image, Cloud Run job, quota request, virtual environment, model download, model import, inference run, generated frame, generated video, media file, Supabase row, SQL mutation, provider call, worker dispatch, signed URL, public artifact, credit row, beta unlock, production unlock, runtime-readiness claim, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-wheelhouse-prep.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-3-result.md`
- `docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

## Private Wheelhouse Output

| Area | Result |
| --- | --- |
| Private wheelhouse root | `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps` |
| Target wheelhouse | `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64` |
| Checksum manifest | `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64/SHA256SUMS.json` |
| Requirements source | `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt` |
| Target Python | `cp313` / Python 3.13 |
| Target platforms | `manylinux_2_28_x86_64`, `manylinux2014_x86_64` |
| Real wheel count | `47` |
| Aggregate bytes | `606414976` |
| Aggregate SHA-256 | `655519c2a7e281ac4c2b50bf8f0117f4bf9c83132fdb626a80a1dffe70f96ce3` |
| Direct requirement download | passed |
| Linux GPU runtime dependency resolution | blocked |
| Ready for IAP transfer | no |
| VM creation allowed next | no |

The checksum manifest excludes macOS AppleDouble sidecar files and records only real `.whl` artifacts.

## Direct Requirements Covered

The private wheelhouse includes direct requirement wheels for:

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

## Blocked Linux GPU Runtime Dependencies

The downloaded Linux `torch==2.12.1` wheel metadata declares these Linux-only runtime requirements:

- `cuda-toolkit[cudart,cufft,cufile,cupti,curand,cusolver,cusparse,nvjitlink,nvrtc,nvtx]==13.0.2`
- `nvidia-cublas<=13.1.1.3,>=13.1.0.3`
- `cuda-bindings<14,>=13.0.3`
- `nvidia-cudnn-cu13==9.20.0.48`
- `nvidia-cusparselt-cu13==0.8.1`
- `nvidia-nccl-cu13==2.29.7`
- `nvidia-nvshmem-cu13==3.4.5`
- `triton==3.7.1`

The explicit runtime-dependency download attempt failed first on:

```text
No matching distribution found for nvidia-cublas<=13.1.1.3,>=13.1.0.3
```

Additional cp311 and cp312 torch metadata probes showed the same Linux GPU runtime dependency set, so changing only the target Python minor version does not remove this blocker.

## Safety Classification

| Area | Status |
| --- | --- |
| Wheelhouse path | private local cache outside repository |
| Source repository clones | rejected |
| Model weight downloads | not performed |
| Runtime dependency install on VM | not performed |
| VM creation | blocked |
| Runtime internet install | rejected |
| IAP transfer readiness | blocked |
| Generated video readiness | blocked |
| Beta readiness | blocked |
| Production readiness | blocked |

## Result

```json ai-video-broll-gen-9j-wheelhouse-prep-result
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-PREP",
  "decision": "ai_video_broll_gen_9j_wheelhouse_prep_blocked_missing_linux_gpu_runtime_wheels",
  "sourceBranch": "codex/ai-video-broll-gen-9j-vm-preflight-3",
  "sourceCommit": "b95beff",
  "targetWheelhouse": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64",
  "checksumManifest": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64/SHA256SUMS.json",
  "requirementsManifest": "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "target": {
    "pythonVersion": "3.13",
    "implementation": "cp",
    "abi": "cp313",
    "platforms": [
      "manylinux_2_28_x86_64",
      "manylinux2014_x86_64"
    ],
    "intendedRuntime": "linux_x86_64_l4_gpu_vm"
  },
  "wheelhouseManifest": {
    "realWheelCount": 47,
    "aggregateBytes": 606414976,
    "aggregateSha256": "655519c2a7e281ac4c2b50bf8f0117f4bf9c83132fdb626a80a1dffe70f96ce3",
    "appleDoubleSidecarsExcluded": true
  },
  "dependencyStatus": {
    "directRequirementsWheelDownloadPassed": true,
    "linuxRuntimeDependencyResolutionPassed": false,
    "wheelhouseComplete": false,
    "wheelhouseReadyForIapTransfer": false,
    "vmCreateAllowedNext": false,
    "firstResolutionFailure": "No matching distribution found for nvidia-cublas<=13.1.1.3,>=13.1.0.3",
    "python311MetadataMatchedTorchLinuxRuntimeDependencies": true,
    "python312MetadataMatchedTorchLinuxRuntimeDependencies": true
  },
  "unresolvedTorchLinuxRuntimeDependencies": [
    "cuda-toolkit[cudart,cufft,cufile,cupti,curand,cusolver,cusparse,nvjitlink,nvrtc,nvtx]==13.0.2",
    "nvidia-cublas<=13.1.1.3,>=13.1.0.3",
    "cuda-bindings<14,>=13.0.3",
    "nvidia-cudnn-cu13==9.20.0.48",
    "nvidia-cusparselt-cu13==0.8.1",
    "nvidia-nccl-cu13==2.29.7",
    "nvidia-nvshmem-cu13==3.4.5",
    "triton==3.7.1"
  ],
  "runtimeFlags": {
    "vmCreated": false,
    "gcpMutated": false,
    "dependencyInstalledOnVm": false,
    "sourceRepositoryCloned": false,
    "modelDownloaded": false,
    "modelImported": false,
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
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-FIX: resolve Torch Linux GPU runtime wheel source, no VM/no inference"
}
```

## No-Scope Statement

No VM is created. No disk is created. No network is created or changed. No Cloud NAT or router is created. No service account, service account key, firewall rule, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request is created. No dependency is installed on a VM. No source repository is cloned. No virtual environment is created. No model weight is downloaded. No model import is attempted. No pipeline is instantiated. No `from_pretrained` call is made. No `torch.load` is called. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No model proof execution flag is passed. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-FIX: resolve Torch Linux GPU runtime wheel source, no VM/no inference`
