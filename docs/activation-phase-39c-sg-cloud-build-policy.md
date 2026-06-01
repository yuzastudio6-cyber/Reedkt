# Phase 39C-SG Cloud Build Policy

Cloud Build is allowed in Phase 39C-SG-BUILD only to build the SGLang generated-fixture runtime image.

Required guards:

- `REEDITPRO_CONFIRM_VLM_SGLANG_BUILD_UNBLOCK=true`
- `REEDITPRO_CONFIRM_VLM_SGLANG_CLOUD_BUILD=true`
- `REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_PUSH=true`

Cloud Build supports two guarded configs:

- Full rebuild: `cloudbuild/vlm-sglang-runtime-phase39c.yaml`, using `docker/prod/vlm-sglang-runtime/Dockerfile`.
- Build-unblock overlay: `cloudbuild/vlm-sglang-runtime-phase39c-overlay.yaml`, using `docker/prod/vlm-sglang-runtime/Dockerfile.overlay`.

The overlay config is the default for Phase 39C-SG-BUILD after the full remote rebuild stalled during image publish/finalization. It reuses the prior private SGLang runtime image digest and copies only patched worker code. Both configs build `linux/amd64` and push only to the staging Artifact Registry path:

`us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-sglang:<run-id-or-commit>`

Cloud Build must not include model files, secrets, runtime caches, generated fixture payloads, or private logs in the build context.
