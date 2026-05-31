# Phase 40A Pro Color/Image Approval Runbook

Phase 40A is a Track A static approval workflow for OpenColorIO, OpenImageIO,
and Kornia. It records official source/license evidence, tool ownership scope,
risk register entries, and future phase boundaries. It does not install runtime
dependencies, process images/video, build Docker images, mutate GCP, call
providers, create public outputs, use Revideo, or change package-lock.

Preferred base branch was
`origin/codex/rp-activation-38e-film-private-feature-e2e-readiness`. That
branch was unavailable after fetch, so this implementation is based on completed
Track A branch `origin/codex/rp-activation-38d-real-video-film-slowmotion-sample`.

## Commands

Run static checks:

```sh
npm run smoke:activation-pro-color-image-approval-workflow
npm run activation:pro-color-image-approval:plan
npm run activation:pro-color-image-approval:report
npm run activation:pro-color-tool:summary
```

Supporting Track A checks:

```sh
npm run activation:real-video:color-correction:report
npm run activation:sam2-feature-e2e:report
npm run activation:real-esrgan-policy-decision:report
npm run prod:readiness:summary
npm run prod:beta:summary
npm run lint
npm run build
npm run build:server
git diff --check
```

If `activation:film-feature-e2e:report` is unavailable because Phase 38E is not
present in the base, record that as the expected base fallback condition.

## Next Phase

Phase 40B may plan generated-fixture pro color/image runtime verification only.
Runtime installation, real-video processing, final delivery, public output,
providers, Revideo, production, external beta, paid production, and broad real
media remain blocked until later explicit phases.
