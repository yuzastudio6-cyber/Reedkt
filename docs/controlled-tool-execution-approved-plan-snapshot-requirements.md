# Controlled Tool Execution Approved Plan Snapshot Requirements

Future controlled tool dry-runs must accept only `approved_plan_snapshot_v1` input. Raw prompts, provider responses, edit intents alone, plan snapshot candidates, and unapproved manifest refs fail closed. Any later real execution still needs separate worker/runtime approvals and credit/audit metadata.
