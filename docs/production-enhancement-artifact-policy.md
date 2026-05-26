# Production Enhancement Artifact Policy

M15D enhancement artifacts are private worker artifacts. Supported records are `enhanced_video`, `representative_frame`, optional `preview_video` only when a safe local-dev preview actually runs, and `qa_report`.

Artifacts use storage refs as source of truth, never signed URLs. Source/proxy media are immutable, and no `final_export` artifact is created by M15D.

Sample reports live in `qa_report` metadata. M15D does not add new `enhanced_image` or `enhancement_sample_report` contract types.
