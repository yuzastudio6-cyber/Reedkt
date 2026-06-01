# Phase 39C-Q-SO2 vLLM Capability Introspection

SO2 records installed runtime behavior instead of relying on documentation alone. The worker writes `phase_39cq_so2_vllm_structured_output_capability_report.json` before candidate inference.

The report captures:

- Python version and executable path
- installed vLLM version and package path
- `StructuredOutputsParams` import and constructor signature
- legacy `GuidedDecodingParams` import and constructor signature
- xgrammar, guidance, outlines, and lm-format-enforcer availability
- `vllm.entrypoints.openai.api_server --help` structured-output related flags
- `vllm serve --help` structured-output related flags where the CLI exists
- localhost OpenAI-compatible model-list readiness during loopback tests
- unsupported feature exception class and safe message excerpts

Full logs are not committed. Committed reports may include safe excerpts, hashes, support status, and private GCS trace references only.
