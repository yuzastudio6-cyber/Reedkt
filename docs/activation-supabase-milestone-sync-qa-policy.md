# Phase 51D Supabase Milestone Sync QA Policy

Mandatory QA gates:

- `phase51c_evidence`: Phase 51C canonical evidence proves historical backfill and Phase51D readiness.
- `sync_contract`: `ActivationMilestoneSyncInput` contains required identity, artifacts, QA, readiness, tool, feature-gate, and policy fields.
- `report_adapter`: report/direct-input adapter exists and does not invent success when optional fields are missing.
- `sanitizer_policy`: unsafe values and blocked feature unlocks are rejected before writes.
- `registry_schema_available`: the six Phase 51B registry tables are visible through zero-row probes.
- `single_self_sync_write`: exactly one Phase 51D self-sync bundle is written.
- `readback_verification`: the Phase 51D bundle reads back by `(phase_id, run_id)`.
- `artifact_policy`: only private `gs://` JSON artifacts are used as source of truth.
- `feature_gate_policy`: production, beta, broad media, public artifacts, signed URL truth, and raw prompt gates remain disabled.
- `secret_safety`: secret values are never persisted or exposed.
- `blocked_features`: migrations, backfill reruns, provider calls, product writes, public artifacts, and production/beta unlocks remain blocked.

Phase52A readiness is `ready_for_shared_agent_and_tool_ownership_architecture` only when all mandatory gates pass.
