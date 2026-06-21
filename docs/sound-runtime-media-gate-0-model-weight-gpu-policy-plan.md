# SOUND-RUNTIME-MEDIA-GATE-0 Model Weight And GPU Policy Plan

Model-weight, GPU, storage, checksum, cost, and provenance decisions remain owner-gated. This packet records policy requirements only.

```json sound-runtime-media-gate-0-model-weight-gpu-policy-plan
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-0",
  "decision": "sound_runtime_media_gate_0_completed_with_warnings_ready_for_cpu_worker_install_plan",
  "blockedModelWeightTools": [
    "basic_pitch",
    "deepfilternet",
    "demucs",
    "spleeter",
    "open_unmix",
    "asteroid",
    "speechbrain_enhancement",
    "whisper_cpp",
    "faster_whisper",
    "pyannote_audio",
    "crepe",
    "torchcrepe"
  ],
  "gpuSensitiveTools": [
    "demucs",
    "spleeter",
    "open_unmix",
    "asteroid",
    "speechbrain_enhancement",
    "deepfilternet",
    "faster_whisper",
    "pyannote_audio",
    "crepe",
    "torchcrepe"
  ],
  "policyRequirements": {
    "ownerApproval": "required_before_download",
    "licenseReview": "required_before_download",
    "provenanceRecord": "required_before_download",
    "checksumManifest": "required_before_download",
    "storageLocation": "blocked_until_private_artifact_policy",
    "costApproval": "required_before_gpu_worker_plan",
    "gpuImageSelection": "blocked_until_owner_review",
    "publicArtifactDefault": "blocked",
    "signedUrlDefault": "blocked"
  },
  "allowedNow": {
    "downloadModelWeights": "no",
    "runInference": "no",
    "createStorageObjects": "no",
    "createSignedUrls": "no",
    "publishArtifacts": "no",
    "claimProviderReadiness": "no",
    "claimWorkerReadiness": "no",
    "claimRuntimeReadiness": "no"
  },
  "nextPrompt": "SOUND-RUNTIME-MEDIA-GATE-2: model weight owner review, no download"
}
```
