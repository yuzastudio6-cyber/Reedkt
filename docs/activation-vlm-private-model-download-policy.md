# VLM Private Model Download Policy

VLM model downloads are allowed only in explicit download phases with current-shell confirmations. Phase 39B uses the VLM model download confirmation and the VLM private GCS upload confirmation in the same shell invocation as the guarded command.

The confirmations are not secrets, but they must not be committed or persisted globally. They unlock only the guarded Phase 39B command and do not authorize runtime inference, media processing, GPU execution, provider calls, public output, beta, production, or Track A work.

Downloaded payloads must stay outside the git worktree under `/tmp/reeditpro/activation/phase39b/qwen3-vl-8b-instruct/<run-id>/`. The Hugging Face token, if ever required, may be read only from the environment and must never be printed or written to reports. Phase 39B uses source/model-card metadata and file bytes only; it must not instantiate a model or call any inference API.
