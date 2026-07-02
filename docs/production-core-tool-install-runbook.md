# Production Core Tool Install Runbook

Milestone 10 is human-run image preparation only. Codex does not build images or deploy workers.

## Human Setup Order

1. Inspect `docker/prod/*/Dockerfile` and requirements files.
2. Choose a non-placeholder image tag.
3. Build CPU, render, QA, and tool-readiness images later with the existing Docker build templates.
4. Run dry-run readiness first.
5. Run optional CPU/render real check mode inside a reviewed image.
6. Review FFmpeg LGPL build status and libass subtitle support.
7. Push images only after review.
8. Deploy only in a later milestone.

## Local Smoke Behavior

`npm.cmd run smoke:prod-core-tool-install` validates declarations and may report local command/import availability. Missing local tools do not fail unless a future strict mode is explicitly enabled.
