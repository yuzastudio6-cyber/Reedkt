# Production E2E Readiness Blocker Policy

The E2E readiness gate consumes the M12 static readiness report. Production-ready workflow mode remains blocked when required tools are missing, model weights are missing or blocked, manual/license reviews remain open, Revideo is requested, signed URLs appear, raw prompt execution fields appear, or upstream blocking QA exists.

Dry-run, static validation, and local-dev generated fixture modes may continue with warnings because they do not execute cloud jobs, providers, model downloads, or arbitrary media processing.

Current M16B production-ready scenarios are expected to block until future readiness, model-weight, and manual-review work is completed.
