# Worker Runtime Dry-Run Queue Job Sidecar Policy

This approval phase performs no queue enqueue, job claim, job lease, worker process spawn, sidecar execution, subprocess execution, Docker, Cloud Run, or Cloud Build.

A later no-op dry-run execution phase may simulate enqueue, dispatch, claim, lease, and sidecar metadata only if separately approved.
