# AI Video B-roll Generation GCP Private Wheelhouse Fix Result

Decision: `ai_video_broll_gen_9j_wheelhouse_fix_complete_private_binary_wheelhouse_ready_for_iap_transfer_preflight`

AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-FIX resolved the prior Torch Linux GPU runtime wheel blocker. The private Python 3.13 Linux x86_64 wheelhouse now contains the direct ReeditPro AI B-roll worker dependencies plus the explicit Torch/CUDA Linux runtime wheels needed for the cost-friendly L4 proof VM path.

The fix was not a model install and did not create a runtime environment. It only downloaded binary wheel artifacts into the approved private cache outside the repository, regenerated the checksum manifest, and validated that an offline no-index resolver-copy can satisfy the direct requirements plus explicit Linux GPU runtime requirements from that wheelhouse.

The wheelhouse is ready for the next IAP transfer-readiness preflight. VM creation remains blocked until the next preflight verifies transfer commands and install instructions. This result does not claim beta, production, runtime execution, `dry_run_passed`, or `generated_local_fixture_passed`.

## Source Evidence

- `docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-result.md`
- `docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-change-log.md`
- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-wheelhouse-fix.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-3-result.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64/SHA256SUMS.json`

## Fix Summary

| Area | Result |
| --- | --- |
| Wheelhouse path | `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64` |
| Checksum manifest | `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64/SHA256SUMS.json` |
| Target Python | `cp313` / Python 3.13 |
| Target runtime | Linux x86_64 L4 GPU VM |
| Real wheel count | `66` |
| Aggregate bytes | `2802293613` |
| Aggregate SHA-256 | `366835269639cd0d7bd24fcb876d39f94bca2bb9c4772735a16fa2458dfbfc11` |
| Direct requirements | resolved |
| Torch Linux GPU runtime dependencies | resolved |
| CUDA Toolkit Linux extras | explicitly bundled |
| Offline no-index resolver-copy | passed |
| Source builds | not allowed, not used |
| Wheelhouse complete | yes |
| Ready for IAP transfer preflight | yes |
| VM creation allowed now | no |

## Why The Previous Download Failed

The previous wheelhouse attempt targeted only `manylinux_2_28_x86_64` and `manylinux2014_x86_64`. Several NVIDIA runtime wheels required by Torch and CUDA Toolkit use older Linux compatibility tags, including `manylinux_2_27`, `manylinux_2_25`, `manylinux_2_24`, `manylinux_2_18`, `manylinux_2_17`, `manylinux_2_12`, `manylinux_2_5`, `manylinux2010`, and `manylinux1`.

The fix expanded the accepted target tags for binary wheel download and explicitly bundled the CUDA Toolkit Linux extras that pip does not pull automatically when resolving Linux-only marker dependencies from macOS.

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

## Transfer-Readiness Boundary

The wheelhouse is complete as a local artifact, but it is not yet an executed VM dependency install. The next gate must verify:

- IAP transfer command shape;
- exact remote target path;
- checksum copy command;
- no-public-IP VM assumptions;
- no runtime internet install;
- install commands that use only the transferred wheelhouse;
- cleanup and failure handling;
- continued no-inference/no-model-import/no-media-generation boundaries.

## Result

```json ai-video-broll-gen-9j-wheelhouse-fix-result
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-FIX",
  "decision": "ai_video_broll_gen_9j_wheelhouse_fix_complete_private_binary_wheelhouse_ready_for_iap_transfer_preflight",
  "sourceBranch": "codex/ai-video-broll-gen-9j-wheelhouse-prep",
  "sourceCommit": "12aafd2",
  "targetWheelhouse": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64",
  "checksumManifest": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64/SHA256SUMS.json",
  "requirementsManifest": "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "target": {
    "pythonVersion": "3.13",
    "implementation": "cp",
    "abi": "cp313",
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
    "intendedRuntime": "linux_x86_64_l4_gpu_vm"
  },
  "wheelhouseManifest": {
    "realWheelCount": 66,
    "aggregateBytes": 2802293613,
    "aggregateSha256": "366835269639cd0d7bd24fcb876d39f94bca2bb9c4772735a16fa2458dfbfc11",
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
    "wheelhouseReadyForIapTransferPreflight": true,
    "vmCreateAllowedNext": false,
    "nextGateRequiresIapTransferPreflight": true
  },
  "prunedSupersededWheels": [
    "nvidia_cublas-13.1.1.3-py3-none-manylinux_2_27_x86_64.whl",
    "nvidia_cuda_nvrtc-13.3.33-py3-none-manylinux2010_x86_64.manylinux_2_12_x86_64.whl"
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
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-4: verify IAP wheelhouse transfer readiness, no VM/no inference"
}
```

## No-Scope Statement

No VM is created. No disk is created. No network is created or changed. No Cloud NAT or router is created. No service account, service account key, firewall rule, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request is created. No dependency is installed on a VM. No source repository is cloned. No virtual environment is created. No model weight is downloaded. No model import is attempted. No pipeline is instantiated. No `from_pretrained` call is made. No `torch.load` is called. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No model proof execution flag is passed. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-4: verify IAP wheelhouse transfer readiness, no VM/no inference`
