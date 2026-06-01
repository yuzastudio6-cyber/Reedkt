import type { ApprovedVlmModelDownloadEvidence } from './vlm-model-download-types'

export const approvedVlmModelDownloadEvidence: ApprovedVlmModelDownloadEvidence = {
  "phase": "39B",
  "modelId": "Qwen/Qwen3-VL-8B-Instruct",
  "modelFamily": "Qwen3-VL",
  "revision": "0c351dd01ed87e9c1b53cbc748cba10e6187ff3b",
  "status": "verified",
  "licenseName": "apache-2.0",
  "codexLicenseDecision": "staging_download_approved_by_codex",
  "humanLegalReviewRequiredBeforePhase39C": false,
  "productionLegalApprovalComplete": false,
  "targetGcsPath": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/",
  "selectedAssets": [
    {
      "relativePath": "README.md",
      "role": "model_card",
      "requiredStatus": "required_for_source_license_evidence",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/README.md",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/README.md",
      "expectedSizeBytes": 7133,
      "blobId": "06fb2c8220b4fb51ccca87dd694ef9d240c36745",
      "selectionReason": "Model card snapshot for source/license evidence."
    },
    {
      "relativePath": "chat_template.json",
      "role": "tokenizer",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/chat_template.json",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/chat_template.json",
      "expectedSizeBytes": 5499,
      "blobId": "1081bacf1af7c7c6de4a585ce02cd0fd34e382da",
      "selectionReason": "Qwen chat template used by later bounded prompt formatting."
    },
    {
      "relativePath": "config.json",
      "role": "config",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/config.json",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/config.json",
      "expectedSizeBytes": 1474,
      "blobId": "0e2df614c5fe1ad2b6b540c8625bebf2d7ec43ca",
      "selectionReason": "Model architecture/configuration for local runtime."
    },
    {
      "relativePath": "generation_config.json",
      "role": "config",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/generation_config.json",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/generation_config.json",
      "expectedSizeBytes": 269,
      "blobId": "e116347d7ef42621c7a5957f82c015c38d939c1f",
      "selectionReason": "Generation defaults for future bounded runtime templates."
    },
    {
      "relativePath": "merges.txt",
      "role": "tokenizer",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/merges.txt",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/merges.txt",
      "expectedSizeBytes": 1671839,
      "blobId": "20024bfe7c83998e9aeaf98a0cd6a2ce6306c2f0",
      "selectionReason": "Tokenizer merge rules."
    },
    {
      "relativePath": "model-00001-of-00004.safetensors",
      "role": "model_weight",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00001-of-00004.safetensors",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00001-of-00004.safetensors",
      "expectedSizeBytes": 4902275944,
      "blobId": "392e405fa984ab082e4db6cf265567819f687bcb",
      "lfsSha256": "d5d0aef0eb170fc7453a296c43c0849a56f510555d3588e4fd662bb35490aefa",
      "selectionReason": "Pinned model weight shard 1 of 4."
    },
    {
      "relativePath": "model-00002-of-00004.safetensors",
      "role": "model_weight",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00002-of-00004.safetensors",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00002-of-00004.safetensors",
      "expectedSizeBytes": 4915962496,
      "blobId": "1540d5047c7a275d06c06c8e271c4974f310e87e",
      "lfsSha256": "8be88fb5501e4d5719a6d4cc212e6a13480330e74f3e8c77daa1a68f199106b5",
      "selectionReason": "Pinned model weight shard 2 of 4."
    },
    {
      "relativePath": "model-00003-of-00004.safetensors",
      "role": "model_weight",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00003-of-00004.safetensors",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00003-of-00004.safetensors",
      "expectedSizeBytes": 4999831048,
      "blobId": "8e8450c4763c2a7e026dd9e83211603eb3e06207",
      "lfsSha256": "83de00eafe6e0d57ccd009dbcf71c9974d74df2f016c27afb7e95aafd16b2192",
      "selectionReason": "Pinned model weight shard 3 of 4."
    },
    {
      "relativePath": "model-00004-of-00004.safetensors",
      "role": "model_weight",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00004-of-00004.safetensors",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00004-of-00004.safetensors",
      "expectedSizeBytes": 2716270024,
      "blobId": "10f83d82617301ff5adc5588b8b1b2f0552aa9e3",
      "lfsSha256": "0a88b98e9f96270973f567e6a2c103ede6ccdf915ca3075e21c755604d0377a5",
      "selectionReason": "Pinned model weight shard 4 of 4."
    },
    {
      "relativePath": "model.safetensors.index.json",
      "role": "model_weight",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model.safetensors.index.json",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model.safetensors.index.json",
      "expectedSizeBytes": 67759,
      "blobId": "5857ec62530eb589b1876034dd5386f1d98131a6",
      "selectionReason": "Safetensors shard index for local runtime."
    },
    {
      "relativePath": "preprocessor_config.json",
      "role": "processor",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/preprocessor_config.json",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/preprocessor_config.json",
      "expectedSizeBytes": 390,
      "blobId": "2ea84a437d448ff71b08df68fdd949d5cc4ebb64",
      "selectionReason": "Vision preprocessing configuration."
    },
    {
      "relativePath": "tokenizer.json",
      "role": "tokenizer",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/tokenizer.json",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/tokenizer.json",
      "expectedSizeBytes": 7032403,
      "blobId": "c6cc1014128b19d1fc46b1d30a23e3b1d35db421",
      "selectionReason": "Tokenizer model file."
    },
    {
      "relativePath": "tokenizer_config.json",
      "role": "tokenizer",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/tokenizer_config.json",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/tokenizer_config.json",
      "expectedSizeBytes": 10868,
      "blobId": "d3d3763207692c78780f4bf42d4dadf49a5c8012",
      "selectionReason": "Tokenizer runtime configuration."
    },
    {
      "relativePath": "video_preprocessor_config.json",
      "role": "processor",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/video_preprocessor_config.json",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/video_preprocessor_config.json",
      "expectedSizeBytes": 385,
      "blobId": "3ba673a5ad7d4d13f54155ecd38b2a94a6dac8fe",
      "selectionReason": "Video processor configuration, staged for future runtime parity but not executed in Phase 39B."
    },
    {
      "relativePath": "vocab.json",
      "role": "tokenizer",
      "requiredStatus": "required_for_phase39c_runtime",
      "sourceUrl": "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct/resolve/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/vocab.json",
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/vocab.json",
      "expectedSizeBytes": 2776833,
      "blobId": "4783fe10ac3adce15ac8f358ef5462739852c569",
      "selectionReason": "Tokenizer vocabulary."
    }
  ],
  "assetSha256": {
    "README.md": "6d5d06e0c3f069097002445d30dce9ee107db3afaf15563f09e6df49b8dcb4d7",
    "chat_template.json": "5c72a170d2a4a1a3bc5adad2e689ae28138a9700e5b8c96c0266331e86c0acce",
    "config.json": "5cd452860dc1e9c29dd71cc3cef7f39b338b7a40793f7a260655c2d3568f3661",
    "generation_config.json": "8469742d1fce0de951c8909b26a2c0c0d8490837ce476efb114da9e0cefc4d44",
    "merges.txt": "599bab54075088774b1733fde865d5bd747cbcc7a547c5bc12610e874e26f5e3",
    "model-00001-of-00004.safetensors": "d5d0aef0eb170fc7453a296c43c0849a56f510555d3588e4fd662bb35490aefa",
    "model-00002-of-00004.safetensors": "8be88fb5501e4d5719a6d4cc212e6a13480330e74f3e8c77daa1a68f199106b5",
    "model-00003-of-00004.safetensors": "83de00eafe6e0d57ccd009dbcf71c9974d74df2f016c27afb7e95aafd16b2192",
    "model-00004-of-00004.safetensors": "0a88b98e9f96270973f567e6a2c103ede6ccdf915ca3075e21c755604d0377a5",
    "model.safetensors.index.json": "520b2e05079402e9468a8701d03d1154d14b2599593afb6effa7fb60c1bff070",
    "preprocessor_config.json": "27225450ac9c6529872ee1924fcb0962ff5634834f817040f444118116f4e516",
    "tokenizer.json": "a5d85b6dcc535e6b93115a9ef287e6132fdbf30270da6218194ba742261173c7",
    "tokenizer_config.json": "c2da771801886ad9ae98181793ffd3dfb7f1af30f6f7c6a4e15d7dbba52e2399",
    "video_preprocessor_config.json": "7768af27c1fafa9cc9011c1dc20067e03f8915e03b63504550e11d5066986d13",
    "vocab.json": "ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910"
  },
  "aggregateSha256": "3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908",
  "assetSizeBytes": {
    "README.md": 7133,
    "chat_template.json": 5499,
    "config.json": 1474,
    "generation_config.json": 269,
    "merges.txt": 1671839,
    "model-00001-of-00004.safetensors": 4902275944,
    "model-00002-of-00004.safetensors": 4915962496,
    "model-00003-of-00004.safetensors": 4999831048,
    "model-00004-of-00004.safetensors": 2716270024,
    "model.safetensors.index.json": 67759,
    "preprocessor_config.json": 390,
    "tokenizer.json": 7032403,
    "tokenizer_config.json": 10868,
    "video_preprocessor_config.json": 385,
    "vocab.json": 2776833
  },
  "fileCount": 15,
  "selectedTotalSizeBytes": 17545914364,
  "downloadedAt": "2026-05-31T03:08:33.221Z",
  "sanitizedLocalTempPath": "/tmp/reeditpro/activation/phase39b/qwen3-vl-8b-instruct/phase39b-20260531T025648",
  "uploadedObjects": [
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/README.md",
      "relativePath": "README.md",
      "sizeBytes": 7133,
      "localSha256": "6d5d06e0c3f069097002445d30dce9ee107db3afaf15563f09e6df49b8dcb4d7",
      "generation": "1780196915114659",
      "crc32c": "iQXKsw==",
      "md5Hash": "7OWxYJllQ6QMeAY5kzVanQ=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/chat_template.json",
      "relativePath": "chat_template.json",
      "sizeBytes": 5499,
      "localSha256": "5c72a170d2a4a1a3bc5adad2e689ae28138a9700e5b8c96c0266331e86c0acce",
      "generation": "1780196916966250",
      "crc32c": "euaTdg==",
      "md5Hash": "NA1mlhNpVLg+i1Q0pZjMsQ=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/config.json",
      "relativePath": "config.json",
      "sizeBytes": 1474,
      "localSha256": "5cd452860dc1e9c29dd71cc3cef7f39b338b7a40793f7a260655c2d3568f3661",
      "generation": "1780196918909530",
      "crc32c": "Y+/hmA==",
      "md5Hash": "FwaNcQnn33iuF6lS9jE4wA=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/generation_config.json",
      "relativePath": "generation_config.json",
      "sizeBytes": 269,
      "localSha256": "8469742d1fce0de951c8909b26a2c0c0d8490837ce476efb114da9e0cefc4d44",
      "generation": "1780196920805525",
      "crc32c": "HofJtA==",
      "md5Hash": "/4M0HLNhdO3ST2SsAzFSdA=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/merges.txt",
      "relativePath": "merges.txt",
      "sizeBytes": 1671839,
      "localSha256": "599bab54075088774b1733fde865d5bd747cbcc7a547c5bc12610e874e26f5e3",
      "generation": "1780196923035319",
      "crc32c": "TsXDRw==",
      "md5Hash": "54iCwuIkp1+oGA7GELriQw=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00001-of-00004.safetensors",
      "relativePath": "model-00001-of-00004.safetensors",
      "sizeBytes": 4902275944,
      "localSha256": "d5d0aef0eb170fc7453a296c43c0849a56f510555d3588e4fd662bb35490aefa",
      "generation": "1780197312068182",
      "crc32c": "rNua9Q=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00002-of-00004.safetensors",
      "relativePath": "model-00002-of-00004.safetensors",
      "sizeBytes": 4915962496,
      "localSha256": "8be88fb5501e4d5719a6d4cc212e6a13480330e74f3e8c77daa1a68f199106b5",
      "generation": "1780197625122751",
      "crc32c": "anrvSA=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00003-of-00004.safetensors",
      "relativePath": "model-00003-of-00004.safetensors",
      "sizeBytes": 4999831048,
      "localSha256": "83de00eafe6e0d57ccd009dbcf71c9974d74df2f016c27afb7e95aafd16b2192",
      "generation": "1780197922867701",
      "crc32c": "mTL3og=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model-00004-of-00004.safetensors",
      "relativePath": "model-00004-of-00004.safetensors",
      "sizeBytes": 2716270024,
      "localSha256": "0a88b98e9f96270973f567e6a2c103ede6ccdf915ca3075e21c755604d0377a5",
      "generation": "1780198066365852",
      "crc32c": "xabQcg=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/model.safetensors.index.json",
      "relativePath": "model.safetensors.index.json",
      "sizeBytes": 67759,
      "localSha256": "520b2e05079402e9468a8701d03d1154d14b2599593afb6effa7fb60c1bff070",
      "generation": "1780198068603691",
      "crc32c": "zGJWgA==",
      "md5Hash": "FbsncbepYQtPEpgxn1jlNQ=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/preprocessor_config.json",
      "relativePath": "preprocessor_config.json",
      "sizeBytes": 390,
      "localSha256": "27225450ac9c6529872ee1924fcb0962ff5634834f817040f444118116f4e516",
      "generation": "1780198070116804",
      "crc32c": "8VGvsA==",
      "md5Hash": "e8rt9yagWSRZWwMC0N1Nxw=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/tokenizer.json",
      "relativePath": "tokenizer.json",
      "sizeBytes": 7032403,
      "localSha256": "a5d85b6dcc535e6b93115a9ef287e6132fdbf30270da6218194ba742261173c7",
      "generation": "1780198072411670",
      "crc32c": "kbuigA==",
      "md5Hash": "8TGUaAiR5f1YF6VqNBvwFQ=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/tokenizer_config.json",
      "relativePath": "tokenizer_config.json",
      "sizeBytes": 10868,
      "localSha256": "c2da771801886ad9ae98181793ffd3dfb7f1af30f6f7c6a4e15d7dbba52e2399",
      "generation": "1780198074196242",
      "crc32c": "cGn/Jg==",
      "md5Hash": "UMXTfZ05BODiQ+cJvbtsNw=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/video_preprocessor_config.json",
      "relativePath": "video_preprocessor_config.json",
      "sizeBytes": 385,
      "localSha256": "7768af27c1fafa9cc9011c1dc20067e03f8915e03b63504550e11d5066986d13",
      "generation": "1780198075858186",
      "crc32c": "cNRL4Q==",
      "md5Hash": "QbyE16pwh5leC4/TwKKd+g=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/vocab.json",
      "relativePath": "vocab.json",
      "sizeBytes": 2776833,
      "localSha256": "ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910",
      "generation": "1780198077910354",
      "crc32c": "DhkvIQ==",
      "md5Hash": "YTuOSmIsSiyQ6eEkX8VA1g=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_model_download_plan.json",
      "relativePath": "phase_39b_vlm_model_download_plan.json",
      "sizeBytes": 10138,
      "generation": "1780198118778801",
      "crc32c": "vj4nDg==",
      "md5Hash": "T8yuwAshl4iivrhTdHEGEg=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_exact_revision_manifest.json",
      "relativePath": "phase_39b_vlm_exact_revision_manifest.json",
      "sizeBytes": 3874,
      "generation": "1780198120763841",
      "crc32c": "r9C9gQ==",
      "md5Hash": "TyXPZHJJg/m+SesMjXqxWA=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_source_evidence.json",
      "relativePath": "phase_39b_vlm_source_evidence.json",
      "sizeBytes": 1253,
      "generation": "1780198122356640",
      "crc32c": "hkaDpw==",
      "md5Hash": "0o25kz5oSdDeSfGgmh1q6A=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_license_evidence.json",
      "relativePath": "phase_39b_vlm_license_evidence.json",
      "sizeBytes": 797,
      "generation": "1780198124192290",
      "crc32c": "UpDn5g==",
      "md5Hash": "PzUnr3lWQxP0OCKwI7foqQ=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_asset_selection_manifest.json",
      "relativePath": "phase_39b_vlm_asset_selection_manifest.json",
      "sizeBytes": 10762,
      "generation": "1780198125877003",
      "crc32c": "CBsuCw==",
      "md5Hash": "J/Hz0WduKajG0BgJh0eQcQ=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_download_command_plan.json",
      "relativePath": "phase_39b_vlm_download_command_plan.json",
      "sizeBytes": 8192,
      "generation": "1780198127627394",
      "crc32c": "kxq9rg==",
      "md5Hash": "ShEN17NHd7cNbTle3NTKcA=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_checksum_manifest.json",
      "relativePath": "phase_39b_vlm_checksum_manifest.json",
      "sizeBytes": 6755,
      "generation": "1780198129035871",
      "crc32c": "LYzxjQ==",
      "md5Hash": "GXgXt8vmz+G1ZsxTRDD+1A=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_file_checksums_sha256.txt",
      "relativePath": "phase_39b_vlm_file_checksums_sha256.txt",
      "sizeBytes": 1330,
      "generation": "1780198130750148",
      "crc32c": "CGQurQ==",
      "md5Hash": "JTkU0rHdvVeb6dqNAfFASA=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_model_tree_manifest.json",
      "relativePath": "phase_39b_vlm_model_tree_manifest.json",
      "sizeBytes": 12992,
      "generation": "1780198132459371",
      "crc32c": "Z0Umow==",
      "md5Hash": "b58APP4Zgo1skSEb4St01w=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_private_gcs_upload_report.json",
      "relativePath": "phase_39b_vlm_private_gcs_upload_report.json",
      "sizeBytes": 13177,
      "generation": "1780198134135039",
      "crc32c": "uP/phw==",
      "md5Hash": "ltyXbCNCGOwDFCQavEXhuQ=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_runtime_handoff_manifest.json",
      "relativePath": "phase_39b_vlm_runtime_handoff_manifest.json",
      "sizeBytes": 1940,
      "generation": "1780198135770069",
      "crc32c": "u4Tm/A==",
      "md5Hash": "Rdf4yOGUHtmQ7RAH+aOBoA=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_cost_risk_update.json",
      "relativePath": "phase_39b_vlm_cost_risk_update.json",
      "sizeBytes": 596,
      "generation": "1780198137376471",
      "crc32c": "sXvnpQ==",
      "md5Hash": "b32yq5WeXWwZWXz1+uu53w=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_blocker_report.json",
      "relativePath": "phase_39b_vlm_blocker_report.json",
      "sizeBytes": 2438,
      "generation": "1780198138776717",
      "crc32c": "QsEugg==",
      "md5Hash": "ctsDzeYG4o6DqGKfhqykow=="
    },
    {
      "gcsUri": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_model_download_report.json",
      "relativePath": "phase_39b_vlm_model_download_report.json",
      "sizeBytes": 94082,
      "generation": "1780198140290596",
      "crc32c": "qWj+MA==",
      "md5Hash": "r3fpqpuNpHH7s3WEuwNKew=="
    }
  ],
  "blockers": [],
  "warnings": [
    "Phase 39B downloaded selected Qwen3-VL assets only; it did not run VLM runtime or inference.",
    "Generated VLM runtime remains blocked until Phase 39C verifies local private assets and no runtime auto-download."
  ],
  "uploadedAt": "2026-05-31T03:28:37.392Z",
  "verifiedAt": "2026-05-31T03:29:15.720Z",
  "uploadedObjectCount": 29,
  "gcsPhaseReportPath": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/phase_39b_vlm_model_download_report.json"
}

export function getApprovedVlmModelDownloadEvidence(): ApprovedVlmModelDownloadEvidence {
  return {
    ...approvedVlmModelDownloadEvidence,
    selectedAssets: approvedVlmModelDownloadEvidence.selectedAssets.map((asset) => ({ ...asset })),
    assetSha256: { ...approvedVlmModelDownloadEvidence.assetSha256 },
    assetSizeBytes: { ...approvedVlmModelDownloadEvidence.assetSizeBytes },
    uploadedObjects: approvedVlmModelDownloadEvidence.uploadedObjects.map((object) => ({ ...object })),
    blockers: [...approvedVlmModelDownloadEvidence.blockers],
    warnings: [...approvedVlmModelDownloadEvidence.warnings],
  }
}
