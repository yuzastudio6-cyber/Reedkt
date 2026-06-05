# Multi-Agent Dry-Run Policy

Phase 52C is evidence-only and candidate-plan-only.

The dry-run uses:

- Phase 52A specialist agent roles, schemas, routing policy, and source-of-truth rules.
- Phase 52B canonical 67-record tool capability registry.
- Existing committed evidence and optional confirmed Supabase capability readback.

Agents may emit structured findings and edit-intent candidates. Producer may allow only internal-testing-ready intents as `candidate_plan_only`. QA/Safety verifies that no runtime execution occurred and that source-of-truth rules remain intact.

Blocked in Phase 52C:

- direct agent-to-tool execution
- raw prompt execution
- tool or worker runtime execution
- AI model inference
- media processing
- web search or browser capture
- map rendering
- provider calls
- Docker, Cloud Run, migrations, schema changes, and historical backfill
- public artifacts, signed URLs as source of truth, production, external beta, paid production, and broad media

Known blocked candidates:

- `motion_graphics_lower_third`: routed to AI Tools; this chat cannot execute it.
- `noise_cleanup`: Track B owned; DeepFilterNet remains implemented-but-blocked in the Phase 52B registry for this dry-run.
- `qwen_vlm_visual_understanding_request`: VLM remains excluded after Phase 39C L4/vLLM CUDA OOM.
- `demucs_stem_separation_request`: Demucs remains blocked pending model provenance.
