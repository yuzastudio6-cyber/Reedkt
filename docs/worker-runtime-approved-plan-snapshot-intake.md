# Worker Runtime Approved Plan Snapshot Intake

Future worker runtime input must be `approved_plan_snapshot_v1` with source-of-truth refs, private artifact manifest refs, and a separate worker dry-run approval ref.

Raw prompts, provider responses, agent findings, edit intents, plan snapshot candidates, and tool-route metadata cannot execute workers directly. Runtime execution remains `false` in this audit phase.
