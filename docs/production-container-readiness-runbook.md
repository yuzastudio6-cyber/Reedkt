# Production Container Readiness Runbook

Phase 21 of the activation roadmap handles container readiness reporting after Phase 20 human-run image builds. The Phase 21 helpers print command plans and parse local readiness logs; they do not run Docker readiness containers, build images, push images, deploy, download models, call providers, or process media.

Human-run order for M12 readiness:

1. Run static readiness with `npm.cmd run prod:readiness:summary`.
2. Review blockers and warnings in the unified report.
3. Build production images manually in a later approved step.
4. Run container readiness examples only after setting explicit image tags and `REEDITPRO_CONFIRM_CONTAINER_READINESS=true`.
5. Review missing tools, source-install review items, FFmpeg/libass manual checks, and model-weight/license blockers.
6. Proceed to real execution milestones only after readiness blockers are cleared.

No deployment happens in M12. The scripts under `scripts/docker/prod/08-13-*.example.sh` are examples only and must not mount user source media by default.

For activation, use `activation:container-readiness:plan` before any human readiness run and `activation:container-readiness:report` after logs are captured. Phase 22 staging foundation setup may proceed after report review, but Phase 23 image push remains blocked until required non-GPU build/readiness evidence is present.
