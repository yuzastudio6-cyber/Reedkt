# Activation Model License Evidence Policy

Model-weight approval must be evidence-based. Code/package licenses are useful
but do not approve model weights by themselves.

Each approved model record must include:

- source URL
- source type
- license claim
- commercial-use claim
- redistribution claim
- attribution or notice requirements
- review date
- confidence and notes

Conflicting evidence must be recorded, not hidden. Phase 26 records that
OpenAI Whisper GitHub says code and model weights are MIT, while the Hugging
Face `openai/whisper-tiny` metadata currently lists Apache-2.0. The direct
Phase 26 execution artifact is `Systran/faster-whisper-tiny`, whose Hugging
Face model card lists MIT.

MIT/Apache-style evidence can support narrow staging approval when the review
record preserves license notices and the scope remains private staging only.
Production, paid production, and external beta require separate approval.
