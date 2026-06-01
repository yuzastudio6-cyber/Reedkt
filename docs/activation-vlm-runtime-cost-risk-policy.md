# VLM Runtime Cost And GPU Risk Policy

Qwen3-VL 8B runtime has high memory risk and non-trivial GPU cost. Phase 39C approves only generated-fixture verification on an approved L4 path or a local GPU environment that can run the pinned private assets.

Unapproved GPU types, quantized variants, alternate model ids, provider fallbacks, and broad media retries are blocked. If vLLM fails because of GPU memory, runtime compatibility, or cost constraints, Phase 39C remains incomplete and the follow-up must be explicit: L4 feasibility review, runtime tuning, quantization approval, or model-size decision.
