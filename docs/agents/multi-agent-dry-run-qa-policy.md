# Multi-Agent Dry-Run QA Policy

Mandatory QA gates:

- `phase52b_evidence`: Phase 52B canonical capability registry evidence is present.
- `agent_coverage`: all 12 Phase 52A specialist agents appear in dry-run findings.
- `scenario_coverage`: at least 6 deterministic scenarios and the required 11 intent candidates exist.
- `finding_schema_compliance`: findings satisfy the Phase 52A finding schema.
- `edit_intent_schema_compliance`: intents satisfy the Phase 52A edit-intent schema.
- `capability_gating`: VLM, Demucs, AI Tools runtime, and Track B blocked/runtime-gated requests are blocked.
- `producer_gate`: Producer allows only internal-testing candidate-plan-only intents.
- `qa_safety_gate`: QA/Safety verifies runtime absence and policy integrity.
- `source_of_truth_policy`: manifests/private `gs://` references remain source of truth.
- `supabase_milestone_sync`: confirmed execution writes and reads back exactly one Phase 52C milestone record.
- `blocked_features`: production, external beta, paid production, broad media, public artifacts, signed URL source-of-truth, raw prompt execution, providers, and direct tool execution remain blocked.

Phase52D readiness is ready only if every mandatory gate passes and the Supabase milestone sync completes.
