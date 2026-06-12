# Model Orchestration Dry-Run Schema Contract

Approved future dry-run schemas:
- `agent_findings_v1`
- `edit_intents_v1`
- `plan_snapshot_candidate_v1`
- `blocker_classification_v1`
- `provider_fallback_assessment_v1`

Validation errors fail closed. Outputs must not execute workers, tools, routes, public artifacts, signed URLs, raw prompt forwarding, direct mutations, Supabase writes, production writes, external beta, or paid production.
