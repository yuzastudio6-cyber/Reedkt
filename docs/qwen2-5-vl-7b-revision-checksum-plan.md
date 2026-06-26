# Qwen2.5-VL 7B Revision And Checksum Plan

## Status

Decision: `qwen2_5_vl_7b_revision_checksum_plan_ready_no_download`

This packet pins the upstream Qwen2.5-VL 7B Instruct revision and records a planned checksum manifest for future controlled download verification. It does not download model weights, import model packages, start vLLM, run CUDA, run inference, create generated media, create generated assets, mutate GCP, mutate Supabase, run SQL, dispatch workers, call providers, create storage objects, create public artifacts, create signed URLs, mutate credits, unlock beta, or unlock production.

## Upstream Metadata Inspection

- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Current inspected revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Branch checked: `main`
- Pipeline tag: `image-text-to-text`
- License tag: `license:apache-2.0`
- Source page: [Qwen/Qwen2.5-VL-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct)
- Metadata endpoint used: `https://huggingface.co/api/models/Qwen/Qwen2.5-VL-7B-Instruct?blobs=true`
- Download performed now: false

The inspected Hugging Face metadata exposes five LFS safetensor shards with sha256 values. Those remote LFS hashes are accepted as a planning target only. A future controlled download must recompute local sha256 values from the private cache and compare them to this plan before any model import or inference.

## Planned Private Cache

- Expected private cache root: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Runtime mount target: `/opt/reeditpro/model-weights/vlm/qwen2.5-vl-7b-instruct/`
- Cache location status: future private cache only
- Cache created now: false
- Local files verified now: false
- Local checksum coverage claimed now: false

## Planned File Manifest

```json qwen2-5-vl-7b-revision-checksum-plan
{
  "phase": "QWEN2_5_VL_STACK_TOOL_1",
  "decision": "qwen2_5_vl_7b_revision_checksum_plan_ready_no_download",
  "modelId": "Qwen/Qwen2.5-VL-7B-Instruct",
  "sourceRevision": "cc594898137f460bfe9f0759e9844b3ce807cfb5",
  "sourceUrl": "https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct",
  "licenseTag": "license:apache-2.0",
  "pipelineTag": "image-text-to-text",
  "checksumAlgorithm": "sha256",
  "downloadedNow": false,
  "localCacheCreatedNow": false,
  "localChecksumVerifiedNow": false,
  "modelImportAllowed": false,
  "modelInferenceAllowed": false,
  "files": [
    {
      "relativePath": ".gitattributes",
      "bytes": 1519,
      "remoteBlobId": "a6344aac8c09253b3b630fb776ae94478aa0275b",
      "role": "git_lfs_metadata",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "README.md",
      "bytes": 18574,
      "remoteBlobId": "5f169031e3f61faa8262272000c36d54bdc9b926",
      "role": "model_card_provenance",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "chat_template.json",
      "bytes": 1050,
      "remoteBlobId": "732bd68bc5427d1fb6c06a59b3bf2456b2155d24",
      "role": "chat_template",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "config.json",
      "bytes": 1374,
      "remoteBlobId": "58ee12a9fb3d8708a1e41e49cb9aa5ac5017b6a6",
      "role": "model_config",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "generation_config.json",
      "bytes": 216,
      "remoteBlobId": "1088c9865dbf2e8152485664bb07495e89a14efb",
      "role": "generation_config",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "merges.txt",
      "bytes": 1671839,
      "remoteBlobId": "20024bfe7c83998e9aeaf98a0cd6a2ce6306c2f0",
      "role": "tokenizer_merges",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "model-00001-of-00005.safetensors",
      "bytes": 3900233256,
      "remoteBlobId": "77da309030fbb0afdd36ab5899f9e515758b50f5",
      "lfsSha256": "e97b877e47fde53a6c6e77aafb36e58e91ee9d95c4a3eeac6f1b5c0e6a1c986e",
      "role": "model_weight_shard",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "model-00002-of-00005.safetensors",
      "bytes": 3864726320,
      "remoteBlobId": "b404bf51eaa1b3231f6ac670e6c1d83fdddc9e5c",
      "lfsSha256": "a9a300a43b4724eee2abe7c18ceb26768d0ab011eb0cad19d9bfd2476a24d024",
      "role": "model_weight_shard",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "model-00003-of-00005.safetensors",
      "bytes": 3864726424,
      "remoteBlobId": "24df661f0acaa6c1d3368ddf2aff98da02a183c2",
      "lfsSha256": "111223d173e00bbee81cba1216fad28668df3476706b7fd26f4d5b50f8b3a507",
      "role": "model_weight_shard",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "model-00004-of-00005.safetensors",
      "bytes": 3864733680,
      "remoteBlobId": "b95b193f3c1b6d531efce9fb16a68f260a30a241",
      "lfsSha256": "ef47f634fa57d46ee134edcc09f34085a47da1e16c12a2abe0d67118be6d72ed",
      "role": "model_weight_shard",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "model-00005-of-00005.safetensors",
      "bytes": 1089994880,
      "remoteBlobId": "cf27374081ee269586ec091f14f0f82f8ef5ad3e",
      "lfsSha256": "0c859795ad3a627a9b95bcb762e059d5b768a4a36fdd4affeff269d93fdecc67",
      "role": "model_weight_shard",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "model.safetensors.index.json",
      "bytes": 57619,
      "remoteBlobId": "f0c9e9b8e043f5de0ac99fd8b2ea75515d811e7b",
      "role": "model_weight_index",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "preprocessor_config.json",
      "bytes": 350,
      "remoteBlobId": "7f3b746825e5eef53ed8ed57a91df9e86ee62c0a",
      "role": "vision_preprocessor_config",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "tokenizer.json",
      "bytes": 7031645,
      "remoteBlobId": "443909a61d429dff23010e5bddd28ff530edda00",
      "role": "tokenizer",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "tokenizer_config.json",
      "bytes": 5702,
      "remoteBlobId": "91684ea3dc135a7d815e2c932054ce88c1aab41f",
      "role": "tokenizer_config",
      "requiresLocalSha256AfterDownload": true
    },
    {
      "relativePath": "vocab.json",
      "bytes": 2776833,
      "remoteBlobId": "4783fe10ac3adce15ac8f358ef5462739852c569",
      "role": "tokenizer_vocab",
      "requiresLocalSha256AfterDownload": true
    }
  ],
  "weightShardCount": 5,
  "plannedByteTotal": 16595981281,
  "runtimeFlags": {
    "modelWeightsDownloaded": false,
    "modelImportsRun": false,
    "modelInferenceRun": false,
    "generatedVideoCreated": false,
    "generatedAssetsCreated": false,
    "providerCallsMade": false,
    "workersDispatched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "gcpMutationCreated": false,
    "dockerRun": false,
    "publicArtifactsCreated": false,
    "signedUrlsCreated": false,
    "creditMutationCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  }
}
```

## GPU And Runtime Fit

The revision is approved for planning against the L4-first envelope from the stack-tool packet:

- GPU target: NVIDIA L4 / Google Cloud G2 first
- Initial context: around `max_model_len=2048`
- Prompt batch: `max_num_seqs=1`
- Multimodal input: one image or sampled frame per prompt
- Image budget: 384px cap with 256px or 224px fallback
- Runtime: existing VLM lane with `vllm`, `transformers`, and `qwen-vl-utils`
- Worker loading: private local path only
- Auto-download: blocked

## Future Controlled Download Requirements

Before any install/import/inference step:

1. Confirm the source revision still matches `cc594898137f460bfe9f0759e9844b3ce807cfb5` or intentionally update this plan.
2. Download only into the private cache outside the repo.
3. Recompute local sha256 for every file.
4. Compare local sha256 values against remote LFS sha256s for all five safetensor shards and record local sha256s for non-LFS metadata files.
5. Prove the cache path is outside the repository and not staged.
6. Keep worker runtime offline/no-auto-download.
7. Do not import vLLM, Transformers, or Qwen runtime packages until a separate import gate.

## Remaining Blockers

- Local private cache not created.
- Local checksums not recomputed.
- Model-weight storage policy not accepted for execution.
- L4/G2 runtime quota and cost proof not re-run for Qwen2.5-VL.
- Worker import and inference gates not approved.
- QA, billing, provider, Supabase, and approved-snapshot owner evidence not connected to a real execution path.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_2: controlled private Qwen2.5-VL model weight download manifest, no inference`
