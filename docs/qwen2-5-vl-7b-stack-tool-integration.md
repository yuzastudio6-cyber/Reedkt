# Qwen2.5-VL 7B Stack Tool Integration

## Status

Decision: `qwen2_5_vl_7b_stack_tool_registered_no_inference`

This packet registers Qwen2.5-VL 7B Instruct as a planned ReeditPro stack tool for visual understanding, layout/OCR reasoning, chart/screen interpretation, and structured planning or QA signals. It does not make Qwen2.5-VL an AI video generation route, provider route, final render/export route, or raw prompt execution path.

No model weights downloaded, no dependency installed, no model import run, no inference run, no generated video created, no generated assets created, no provider calls made, no workers dispatched, no Supabase touched, no SQL executed, no GCP mutation created, no Docker run, no public artifacts created, no signed URLs created, no credits mutated, no beta unlocked, and no production unlocked.

## Official Source Baseline

- Model: [Qwen/Qwen2.5-VL-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct)
- Deployment reference: [Qwen vLLM deployment guide](https://qwen.readthedocs.io/en/stable/deployment/vllm.html)
- vLLM recipe: [Qwen2.5-VL Usage Guide](https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen2.5-VL.html)
- Google GPU target context: [Google Cloud GPU machine types](https://docs.cloud.google.com/compute/docs/gpus)
- GPU hardware context: [NVIDIA L4 Tensor Core GPU](https://www.nvidia.com/en-us/data-center/l4/)

The Hugging Face model card documents Qwen2.5-VL visual-token tuning with `min_pixels` and `max_pixels`, including a bounded token range for performance and cost. The Qwen deployment docs recommend vLLM as a supported deployment route, while noting CUDA dependency sensitivity. Google Cloud documents G2 machine types with NVIDIA L4 GPUs as cost-optimized for inference workloads, and NVIDIA describes L4 as a 24GB inference GPU.

## Repo Inspection Result

Existing ReeditPro surfaces already include:

- production tool registry profiles and fail-closed policy maps
- model-weight manifest templates
- GPU readiness dry-run import checks
- VLM runtime requirements with `vllm`, `transformers`, and `qwen-vl-utils`
- L4 tuning profiles for generated VLM fixtures
- AI-video generation routes for Wan, LTX, Mochi, and Hunyuan

The integration therefore reuses the existing registry/model-weight/GPU-readiness/VLM-runtime lanes instead of creating a duplicate provider gateway, duplicate worker family, or AI-video generation route.

## Product Role

Qwen2.5-VL is registered as `qwen_vl` for:

- generated fixture visual understanding
- controlled frame or keyframe interpretation
- object and layout analysis
- OCR-layout reasoning
- chart, screen, and UI reading support
- caption and overlay safe-zone planning signals
- structured JSON planning hints for approved edit plans

It is not registered for:

- AI B-roll generation
- final render or export
- raw chat or raw prompt worker execution
- provider transport or hosted fallback
- unbounded long-video analysis
- replacing deterministic OCR, charts, maps, captions, or final renderer logic where exact output matters

## GPU Choice

Selected first GPU target: `nvidia_l4` / Google Cloud G2, starting with the existing L4 VLM tuning envelope.

Why L4 first:

- Qwen2.5-VL 7B is a 7B VLM, so the first production-style proof should prioritize cost and bounded inputs instead of defaulting to A100/H100-class capacity.
- L4 provides 24GB GPU memory and is specifically positioned by Google Cloud for cost-optimized inference.
- The repo already has L4 VLM tuning profiles and generated-fixture policies, so this avoids a new GPU architecture lane.
- Visual-token tuning allows ReeditPro to cap image cost before escalating hardware.

Initial L4 envelope:

- one image or sampled frame per prompt
- `max_model_len` around 2048
- `max_num_seqs = 1`
- `max_num_batched_tokens` around 1024
- image max size around 384px, with 256px or 224px fallback for minimal smoke
- `gpu_memory_utilization` in the 0.82 to 0.92 range, depending on profile
- `enforce_eager = true` for conservative startup
- no model auto-download in worker execution

Escalation path:

- Use A10G, L40S, RTX PRO 6000-class, or A100-class GPUs only after L4 evidence shows bounded prompts cannot satisfy the accepted fixture or throughput target.
- Long-video, multi-frame, high-throughput, or production concurrency routes need a separate GPU owner review.

## Registry And Weight Gates

The stack tool integration adds:

- `qwen_vl` production tool ID
- visual-analysis profile with GPU worker scope
- QA policy for OCR overlap, caption safe zone, and render asset integrity
- fallback chain to Qwen retry, PaddleOCR, OpenCV, Remotion, and user review
- model-weight manifest template `qwen2_5_vl_7b_model`
- GPU readiness membership and optional `qwen-vl-utils` import declaration

The model-weight manifest requires:

- exact Qwen model revision
- checksum manifest
- approved private model path
- no auto-download guarantee
- model-weight owner acceptance
- GPU cost and quota acceptance
- worker/runtime owner acceptance
- QA, billing, and approved-snapshot evidence

## Runtime Boundary

Allowed now:

- registry metadata
- model-weight manifest placeholder
- dry-run readiness declarations
- docs and diagnostics

Blocked now:

- model download
- model import
- vLLM startup
- CUDA execution
- visual inference
- generated media
- provider calls
- worker dispatch
- Supabase mutation
- public artifacts
- signed URLs
- beta or production unlock

## Relationship To Wan/LTX/Mochi/Hunyuan

Qwen2.5-VL does not replace the AI B-roll generation model stack:

- Wan remains the primary generated B-roll model route.
- LTX remains the fast preview / image-to-video / keyframe secondary route.
- Mochi remains fallback/research.
- Hunyuan remains optional premium gated and blocked pending legal, territory, GPU, and commercial review.

Qwen2.5-VL supports analysis and planning around visuals, not motion generation.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_1: approve exact Qwen2.5-VL model revision and checksum plan, no inference`
