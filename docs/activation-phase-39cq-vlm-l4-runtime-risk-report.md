# Phase 39C-Q VLM L4 Runtime Risk Report

The original Phase 39C BF16 8B candidate remains blocked on L4 CUDA OOM during vLLM engine initialization. The recovery path lowers L4 risk by trying official Qwen candidates in a bounded order.

Run `phase39cq-20260531T235421` removed the original immediate OOM as the only known blocker for the recovery candidates: the FP8 8B, BF16 4B, and BF16 2B candidates all verified private model assets and entered generated fixture execution. The current recovery blocker is structured-output reliability, not private staging or checksum verification. Both executed L4 profiles for each candidate failed because vLLM outputs were not parseable as the required JSON schema.

Risk status: VLM remains blocked for Phase 39D. The next useful remediation is a narrow vLLM/Qwen structured-output follow-up, including guided decoding or stricter chat-template/output capture if supported, before any real-frame VLM attempt.

Risk notes:

- Candidate A uses official FP8 weights and requires vLLM; Transformers direct loading is recorded as unsupported by the model card.
- Candidate B and Candidate C reduce model size and capability relative to the original 8B BF16 model.
- Cloud Run L4 memory stays `32Gi`; larger memory was rejected for the approved `8` CPU L4 shape in Phase 39C.
- Runtime quality is not production-approved by generated fixtures alone.

If all candidates fail before inference, the exact next approval path should be one of:

- Different approved GPU class.
- Non-Qwen VLM candidate approval.
- Deeper vLLM bugfix only when logs identify a concrete remaining configuration fix.

Do not proceed to Phase 39D until generated runtime verification passes.
