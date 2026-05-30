# ReeditPro Phase 35D SAM2 runtime image.
# Extends the approved Phase 35C runtime for one approved bounded real-video sample only.
# It must not include model weights, providers, Revideo, FILM, slow motion, or secrets.

FROM us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime@sha256:d40444269ba867dfae4ef09da803a67870bc03b381e41359e482eeed3ab381c9 AS base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=staging_sam2_runtime
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV SAM2_BUILD_CUDA=0
ENV MODEL_DOWNLOADS_ENABLED=false
ENV PROVIDER_EXECUTION_ENABLED=false
ENV REAL_MEDIA_INPUT_ENABLED=false
ENV FULL_VIDEO_MASK_ENABLED=false
ENV TEXT_BEHIND_SUBJECT_VIDEO_ENABLED=false
ENV HF_HUB_OFFLINE=1

RUN if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then \
    apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*; \
  fi

COPY dist-staging-sam2-runtime-worker ./dist-staging-sam2-runtime-worker
COPY docker/prod/sam2-runtime/sam2_runtime_local.py ./sam2-runtime/sam2_runtime_local.py
COPY docker/prod/sam2-runtime/sam2_real_video_temporal.py ./sam2-runtime/sam2_real_video_temporal.py
COPY docker/prod/sam2-runtime/sam2_feature_e2e.py ./sam2-runtime/sam2_feature_e2e.py

CMD ["node", "dist-staging-sam2-runtime-worker/staging-sam2-runtime-worker-cli.js"]
