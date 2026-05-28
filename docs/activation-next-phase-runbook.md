# Activation Next Phase Runbook

This runbook starts after Phase 18 is reviewed and Phase 19 local baseline is available. It does not build images, deploy services, run `gcloud`, call providers, download models, add secrets, or process real media.

## After Phase 18

1. Review the Phase 18 audit, readiness state, and activation roadmap.
2. Confirm production-ready, external beta, paid production, and real user media remain blocked.
3. Merge the Phase 18 branch only after the activation smoke and existing production baseline checks pass.
4. Run Phase 19 local full smoke/static readiness baseline.
5. Review every failure, warning, and existing large-bundle build warning before moving on.
6. Proceed to container build only after Phase 19 passes and a human approves image names/tags.

## After Phase 19

1. Review `activation:local-baseline` static output and `--command-plan` output.
2. Confirm the report says Phase 20 is preparation-only and `dockerBuildAllowed=false`.
3. Resolve or document local baseline blockers and warnings.
4. Prepare Phase 20 image names/tags for human review.
5. Do not run Docker automatically from the local baseline command.

## After Phase 20

1. Review `activation:container-build:plan -- --image-tag <tag>` output.
2. Confirm image order is API, tool-readiness, CPU, QA, render, then GPU.
3. Humans may run the printed Docker build commands manually after approving image tags.
4. Capture human build logs and parse them with `activation:container-build:report`.
5. Proceed to Phase 21 only after required non-GPU image build evidence passes; GPU may remain deferred until GPU activation.

## Before Container Build

- Confirm Docker scripts remain examples/human-run only.
- Confirm no npm script auto-builds or pushes production images.
- Confirm no GCP script is invoked by package scripts.
- Confirm Revideo remains evaluation-only and production-blocked.
- Confirm model/license blockers remain active until the Phase 26 approval workflow.

Phase 20 container build reporting is the next activation step after Phase 19. Actual Docker builds remain human-run and not automatic.
