# syntax=docker/dockerfile:1
#
# ReeditPro Phase 33C BiRefNet runtime image.
# Dedicated to generated-image BiRefNet runtime verification only.
# It must not include model weights, SAM2, providers, Revideo, or secrets.

FROM node:24-bookworm AS node-runtime

FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=staging_birefnet_runtime
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HUB_OFFLINE=1
ENV TRANSFORMERS_OFFLINE=1
ENV HF_DATASETS_OFFLINE=1
ENV MODEL_DOWNLOADS_ENABLED=false

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
  && rm -rf /var/lib/apt/lists/*

COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
  && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

COPY docker/prod/birefnet-runtime/requirements.birefnet.txt /tmp/requirements.birefnet.txt
RUN python3 -m pip install --no-cache-dir -r /tmp/requirements.birefnet.txt
COPY docker/prod/ai-graphics-gpu-install-smoke.py /tmp/ai-graphics-gpu-install-smoke.py
RUN python3 /tmp/ai-graphics-gpu-install-smoke.py --profile birefnet

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist-staging-birefnet-runtime-worker ./dist-staging-birefnet-runtime-worker
COPY docker/prod/birefnet-runtime/birefnet_local.py ./birefnet-runtime/birefnet_local.py

CMD ["node", "dist-staging-birefnet-runtime-worker/staging-birefnet-runtime-worker-cli.js"]
