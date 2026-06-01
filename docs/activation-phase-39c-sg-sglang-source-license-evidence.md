# Phase 39C-SG SGLang Source And License Evidence

SGLang is evaluated as a runtime candidate only for deterministic generated VLM fixture verification.

Evidence:

- Source repository: `https://github.com/sgl-project/sglang`
- License evidence: `https://github.com/sgl-project/sglang/blob/main/LICENSE`
- Runtime package candidate: `sglang==0.4.10.post2`
- Qwen3-VL deployment evidence: `https://www.mintlify.com/QwenLM/Qwen3-VL/deployment/sglang`
- Structured-output evidence: `https://docs.sglang.ai/docs/advanced_features/structured_outputs`
- OpenAI-compatible API evidence: `https://docs.sglang.ai/docs/start/quick_start/openai_api_completions`

This evidence is enough to run a guarded staging evaluation. It is not production legal approval and does not unlock beta, production, public output, broad media, provider calls, or non-Qwen candidates.

If SGLang package install, Qwen3-VL serving, local model path serving, or structured-output behavior is unavailable in the runtime image, Phase 39C-SG must report a blocker and stop.
