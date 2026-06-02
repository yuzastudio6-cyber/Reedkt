# Phase 39C VLM Decision Web Research

Accessed on: 2026-06-02

## vLLM supported models: Qwen3VLForConditionalGeneration

Source: https://docs.vllm.ai/en/v0.21.0/models/supported_models/

Evidence: vLLM lists Qwen3VLForConditionalGeneration with text, image, and video support examples including Qwen/Qwen3-VL-4B-Instruct.

Decision impact: Supports keeping vLLM as a plausible runtime in principle, but repo evidence shows current Qwen/vLLM/L4 outputs fail semantic QA.

## vLLM structured outputs

Source: https://docs.vllm.ai/en/latest/features/structured_outputs/

Evidence: vLLM documents response_format json_schema and structured_outputs grammar usage.

Decision impact: Explains why text-only schema conformance can pass while image perception quality still fails separately.

## Qwen vLLM deployment guidance

Source: https://github.com/QwenLM/Qwen3/blob/main/docs/source/deployment/vllm.md

Evidence: Qwen documents passing chat_template_kwargs enable_thinking=false and notes compatibility caveats around thinking/reasoning parser behavior.

Decision impact: Supports the no-thinking configuration used in structured-output retries but does not guarantee visual localization quality.

## SGLang Qwen3-VL usage

Source: https://docs.sglang.io/docs/basic_usage/qwen3_vl

Evidence: SGLang states it supports the Qwen3-VL family with image and video input support and provides launch/request examples.

Decision impact: Supports SGLang as a plausible alternate runtime, but repo import-smoke evidence blocks Cloud Run L4 inference.

## SGLang structured outputs

Source: https://docs.sglang.io/docs/advanced_features/structured_outputs

Evidence: SGLang supports JSON schema, regex, EBNF, and structural tags, with XGrammar as the default backend.

Decision impact: Structured outputs remain valuable for formatting once perception/runtime passes, but they are not a substitute for semantic QA.

## SGLang issue #8432: undefined symbol cuGreenCtxDestroy

Source: https://github.com/sgl-project/sglang/issues/8432

Evidence: Upstream issue records a cuGreenCtxDestroy unresolved-symbol failure and links to PR #9021.

Decision impact: Matches the ReeditPro Cloud Run L4 SGLang import failure class.

## SGLang issue #8566: sgl_kernel common_ops undefined symbol

Source: https://github.com/sgl-project/sglang/issues/8566

Evidence: Upstream issue records ImportError for sgl_kernel/common_ops.abi3.so with cuGreenCtxDestroy.

Decision impact: Confirms the failure is a known SGLang/kernel/CUDA compatibility class, not a ReeditPro model-staging defect.

## SGLang PR #9021

Source: https://github.com/sgl-project/sglang/pull/9021

Evidence: Merged PR adds runtime CUDA-driver checks to avoid unresolved green-context symbols.

Decision impact: Supports the fixed-kernel investigation but PR #115 shows tested profiles still did not pass ReeditPro Cloud Run L4 import smoke.

## SGLang PR #9231

Source: https://github.com/sgl-project/sglang/pull/9231

Evidence: Merged upstream work made green-context spatial ops optional/lazy per prior Phase 39C-SG-FIXED evidence.

Decision impact: Potentially relevant to future source-build or package refresh paths, but not enough to justify another blind retry.

## Google Cloud Run jobs with GPUs

Source: https://docs.cloud.google.com/run/docs/configuring/jobs/gpu

Evidence: Cloud Run jobs support L4 GPUs with 535.x.x / CUDA 12.2 driver libraries under /usr/local/nvidia/lib64 and separate RTX PRO 6000 Blackwell GPUs with newer driver requirements.

Decision impact: Explains the CUDA-driver ABI constraint and why different GPU/runtime environments require explicit approval.

## OpenCV structural analysis and shape descriptors

Source: https://docs.opencv.org/4.x/d3/dc0/group__imgproc__shape.html

Evidence: OpenCV provides connected components, contours, bounding rectangles, and shape-analysis primitives.

Decision impact: Supports deterministic geometry and safe-zone extraction for Phase 46A media/data hardening.

## PyAV documentation

Source: https://pyav.org/docs/stable/

Evidence: PyAV is a Pythonic binding around FFmpeg libraries for media container/frame access.

Decision impact: Supports a deterministic frame/metadata extraction route that does not depend on VLM perception.

## PySceneDetect documentation

Source: https://www.scenedetect.com/

Evidence: PySceneDetect provides scene detection and video-splitting workflows.

Decision impact: Supports Phase 46A segmentation/fixture-handoff planning without VLM runtime retries.

## DuckDB Python and Polars integration

Source: https://duckdb.org/docs/stable/guides/python/polars

Evidence: DuckDB and Polars can interoperate for tabular analytics workflows.

Decision impact: Supports deterministic QA/report aggregation for media/data readiness.

## Polars user guide

Source: https://docs.pola.rs/

Evidence: Polars provides a DataFrame engine for structured data analysis.

Decision impact: Supports fast local metrics/report processing in the Phase 46A handoff.

## Conflicts

- Official vLLM and SGLang docs indicate Qwen3-VL runtime support, but ReeditPro evidence shows the approved L4 deployments still fail either semantic QA under vLLM or import-smoke under SGLang.
- Structured-output docs promise constrained format, but they do not promise correct visual labels, localization, or safe-zone decisions.
