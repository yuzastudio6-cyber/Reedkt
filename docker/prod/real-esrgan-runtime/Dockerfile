# syntax=docker/dockerfile:1
#
# ReeditPro Phase 34C Real-ESRGAN runtime image.
# Dedicated to generated-image RealESRGAN_x4plus runtime verification only.
# It must not include model weights, FILM, provider SDK execution paths, Revideo, or secrets.

FROM node:24-bookworm AS node-runtime

FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=staging_real_esrgan_runtime
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MODEL_DOWNLOADS_ENABLED=false
ENV PROVIDER_EXECUTION_ENABLED=false
ENV REAL_ESRGAN_FACE_ENHANCE=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    python3 \
    python3-pip \
    python3-setuptools \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    libjpeg-turbo8 \
    libpng16-16 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
  && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

COPY docker/prod/real-esrgan-runtime/requirements.real-esrgan.txt /tmp/requirements.real-esrgan.txt
RUN python3 -m pip install --no-cache-dir --upgrade pip setuptools wheel
RUN python3 -m pip install --no-cache-dir -r /tmp/requirements.real-esrgan.txt

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist-staging-real-esrgan-runtime-worker ./dist-staging-real-esrgan-runtime-worker
COPY docker/prod/real-esrgan-runtime/real_esrgan_local.py ./real-esrgan-runtime/real_esrgan_local.py

CMD ["node", "dist-staging-real-esrgan-runtime-worker/staging-real-esrgan-runtime-worker-cli.js"]
