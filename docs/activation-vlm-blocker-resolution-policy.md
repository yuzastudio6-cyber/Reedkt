# Phase 47B VLM Blocker Resolution Policy

Phase 47B resolves the Phase 47A VLM integration blocker by formal exclusion from initial internal system testing.

Allowed:

- Review Phase 47A Track integration evidence.
- Review Phase 39C VLM runtime blocker evidence.
- Record a private VLM exclusion manifest.
- Upload private JSON blocker, exclusion, readiness-impact, QA, and report artifacts.

Blocked:

- VLM runtime retry.
- New VLM model downloads.
- Smaller or quantized model substitution without a later explicit approval.
- Larger or different GPU class without a later explicit approval.
- Provider fallback.
- Real media, arbitrary media, or generated media processing.
- Docker build/push and Cloud Run deploy/execute.
- Public URLs, signed URLs as source of truth, production, external beta, paid production, broad real media, final delivery, and Revideo.

Decision:

- `vlmIncludedInInitialInternalTesting=false`
- `vlmUserFacingEnabled=false`
- `vlmRuntimeEnabled=false`
- `vlmFutureScoped=true`

The exact blocker is Phase 39C `Qwen/Qwen3-VL-8B-Instruct` on vLLM `0.11.0` and L4 failing during vLLM engine initialization with CUDA OOM before generated fixture inference.
