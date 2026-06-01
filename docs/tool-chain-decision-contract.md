# Tool Chain Decision Contract

Tool chain decisions must explain why a deterministic tool or chain is selected for an approved edit plan. Prompt 12 supports planning-only decision previews and blocks all execution.

## Decision Inputs

- Approved snapshot reference.
- Tool or tool-chain id.
- Reason the tool was selected.
- Input/output artifact types.
- Frame contract when visual output is involved.
- QA requirements required before preview/export.

## Decision Outputs

- `canPreviewDecision=true` for schema-only previews.
- `canValidateContext=true` for context-envelope validation.
- `canCreateIntent=false` until canonical persistence exists.
- `canExecuteTool=false` until a future worker/runtime milestone.
- Explicit blockers for missing backend runtime, catalog/profile records, credit gates, media readiness, storage records, job runtime, render records, and QA reports.

## Required Future Gates

Future executable tool calls must pass approved snapshot, credit estimate/reservation, project access, media readiness, private artifact path, job/worker, runtime availability, license/security, QA, audit, and export blocker gates.
