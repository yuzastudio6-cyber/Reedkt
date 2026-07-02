# Production Real Smart Cut Execution

Milestone 14 turns the Milestone 8 `SmartCutPlan` into a controlled execution plan. It validates keep/remove ranges, protected segments, repeated-take safety, word-boundary safety, and source immutability before any local-dev preview can run.

Outputs:

- `SmartCutExecutionPlan` with keep, trim, concat, and preview-only operations.
- allowlisted FFmpeg command plans for proxy trim/concat.
- updated timeline manifests and bridge metadata.
- cut and timeline QA gates.
- optional local-dev proxy preview artifacts.

This milestone does not final export, full render, deploy, run GPU tools, call providers, perform audio cleanup, color, masks, or overwrite source media. Workers execute approved snapshots and structured artifact refs, not raw chat.

M16A final render/export consumes the timeline and OTIO/Remotion handoff metadata created by M14 as private render inputs, then re-checks timeline integrity before preview/final delivery.
