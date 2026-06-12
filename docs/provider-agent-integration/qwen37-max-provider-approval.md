# Qwen3.7-Max Provider Approval

PROVIDER-1 records Alibaba Model Studio / Qwen official evidence for:

- `qwen3.7-max`
- `qwen3.7-max-2026-06-08`
- `qwen3.7-max-2026-05-20`
- OpenAI-compatible Qwen API support through DashScope / Model Studio
- `DASHSCOPE_API_KEY` semantics
- non-thinking and thinking modes
- thinking mode on by default according to model update docs
- text-only input
- explicit cache support
- 0<Token<=1M pricing band
- Qwen Max flagship model role

Qwen3.7-Max is approved only as a future head editing/planning/decision agent
candidate. It may produce structured findings, edit intents, professional edit
scoring, tool route requests, and blocked decision summaries.

Qwen must not execute workers, call tools directly, execute raw prompts, chain
providers directly, patch code, handle secrets, or ingest private media without
a later approved policy.
