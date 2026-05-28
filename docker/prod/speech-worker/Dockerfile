# syntax=docker/dockerfile:1
#
# ReeditPro Phase 27A CPU speech runtime image.
# This image verifies the approved faster-whisper tiny model from private GCS.
# It must not include GPU packages, model weights, provider secrets, or Revideo.

FROM node:24-bookworm AS base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=staging_speech_runtime
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HUB_OFFLINE=1
ENV TRANSFORMERS_OFFLINE=1
ENV MODEL_DOWNLOADS_ENABLED=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    ffmpeg \
    python3 \
    python3-pip \
    python3-setuptools \
  && rm -rf /var/lib/apt/lists/*

COPY docker/prod/speech-worker/requirements.speech.txt /tmp/requirements.speech.txt
RUN python3 -m pip install --no-cache-dir --break-system-packages -r /tmp/requirements.speech.txt

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist-staging-speech-runtime-worker ./dist-staging-speech-runtime-worker
COPY docker/prod/speech-worker/faster_whisper_local.py ./speech-runtime/faster_whisper_local.py

CMD ["node", "dist-staging-speech-runtime-worker/staging-speech-runtime-worker-cli.js"]
