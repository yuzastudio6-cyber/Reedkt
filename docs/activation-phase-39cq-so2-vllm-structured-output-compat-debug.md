# Phase 39C-Q-SO2 vLLM Structured Output Compatibility Debug

Phase 39C-Q-SO2 is a Track B only VLM recovery step after PR #90. It does not create a new model approval path. It reuses only the official Qwen candidates already staged and verified by PR #87:

- `Qwen/Qwen3-VL-8B-Instruct-FP8`
- `Qwen/Qwen3-VL-4B-Instruct`
- `Qwen/Qwen3-VL-2B-Instruct`

The purpose is to prove whether the installed vLLM runtime can enforce direct JSON outputs before full generated fixture QA. The runtime order is C, then B, then A for fast diagnostics, while final selection priority remains A, then B, then C.

Required gates:

- copy exact private PR #87 model objects by manifest path
- verify per-file SHA-256 and aggregate hash
- use a local verified model path only
- keep `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1`
- introspect installed vLLM structured-output capabilities inside the Cloud Run image
- pass text-only T0/T1/T2 structured-output probes
- run generated image fixtures only after text-only proof
- validate direct JSON without posthoc repair
- pass object-region, safe-zone, and hallucination/safety QA
- upload private JSON artifacts only to `activation/phase39c/generated-vlm-structured-output-compat/<run-id>/`

Blocked scopes remain: Phase 39D, Phase 39E, provider calls, real media, arbitrary media, public output, production, beta, non-Qwen candidates, community quantizations, unapproved GPU types, and Track A.
