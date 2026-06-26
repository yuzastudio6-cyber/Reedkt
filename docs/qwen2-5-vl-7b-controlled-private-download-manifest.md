# Qwen2.5-VL 7B Controlled Private Download Manifest

## Status

Decision: `qwen2_5_vl_7b_controlled_private_download_verified_no_inference`

This packet records the controlled private cache download for `Qwen/Qwen2.5-VL-7B-Instruct` at revision `cc594898137f460bfe9f0759e9844b3ce807cfb5`. The model files were downloaded only into the private cache outside the git worktree and locally checksummed.

This packet does not import `vllm`, `transformers`, or `qwen-vl-utils`; does not start a model server; does not run CUDA; does not run inference; does not create generated images, videos, or assets; does not call providers; does not dispatch workers; does not mutate GCP, Supabase, SQL, storage, credits, or billing; does not create public artifacts or signed URLs; and does not unlock beta or production.

## Source And Cache

- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Source revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- License tag: `license:apache-2.0`
- Pipeline tag: `image-text-to-text`
- Private cache path: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Runtime mount target: `/opt/reeditpro/model-weights/vlm/qwen2.5-vl-7b-instruct/`
- Cache inside repo: false
- File count: `16`
- Weight shard count: `5`
- Total size bytes: `16595981281`
- Checksum algorithm: `sha256`
- Checksum manifest aggregate SHA-256: `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b`

## File Manifest

| File | Size bytes | Local SHA-256 | Remote LFS match |
| --- | ---: | --- | --- |
| `.gitattributes` | 1519 | `11ad7efa24975ee4b0c3c3a38ed18737f0658a5f75a0a96787b576a78a023361` | n/a |
| `README.md` | 18574 | `1fa65dbb08bc9ffe0b020409c8686f08b23008c5a68554353305fd2de6f2b81e` | n/a |
| `chat_template.json` | 1050 | `ad60d90252ed0b0705ba14e2d0ad0fec0beac1ea955642b54059b36052d8bc96` | n/a |
| `config.json` | 1374 | `77d9ec7321cc572e3579e2c84799c9cadaded63c49ce93b101733349fc330c43` | n/a |
| `generation_config.json` | 216 | `0a3aea82869fe29f20dc95ccf3e2bcff380eca1f5ad6447a4a4b37110b08e43e` | n/a |
| `merges.txt` | 1671839 | `599bab54075088774b1733fde865d5bd747cbcc7a547c5bc12610e874e26f5e3` | n/a |
| `model-00001-of-00005.safetensors` | 3900233256 | `e97b877e47fde53a6c6e77aafb36e58e91ee9d95c4a3eeac6f1b5c0e6a1c986e` | matched |
| `model-00002-of-00005.safetensors` | 3864726320 | `a9a300a43b4724eee2abe7c18ceb26768d0ab011eb0cad19d9bfd2476a24d024` | matched |
| `model-00003-of-00005.safetensors` | 3864726424 | `111223d173e00bbee81cba1216fad28668df3476706b7fd26f4d5b50f8b3a507` | matched |
| `model-00004-of-00005.safetensors` | 3864733680 | `ef47f634fa57d46ee134edcc09f34085a47da1e16c12a2abe0d67118be6d72ed` | matched |
| `model-00005-of-00005.safetensors` | 1089994880 | `0c859795ad3a627a9b95bcb762e059d5b768a4a36fdd4affeff269d93fdecc67` | matched |
| `model.safetensors.index.json` | 57619 | `73b333b0b16e5286ddba615d2caebcd495cf7e616f52eb217a81781393d79de9` | n/a |
| `preprocessor_config.json` | 350 | `f2058c716eef96ccaed1cc1e2d0c08306b62586d535b28d9d08e691b2fab7ca0` | n/a |
| `tokenizer.json` | 7031645 | `c0382117ea329cdf097041132f6d735924b697924d6f6fc3945713e96ce87539` | n/a |
| `tokenizer_config.json` | 5702 | `4abd3520120e266da84c0864fee064d1fb10806f02225911a47253dd38dc5f56` | n/a |
| `vocab.json` | 2776833 | `ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910` | n/a |

## GPU And Runtime Envelope

The cost-friendly first target remains NVIDIA L4 on Google Cloud G2:

- First GPU target: `nvidia_l4_google_cloud_g2_first`
- Recommended initial VM shape: `g2-standard-8`
- Minimum import-smoke VM shape: `g2-standard-4`
- Initial `max_model_len`: `2048`
- Initial `max_num_seqs`: `1`
- Image/frame input cap: `384px`, with `256px` or `224px` fallback if memory pressure appears

This is the right first beta-oriented envelope because Qwen2.5-VL 7B needs a real GPU with enough VRAM, but it should not start on an A100/H100 class instance unless L4 import/runtime proof fails. CPU-only execution remains blocked for this model.

## Runtime Gates

- `modelWeightsDownloaded=true`
- `privateCacheVerified=true`
- `localChecksumVerified=true`
- `modelImportsRun=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `gcpMutationCreated=false`
- `dockerRun=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## ReEditPro Tool Role

Qwen2.5-VL remains a visual understanding, planning, and QA stack tool. It is ranked for:

1. Visual scene understanding and source-frame description when deterministic tools are insufficient.
2. Caption/safe-zone and visual QA reasoning as advisory metadata.
3. Product/demo/tutorial visual step recognition as planning metadata.
4. Fallback support for OCR/OpenCV/Remotion QA, not replacement of exact tools.

It is not ranked as an AI-video generation route. Wan remains the primary generated B-roll route, LTX remains the fast preview/keyframe route, Mochi remains fallback/research, and Hunyuan remains premium gated/blocked pending legal and GPU review.

## Remaining Blockers

- No model loader import has run.
- No runtime mount has been created from the private cache.
- No vLLM, SGLang, Transformers, or CUDA runtime proof has run for this model.
- No inference, generated fixture, user-media fixture, beta, or production route is approved.
- Worker execution still needs approved snapshot, runtime owner, QA, billing, and GCP/GPU gate evidence.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_3: private Qwen2.5-VL model loader import gate, no inference`
