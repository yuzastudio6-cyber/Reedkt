# ReeditPro Phase 40B pro color/image generated-fixture runtime image.
# CPU-only, generated fixtures only. No model weights, providers, Revideo, real media, or secrets are baked in.

FROM node:24-bookworm
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=staging_pro_color_image_runtime
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MODEL_DOWNLOADS_ENABLED=false
ENV PROVIDER_EXECUTION_ENABLED=false
ENV REAL_MEDIA_INPUT_ENABLED=false
ENV REVIDEO_ENABLED=false
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir --break-system-packages --only-binary=:all: numpy==1.26.4 pillow==10.4.0 \
  && (python3 -m pip install --no-cache-dir --break-system-packages --only-binary=:all: opencolorio==2.4.2 || true) \
  && (python3 -m pip install --no-cache-dir --break-system-packages --only-binary=:all: OpenImageIO==3.0.18.1 || true) \
  && (python3 -m pip install --no-cache-dir --break-system-packages --only-binary=:all: --index-url https://download.pytorch.org/whl/cpu torch==2.7.1 \
    && python3 -m pip install --no-cache-dir --break-system-packages --only-binary=:all: --no-deps kornia==0.8.1 || true)

COPY dist-staging-pro-color-image-runtime-worker ./dist-staging-pro-color-image-runtime-worker
COPY docker/prod/pro-color-image-runtime/pro_color_image_runtime_local.py ./pro_color_image_runtime_local.py

CMD ["node", "dist-staging-pro-color-image-runtime-worker/staging-pro-color-image-runtime-worker-cli.js"]
