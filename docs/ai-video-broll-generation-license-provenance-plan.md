# AI Video B-roll Generation License / Provenance Plan

Status: `ai_video_broll_gen_0_license_provenance_plan_no_execution`

Gate 0 does not approve any model for beta or production. It records review requirements only. No model weights are downloaded, no model call is made, and no generated video is created.

| Model | Code license working note | Weight license status | Source repository | Weight source | Commercial use risk | Geographic restrictions | Attribution/notice needs | Redistribution risk | Model-output policy | Legal/compliance gate | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Wan / Wan2.1 | Official repo lists Apache-2.0; verify exact license snapshot | Needs separate model card and weight review | https://github.com/Wan-Video/Wan2.1 | Official linked Hugging Face and ModelScope sources | Medium until weight license and model card are reviewed | Unknown; verify license and model card | Apache/code notices plus model-card notices if required | Unknown until weight redistribution terms reviewed | Generated outputs require provenance/watermark/disclosure policy | `COMPLIANCE_SECURITY`, `PROVIDER_GATEWAY_MODELS`, `AI_VIDEO_BROLL_GENERATION` | needs review |
| LTX-Video | Official repo lists Apache-2.0; verify exact license snapshot | Needs separate model card and weight review | https://github.com/Lightricks/ltx-video | https://huggingface.co/Lightricks/LTX-Video | Medium until model card, weights, and dataset provenance are reviewed | Unknown; verify model card | Apache/code notices plus model-card notices if required | Unknown until weight terms reviewed | Generated outputs require provenance/watermark/disclosure policy | `COMPLIANCE_SECURITY`, `PROVIDER_GATEWAY_MODELS`, `AI_VIDEO_BROLL_GENERATION` | needs review |
| Mochi 1 | Official repo states permissive Apache-2.0 release; verify exact license snapshot | Needs separate direct/Hugging Face weight review | https://github.com/genmoai/mochi | Direct download and Hugging Face links from official repo | Medium until weight source and output policy are reviewed | Unknown; verify model card | Apache notices plus any weight/model-card notices | Unknown until direct/Hugging Face terms reviewed | Generated outputs require provenance/watermark/disclosure policy | `COMPLIANCE_SECURITY`, `PROVIDER_GATEWAY_MODELS`, `AI_VIDEO_BROLL_GENERATION` | needs review |
| HunyuanVideo | Custom Tencent Hunyuan license; not treated as permissive | Needs strict model weight and territory review | https://github.com/Tencent-Hunyuan/HunyuanVideo | Official linked Hugging Face weights | High until legal approval; premium gated only | License text includes territory limitations; legal review required | Tencent license, attribution, and powered-by style requirements may apply | High until redistribution and territory terms are accepted | Generated outputs require provenance/watermark/disclosure policy and legal signoff | `COMPLIANCE_SECURITY`, `PROVIDER_GATEWAY_MODELS`, `AI_VIDEO_BROLL_GENERATION` | blocked until review |

## Required Evidence Before Approval

- Repository URL and commit/tag.
- License file snapshot.
- Model card snapshot.
- Weight source URL and version.
- Checksum plan.
- Commercial-use finding.
- Redistribution and cache policy finding.
- Attribution/notice requirements.
- Output policy and safety disclosure.
- Owner acceptance from compliance/security, provider gateway, worker runtime, storage, billing, and beta readiness owners.

## Gate 0 Result

All models are `needs review` or blocked. No model is beta-approved, runtime-approved, production-approved, or available to users.
