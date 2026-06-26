# AI Graphics GPU Model Package License Review

Decision: `ai_graphics_gpu_model_package_license_review_narrowed_with_model_weight_blocks`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This record narrows package/code license blockers for GPU/model AI graphics tools without approving model weights, provider/model execution, native GPU runtime execution, Tool Route execution, Worker execution, beta, or production.

## Reviewed Package/Code Surfaces

- `torch_torchvision`: PyTorch/TorchVision code is BSD-style. ReeditPro keeps CUDA wheel and transitive binary distribution constraints as review-required warnings.
- `transformers`: Transformers package is Apache-2.0. ReeditPro keeps model/source/runtime boundary review separate from the package license.
- `sam2`: SAM 2 repository license evidence is Apache-2.0 with font/demo caveats. ReeditPro keeps checkpoint/model manifest review and native GPU proof required.
- `birefnet`: BiRefNet code repository is MIT. ReeditPro keeps selected model-weight and model-card provenance review required.
- `real_esrgan`: Real-ESRGAN code is BSD-3-Clause. ReeditPro keeps selected model-weight review and artifact QA required.
- `transparent_background`: transparent-background package code is MIT. ReeditPro keeps InSPyReNet/model-cache weight review and native GPU proof required.

## Still Blocked Package/Profile Surface

- None after this narrowing. Runtime execution remains blocked by the shared beta gates, model-weight manifest evidence, native GPU runtime proof, Tool Route/Worker approval, approved snapshot, credit reservation, and artifact boundary requirements.

## Source Evidence

- PyTorch license: https://github.com/pytorch/pytorch/blob/main/LICENSE
- Transformers license: https://github.com/huggingface/transformers/blob/main/LICENSE
- SAM 2 repository/license statement: https://github.com/facebookresearch/sam2
- SAM 2 license file: https://github.com/facebookresearch/sam2/blob/main/LICENSE
- BiRefNet repository/license statement: https://github.com/ZhengPeng7/BiRefNet
- Real-ESRGAN license file: https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE
- Real-ESRGAN PyPI metadata: https://pypi.org/project/realesrgan/
- transparent-background license file: https://github.com/plemeri/transparent-background/blob/main/LICENSE
- transparent-background PyPI metadata: https://pypi.org/project/transparent-background/

## No-Scope

This review does not run tools, routes, workers, providers/models, browser/WebGL/canvas runtime, GPU/model runtime, model downloads, media processing, Supabase/GCS, signed URLs, public artifacts, internal beta, external beta, or production.
