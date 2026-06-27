# Production Readiness Blocker Policy

Hard blockers include missing required launch-core tools, missing or blocked model weights, non-commercial or unknown model-weight licenses, evaluation-only production execution, GPU tools assigned to non-GPU workers, Revideo production execution, signed URL source-of-truth violations, raw prompt execution paths, secrets in config/scripts, and missing approved-snapshot enforcement.

Warnings include optional tools missing, future-only tools not installed, OpenImageIO/OpenColorIO runtime/media approval pending, FFmpeg LGPL commercial verification pending, libass pending manual verification, source-install review required, and host tools missing in static mode.

Hard blockers must be actionable and evidence-driven. A blocker record should identify the exact missing proof or approval, preserve the safety gate it protects, and point to the next bounded source review, install proof, local execution proof, diagnostics packet, deployment proof, or QA packet that can retire it. Blocker labels must not be used as intentional blanket freezes for unrelated safe progress.

Blocked means "do not perform the unsafe action yet"; it does not mean "stop reducing the blocker." Safe metadata, source review, local-only proofs, diagnostics, mock-safe backend skeletons, deployment preflights, owner approvals, QA packets, and rollback plans should continue when they can shrink or retire a named blocker without claiming beta, production, billing, provider, Supabase, storage, or product readiness early.

Workers execute approved plan snapshots and private artifact references. Raw chat, signed URLs, and evaluation-only tools cannot become production execution inputs.
