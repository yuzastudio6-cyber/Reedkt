# Production Readiness Blocker Policy

Hard blockers include missing required launch-core tools, missing or blocked model weights, non-commercial or unknown model-weight licenses, evaluation-only production execution, GPU tools assigned to non-GPU workers, Revideo production execution, signed URL source-of-truth violations, raw prompt execution paths, secrets in config/scripts, and missing approved-snapshot enforcement.

Warnings include optional tools missing, future-only tools not installed, OpenImageIO/OpenColorIO pending, FFmpeg LGPL commercial verification pending, libass pending manual verification, source-install review required, and host tools missing in static mode.

Workers execute approved plan snapshots and private artifact references. Raw chat, signed URLs, and evaluation-only tools cannot become production execution inputs.
