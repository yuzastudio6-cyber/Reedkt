# Agent QA Policy

Mandatory Phase 52A gates:

- `agent_roles_defined`
- `tool_ownership_defined`
- `capability_manifest_schema`
- `agent_finding_schema`
- `edit_intent_schema`
- `approved_plan_snapshot_schema`
- `routing_policy`
- `source_of_truth_policy`
- `cross_track_handoff_template`
- `blocked_features`

Agent-generated plans must fail closed when evidence is missing, the owner route is ambiguous, a tool is outside the approved manifest scope, a secret would be exposed, public artifacts would become source of truth, raw prompt execution is attempted, or production/external beta/broad media would be unlocked.
