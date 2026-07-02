# Production Slow Motion Artifact Policy

M15D slow-motion artifacts are private `interpolated_video`, optional `preview_video`, and `qa_report` records.

Slow motion is selected-clip only. Audio handoff, final mux, and delivery packaging remain future M16 render/export responsibilities.

Artifacts never overwrite source/proxy media, never use signed URLs as source of truth, and never represent final delivery in M15D.
