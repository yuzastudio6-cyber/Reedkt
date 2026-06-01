# Phase 39C-Q-SO2 Offline StructuredOutputsParams

SO2 also probes offline vLLM structured output behavior from a local verified model directory.

Allowed offline strategies:

- `F1`: `StructuredOutputsParams(json=...)` or compatible guided JSON shim
- `F2`: `StructuredOutputsParams(grammar=...)` or compatible guided grammar shim
- `F3`: structural tag protocol only if the installed runtime supports the path and direct JSON validates
- `F4`: strict prompt diagnostic only, never pass-counting

The offline path must not use a Hugging Face model id, must not download at runtime, must not call providers, and must not accept arbitrary prompts or media paths.

If offline multimodal structured output is unsupported, the report must record the exception type/message and keep Phase 39D blocked unless another pass-counting SO2 strategy completes all generated fixture QA gates.
