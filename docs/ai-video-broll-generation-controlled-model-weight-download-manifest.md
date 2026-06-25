# AI Video B-roll Generation Controlled Model Weight Download Manifest

Status: `ai_video_broll_gen_6_controlled_model_weight_download_manifest`

This manifest records the exact files downloaded for AI-VIDEO-BROLL-GEN-6. It is evidence only. The files remain in a private outside-repo cache and are not tracked, staged, uploaded, exposed by signed URL, exposed as public artifacts, imported, or used for inference.

```json ai-video-broll-gen-6-controlled-weight-download-manifest
{
  "phase": "AI-VIDEO-BROLL-GEN-6",
  "modelId": "Wan-AI/Wan2.1-T2V-1.3B",
  "sourceUrl": "https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B",
  "sourceRevision": "37ec512624d61f7aa208f7ea8140a131f93afc9a",
  "license": "apache-2.0",
  "checksumAlgorithm": "sha256",
  "privateCachePath": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a",
  "privateCacheOutsideRepository": true,
  "downloadedByteTotal": 17567424122,
  "downloadedFileCount": 10,
  "files": [
    {
      "relativePath": "LICENSE.txt",
      "bytes": 11357,
      "sha256": "c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4",
      "role": "license_provenance"
    },
    {
      "relativePath": "README.md",
      "bytes": 16913,
      "sha256": "d19fb6c377090790940f64af3423c87d289abc9fdee4d45963018e18e5d84119",
      "role": "model_card_provenance"
    },
    {
      "relativePath": "config.json",
      "bytes": 249,
      "sha256": "ab37994c43740513f94b3ba6233a784035a67b43c8cde83c8f31aa90468c67ce",
      "role": "model_config"
    },
    {
      "relativePath": "Wan2.1_VAE.pth",
      "bytes": 507609880,
      "sha256": "38071ab59bd94681c686fa51d75a1968f64e470262043be31f7a094e442fd981",
      "role": "vae_weight"
    },
    {
      "relativePath": "diffusion_pytorch_model.safetensors",
      "bytes": 5676070424,
      "sha256": "96b6b242ca1c2f24e9d02cd6596066fab6d310e2d7538f33ae267cb18d957e8f",
      "role": "dit_weight"
    },
    {
      "relativePath": "models_t5_umt5-xxl-enc-bf16.pth",
      "bytes": 11361920418,
      "sha256": "7cace0da2b446bbbbc57d031ab6cf163a3d59b366da94e5afe36745b746fd81d",
      "role": "text_encoder_weight"
    },
    {
      "relativePath": "google/umt5-xxl/special_tokens_map.json",
      "bytes": 6623,
      "sha256": "7b8a9f5040adb67b5805abdfd42c1f8d0f3d0e711f10726580eb3789cd0ad61d",
      "role": "tokenizer_config"
    },
    {
      "relativePath": "google/umt5-xxl/spiece.model",
      "bytes": 4548313,
      "sha256": "e3909a67b780650b35cf529ac782ad2b6b26e6d1f849d3fbb6a872905f452458",
      "role": "tokenizer_model"
    },
    {
      "relativePath": "google/umt5-xxl/tokenizer.json",
      "bytes": 16837417,
      "sha256": "6e197b4d3dbd71da14b4eb255f4fa91c9c1f2068b20a2de2472967ca3d22602b",
      "role": "tokenizer"
    },
    {
      "relativePath": "google/umt5-xxl/tokenizer_config.json",
      "bytes": 61728,
      "sha256": "ed9a3a8b0faa71a70a32847e0435fe036e6e112d4df4edb7bb48a921e344dc05",
      "role": "tokenizer_config"
    }
  ],
  "notDownloaded": [
    "assets",
    "examples",
    ".gitattributes"
  ],
  "notDownloadedReason": "not required for model-runtime-essential import proof; avoids non-runtime repository assets",
  "runtimeFlags": {
    "modelImportAllowed": false,
    "modelInferenceAllowed": false,
    "generatedVideoAllowed": false,
    "mediaProcessingAllowed": false,
    "storageUploadAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  }
}
```
