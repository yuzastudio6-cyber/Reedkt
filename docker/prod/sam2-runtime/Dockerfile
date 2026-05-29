# syntax=docker/dockerfile:1
#
# ReeditPro Phase 35C SAM2 runtime image.
# Dedicated to generated/synthetic SAM2 runtime verification only.
# It must not include model weights, providers, Revideo, FILM, slow motion, or secrets.

FROM node:24-bookworm AS node-runtime

FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS base
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
ENV HF_HUB_OFFLINE=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
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

COPY docker/prod/sam2-runtime/requirements.sam2.txt /tmp/requirements.sam2.txt
RUN python3 -m pip install --no-cache-dir --upgrade pip setuptools wheel
RUN python3 -m pip install --no-cache-dir -r /tmp/requirements.sam2.txt

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist-staging-sam2-runtime-worker ./dist-staging-sam2-runtime-worker
COPY docker/prod/sam2-runtime/sam2_runtime_local.py ./sam2-runtime/sam2_runtime_local.py

CMD ["node", "dist-staging-sam2-runtime-worker/staging-sam2-runtime-worker-cli.js"]
