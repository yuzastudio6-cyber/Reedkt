# Production Container Readiness Runbook

Human-run order for M12 readiness:

1. Run static readiness with `npm.cmd run prod:readiness:summary`.
2. Review blockers and warnings in the unified report.
3. Build and verify `dist-server/server.js` plus `dist-server/container-readiness-receipt.js` from the exact release source.
4. Build production images manually in a later approved step and resolve each image to an immutable `name@sha256:digest` reference.
5. Record the exact source commit and tree hashes used by that build.
6. Run container readiness examples only after setting immutable image references, the exact source hashes, and `REEDITPRO_CONFIRM_CONTAINER_READINESS=true`.
7. Retain the emitted candidate receipt without treating it as production authority.
8. Independently verify the same source identity, immutable image digest, image role, runtime checks, forbidden-tool absence, and receipt integrity.
9. Review missing tools, source-install review items, FFmpeg/libass manual checks, and model-weight/license blockers.
10. Proceed to real execution milestones only after the canonical qualification and later deployed-release gates are cleared.

No deployment happens in this workflow. The scripts under `scripts/docker/prod/08-13-*.example.sh` are examples only, must not mount user source media, and emit non-promotable runtime candidates rather than production-ready claims.
