# VLM Runtime Policy

Phase 39C is the first runtime phase for Qwen3-VL and is limited to generated synthetic fixtures. Runtime execution must use the verified Phase 39B private model assets and must verify checksums before model initialization.

The runtime must use a local model directory, not `Qwen/Qwen3-VL-8B-Instruct`, when starting vLLM or any fallback. Any missing file, checksum mismatch, runtime auto-download attempt, provider call, raw prompt, real media input, public output, or unapproved GPU path blocks the phase.

Phase 39C does not approve controlled real-frame VLM, structured planning integration, beta, production, or broad user media.
