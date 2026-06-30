# Production Container Readiness Runbook

Human-run order for M12 readiness:

1. Run static readiness with `npm run prod:readiness:summary`.
2. Review blockers and warnings in the unified report.
3. Build production images manually in a later approved step.
4. Run container readiness examples only after setting explicit image tags and `REEDITPRO_CONFIRM_CONTAINER_READINESS=true`.
5. Review missing tools, source-install review items, FFmpeg/libass manual checks, and model-weight/license blockers.
6. Proceed to real execution milestones only after readiness blockers are cleared.

No deployment happens in M12. The scripts under `scripts/docker/prod/08-13-*.example.sh` are examples only and must not mount user source media by default.
