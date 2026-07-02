# Production E2E Local Dev Runbook

Use `npm.cmd run prod:e2e:summary` for the default dry-run summary. It runs static/dry-run workflow validation only and does not process media.

Local-dev generated fixture mode is optional for future targeted checks. It may create tiny generated temp fixtures only when explicitly enabled, must skip unavailable tools, must clean up temp files in `finally`, and must never use arbitrary user media.

PowerShell users should run npm scripts through `npm.cmd`. This runbook does not require Docker, GPU hardware, provider credentials, model weights, `gcloud`, deployment, or Revideo.
