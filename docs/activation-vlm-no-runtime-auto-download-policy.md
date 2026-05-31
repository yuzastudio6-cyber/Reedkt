# VLM No Runtime Auto-Download Policy

Phase 39B exists so later VLM runtime phases do not rely on runtime downloads. Phase 39C must use a local model directory copied from verified private GCS objects and must verify SHA256 before starting any runtime.

Future runtime commands must not pass `Qwen/Qwen3-VL-8B-Instruct` as a model id to vLLM or Transformers when that could trigger external Hugging Face or ModelScope downloads. Runtime code must fail closed if a required file is missing locally or if any network/model-download attempt occurs during initialization or inference.

This policy is a blocker for generated VLM fixtures, controlled real-frame VLM, and structured VLM planning integration. No exception is approved for provider calls, public endpoints, signed URLs, or automatic cache population.
