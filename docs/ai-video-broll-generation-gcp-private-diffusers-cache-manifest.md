# AI Video B-roll Generation GCP Private Diffusers Cache Manifest

Decision: `ai_video_broll_gen_9j_diffusers_cache_download_private_cache_hashed_ready_for_cache_validate`

Private cache path:

```text
/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b
```

Source repository: `Wan-AI/Wan2.1-T2V-1.3B-Diffusers`

Source commit: `0fad780a534b6463e45facd96134c9f345acfa5b`

Aggregate bytes: `28928887859`

Runtime-essential file count: `19`

```json ai-video-broll-gen-9j-diffusers-cache-manifest
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-DIFFUSERS-CACHE-DOWNLOAD",
  "decision": "ai_video_broll_gen_9j_diffusers_cache_download_private_cache_hashed_ready_for_cache_validate",
  "modelRepository": "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
  "sourceCommit": "0fad780a534b6463e45facd96134c9f345acfa5b",
  "privateCachePath": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b",
  "aggregateBytes": 28928887859,
  "runtimeEssentialFileCount": 19,
  "modelIndexClassName": "WanPipeline",
  "indexRefsOk": true,
  "manifest": [
    {
      "path": "model_index.json",
      "bytes": 400,
      "sha256": "b8b28e022329acf975e027579a1d2dc3de44dba28f4c909b98a880fbf5b0de7d"
    },
    {
      "path": "scheduler/scheduler_config.json",
      "bytes": 751,
      "sha256": "3fed2abbd9bbc301a74db01947198057ec5049808910dccab320925bf27bea6e"
    },
    {
      "path": "text_encoder/config.json",
      "bytes": 854,
      "sha256": "4087b6192155a4643f6d29fd326c4610103130674011ef4d0a53f8bce5de967d"
    },
    {
      "path": "text_encoder/model-00001-of-00005.safetensors",
      "bytes": 4972389712,
      "sha256": "c0ef3a140898e228a3520c9adec60743d2e8e5b3d229651bb37f1a3921919f99"
    },
    {
      "path": "text_encoder/model-00002-of-00005.safetensors",
      "bytes": 4899225672,
      "sha256": "481c7b2b39771c44df6dd8d13ee12ed072d731b4a650bd092885d4d52db229ad"
    },
    {
      "path": "text_encoder/model-00003-of-00005.safetensors",
      "bytes": 4966309504,
      "sha256": "f93148bcc04052a169e1e49bfcf6125df6cf9bf243cb9c627da75266cf8e35c3"
    },
    {
      "path": "text_encoder/model-00004-of-00005.safetensors",
      "bytes": 4999880704,
      "sha256": "a451792c739c05bca4606190cc2dd16731411bac03b4cf6aacc5767321f857c9"
    },
    {
      "path": "text_encoder/model-00005-of-00005.safetensors",
      "bytes": 2885866152,
      "sha256": "7e76e18d224531b8197a46231cb53daf7f2f6ca707130252becf933026ac4eea"
    },
    {
      "path": "text_encoder/model.safetensors.index.json",
      "bytes": 22476,
      "sha256": "8af791f24a6447aa30c95786f40adf23d3c9df97470d2f36159c8f1113f120b4"
    },
    {
      "path": "tokenizer/special_tokens_map.json",
      "bytes": 7079,
      "sha256": "456b58fd240a06c743a7c2cf8008bec501240d68ebd1fc4018ea569505fea270"
    },
    {
      "path": "tokenizer/spiece.model",
      "bytes": 4548313,
      "sha256": "e3909a67b780650b35cf529ac782ad2b6b26e6d1f849d3fbb6a872905f452458"
    },
    {
      "path": "tokenizer/tokenizer.json",
      "bytes": 16837459,
      "sha256": "20a46ac256746594ed7e1e3ef733b83fbc5a6f0922aa7480eda961743de080ef"
    },
    {
      "path": "tokenizer/tokenizer_config.json",
      "bytes": 61758,
      "sha256": "1d8d2a216bf8e70ac15b7ddcea566c4dd0433c024b39a58ca5e4c66bd78defbd"
    },
    {
      "path": "transformer/config.json",
      "bytes": 465,
      "sha256": "0b093fa072e9ff28763febe9b964ee582f566733a6d6709deb9dfba1bde16b81"
    },
    {
      "path": "transformer/diffusion_pytorch_model-00001-of-00002.safetensors",
      "bytes": 4998781576,
      "sha256": "6d011927dbd2cc8afe53d57abab04a8fd86f615d83324770d985fb058ece3a24"
    },
    {
      "path": "transformer/diffusion_pytorch_model-00002-of-00002.safetensors",
      "bytes": 677289072,
      "sha256": "b92ec2309b1f239af6f746431815a881afcc938abb26a4f08d9a2fd6c892f872"
    },
    {
      "path": "transformer/diffusion_pytorch_model.safetensors.index.json",
      "bytes": 73296,
      "sha256": "dcbcf3497134a3f50557ff069dd7d2c84b5c4d8c5932472f6bdb780fb4016589"
    },
    {
      "path": "vae/config.json",
      "bytes": 724,
      "sha256": "f0c1cc1d7decb5badc384f54691746a27a9aeff49f7ebca974e583389342d527"
    },
    {
      "path": "vae/diffusion_pytorch_model.safetensors",
      "bytes": 507591892,
      "sha256": "d6e524b3fffede1787a74e81b30976dce5400c4439ba64222168e607ed19e793"
    }
  ],
  "indexRefs": [
    {
      "index": "text_encoder/model.safetensors.index.json",
      "shard": "model-00001-of-00005.safetensors",
      "exists": true
    },
    {
      "index": "text_encoder/model.safetensors.index.json",
      "shard": "model-00002-of-00005.safetensors",
      "exists": true
    },
    {
      "index": "text_encoder/model.safetensors.index.json",
      "shard": "model-00003-of-00005.safetensors",
      "exists": true
    },
    {
      "index": "text_encoder/model.safetensors.index.json",
      "shard": "model-00004-of-00005.safetensors",
      "exists": true
    },
    {
      "index": "text_encoder/model.safetensors.index.json",
      "shard": "model-00005-of-00005.safetensors",
      "exists": true
    },
    {
      "index": "transformer/diffusion_pytorch_model.safetensors.index.json",
      "shard": "diffusion_pytorch_model-00001-of-00002.safetensors",
      "exists": true
    },
    {
      "index": "transformer/diffusion_pytorch_model.safetensors.index.json",
      "shard": "diffusion_pytorch_model-00002-of-00002.safetensors",
      "exists": true
    }
  ]
}
```

## No-Scope Statement

The manifest records private cache file evidence only. It does not record a model import, pipeline instantiation, model execution, generated frame, generated video, VM, Google Cloud mutation, Supabase mutation, SQL, provider call, worker dispatch, storage upload, signed URL, public artifact, credit mutation, beta unlock, production unlock, runtime-readiness claim, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.
