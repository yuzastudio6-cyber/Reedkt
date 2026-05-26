# Production Real Mask Execution Runbook

Modes:

- `dry_run`: validate inputs, build mask/text plans, artifacts, fallbacks, and QA without tools.
- `local_dev`: may run only explicitly enabled tools already installed with existing local weights and safe local paths; otherwise skip.
- `container_ready`: emit command/model/artifact plans only.
- `production_blocked`: refuse production mask/background execution.
- `production_ready`: remains gated by approved snapshot, idempotency, private refs, readiness, model-weight approval, and QA.

Do not download models, build Docker images, run GPU jobs, deploy, call providers, final render/export, or use Revideo in M15C.
