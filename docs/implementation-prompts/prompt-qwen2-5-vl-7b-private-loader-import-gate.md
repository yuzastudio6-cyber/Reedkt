# QWEN2_5_VL_STACK_TOOL_3: private Qwen2.5-VL model loader import gate, no inference

## Goal

Verify that the controlled private Qwen2.5-VL 7B cache can be used by a future model loader path without triggering runtime auto-downloads.

## Baseline

- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private cache evidence: `docs/qwen2-5-vl-7b-controlled-private-download-manifest.md`
- Typed manifest: `server/model-weights/qwen2-5-vl-controlled-private-download-manifest.ts`
- First GPU target: NVIDIA L4 / Google Cloud G2

## Allowed Future Scope

- Inspect local private cache metadata.
- Verify all required files are present and match the recorded SHA-256 values.
- Validate loader configuration points to a local path only.
- Import lightweight configuration/tokenizer/processor code only if the prompt explicitly allows it.
- Keep model inference disabled.

## Forbidden Actions

- Do not run inference.
- Do not generate images, video, captions, or assets.
- Do not start vLLM, SGLang, or an API server.
- Do not allow model-hub auto-download.
- Do not run broad user-media analysis.
- Do not call providers.
- Do not dispatch workers.
- Do not mutate GCP, Supabase, SQL, storage, credits, or billing.
- Do not create public artifacts or signed URLs.
- Do not unlock beta or production.

## Exit Criteria

- Loader path is local/private and points at the verified cache.
- Auto-download remains blocked.
- Import/runtime readiness is limited to a no-inference gate.
- Qwen remains ranked as visual understanding/planning/QA, not AI-video generation.

## Expected Outcome On Current Local Runtime

The current local Python runtime is expected to block before metadata import because `transformers`, `torch`, and `qwen_vl_utils` are not installed. That blocked result is acceptable for this prompt as long as the private cache is checksum-verified, auto-download remains disabled, and no inference or runtime server starts.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_4: controlled Qwen2.5-VL runtime dependency install plan, no inference`
