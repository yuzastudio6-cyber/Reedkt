# Production Container Readiness Runbook

Human-run order for M12 readiness:

1. Run static readiness with `npm.cmd run prod:readiness:summary`.
2. Review blockers and warnings in the unified report.
3. Use the production image scripts only from an exactly clean checkout. They derive the commit/tree, pass them into the image build, and the Dockerfiles build worker server artifacts from source inside the image.
4. Build production images manually in a later approved step and resolve each image to an immutable `name@sha256:digest` reference.
5. Retain the exact source commit/tree printed by the build script; do not type or substitute another identity.
6. Run container readiness examples only after setting immutable image references, the exact source hashes, and `REEDITPRO_CONFIRM_CONTAINER_READINESS=true`.
7. Retain the emitted candidate receipt without treating it as production authority.
8. Build the separate host verifier with `npm run build:container-readiness-host-verifier`, keep the candidate outside the checkout, and run `14-verify-container-readiness-candidate.example.sh` with explicit confirmation.
9. Retain the resulting local host receipt. It proves clean source/image binding only and is still not a production qualification.
10. Review missing tools, source-install review items, FFmpeg/libass manual checks, and model-weight/license blockers.
11. Proceed to real execution milestones only after the canonical qualification and later deployed-release gates are cleared.

No deployment happens in this workflow. The scripts under `scripts/docker/prod/08-14-*.example.sh` are examples only. Scripts 09-13 emit non-promotable runtime candidates; script 14 performs only bounded local Git and Docker image inspection and emits a non-promotable host verification receipt.
