# Activation Container Build Report Policy

The Phase 20 container build report records planned images, static Docker command text, optional human-provided build log evidence, blockers, warnings, and Phase 21 readiness.

## Report Fields

- `imagePlans`: the six production image plans in build order.
- `commandPlans`: Docker build command strings for humans to review and run later.
- `buildResults`: parsed evidence from optional local build logs, or planned/not-run state by default.
- `blockers`: conditions that prevent Phase 21 readiness.
- `warnings`: review items that do not automatically block non-GPU preparation.
- `phase21Readiness`: whether required non-GPU images have passing build evidence and which optional images are deferred.

## Build Result Statuses

- `not_run`: no execution happened.
- `planned`: build is planned but no human build evidence exists.
- `passed`: log evidence indicates a successful build.
- `failed`: log evidence indicates a failed build.
- `warning`: log evidence passed but contains warnings.
- `skipped`: image was intentionally skipped by policy.
- `blocked`: log evidence contains forbidden behavior or cannot be trusted.

## Blockers And Warnings

Blockers include missing required image evidence, failed builds, missing Dockerfiles, invalid image tags, forbidden Dockerfile/log content, Revideo installs, model downloads, provider calls, `gcloud`/deploy signals, real media processing, GPU/model packages in non-GPU images, RTX PRO 6000 default usage, and unexpected `package-lock.json` changes.

Warnings include GPU image deferral, image-size concerns, FFmpeg LGPL manual review, libass verification, optional tool gaps, and local Docker environment issues.

## Production State

Every Phase 20 report keeps production blocked:

- `dockerBuildExecuted=false`
- `dockerPushExecuted=false`
- `gcloudExecuted=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `realUserMediaTestingAllowed=false`

Phase 20 build reports feed Phase 21 container readiness reports. Phase 21 consumes human build evidence plus readiness logs, but it still does not run Docker or approve production.
