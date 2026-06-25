# AI Video B-roll Generation Controlled Model Loader Import Metadata

Status: `ai_video_broll_gen_7_model_loader_import_metadata`

This metadata packet records the import-only inspection outputs from AI-VIDEO-BROLL-GEN-7. It is evidence only. It does not authorize inference, generated frames, generated video, media processing, workers, providers, Supabase, SQL, signed URLs, public artifacts, beta, or production.

```json ai-video-broll-gen-7-model-loader-import-metadata
{
  "phase": "AI-VIDEO-BROLL-GEN-7",
  "proofMode": "model_loader_import_metadata_only",
  "modelId": "Wan-AI/Wan2.1-T2V-1.3B",
  "sourceRevision": "37ec512624d61f7aa208f7ea8140a131f93afc9a",
  "offlineEnvironment": {
    "HF_HUB_OFFLINE": "1",
    "TRANSFORMERS_OFFLINE": "1",
    "DIFFUSERS_OFFLINE": "1"
  },
  "imports": {
    "torch": "2.12.1",
    "torchvision": "0.27.1",
    "diffusers": "0.38.0",
    "transformers": "5.12.1",
    "accelerate": "1.14.0",
    "safetensors": "0.8.0",
    "huggingface_hub": "1.21.0",
    "sentencepiece": "0.2.1",
    "numpy": "2.5.0",
    "pillow": "12.2.0",
    "einops": "0.8.2",
    "wanPipelineClassImported": "WanPipeline"
  },
  "configInspection": {
    "modelConfigParsed": true,
    "modelType": "WanModel",
    "numLayers": 30,
    "configKeys": [
      "_class_name",
      "_diffusers_version",
      "dim",
      "eps",
      "ffn_dim",
      "freq_dim",
      "in_dim",
      "model_type",
      "num_heads",
      "num_layers",
      "out_dim",
      "text_len"
    ]
  },
  "safetensorsInspection": {
    "headerOpened": true,
    "tensorKeyCount": 825,
    "metadataKeys": [
      "format"
    ],
    "sampleShapes": {
      "blocks.0.cross_attn.k.bias": [
        1536
      ],
      "blocks.0.cross_attn.k.weight": [
        1536,
        1536
      ],
      "blocks.0.cross_attn.norm_k.weight": [
        1536
      ],
      "blocks.0.cross_attn.norm_q.weight": [
        1536
      ],
      "blocks.0.cross_attn.o.bias": [
        1536
      ]
    }
  },
  "tokenizerInspection": {
    "autoTokenizerLoaded": true,
    "tokenizerClass": "T5Tokenizer",
    "tokenizerLength": 256300,
    "sentencePieceLoaded": true,
    "sentencePieceSize": 256000,
    "textEncoded": false
  },
  "archiveInspection": [
    {
      "relativePath": "Wan2.1_VAE.pth",
      "bytes": 507609880,
      "isZipArchive": true,
      "firstBytesHex": "504b030400000808",
      "sampleArchiveEntries": [
        "wanx_vae/data.pkl",
        "wanx_vae/byteorder",
        "wanx_vae/data/0",
        "wanx_vae/data/1",
        "wanx_vae/data/2",
        "wanx_vae/data/3",
        "wanx_vae/version",
        "wanx_vae/.data/serialization_id"
      ],
      "deserializedByTorchLoad": false
    },
    {
      "relativePath": "models_t5_umt5-xxl-enc-bf16.pth",
      "bytes": 11361920418,
      "isZipArchive": true,
      "firstBytesHex": "504b030400000808",
      "sampleArchiveEntries": [
        "umt5-xxl-enc-bf16/data.pkl",
        "umt5-xxl-enc-bf16/byteorder",
        "umt5-xxl-enc-bf16/data/0",
        "umt5-xxl-enc-bf16/data/1",
        "umt5-xxl-enc-bf16/data/10",
        "umt5-xxl-enc-bf16/data/100",
        "umt5-xxl-enc-bf16/data/101",
        "umt5-xxl-enc-bf16/data/102"
      ],
      "deserializedByTorchLoad": false
    }
  ],
  "runtimeActions": {
    "pipelineInstantiated": false,
    "modelFromPretrainedCalled": false,
    "torchLoadCalled": false,
    "promptCreated": false,
    "textEncodingCalled": false,
    "denoisingStepCalled": false,
    "vaeEncodeDecodeCalled": false,
    "schedulerRun": false,
    "inferenceRun": false,
    "generatedFramesCreated": false,
    "generatedVideoCreated": false
  }
}
```
