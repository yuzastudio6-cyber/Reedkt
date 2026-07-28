# syntax=docker/dockerfile:1
#
# ReeditPro production GPU AI worker image definition.
# The image remains an unqualified build candidate and must not be pushed,
# deployed, or used with customer media until the production evidence gates pass.
#
# First Cloud Run GPU target: NVIDIA L4 (`nvidia-l4`), one GPU per instance, at least
# 4 CPU and 16Gi memory, with --no-gpu-zonal-redundancy.

FROM node:24-bookworm AS server_build
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server

FROM nvidia/cuda:12.3.2-cudnn9-runtime-ubuntu22.04@sha256:fa44193567d1908f7ca1f3abf8623ce9c63bc8cba7bcfdb32702eb04d326f7a8 AS gpu_runtime_foundation
WORKDIR /app

ARG REEDITPRO_SOURCE_COMMIT_SHA
ARG REEDITPRO_SOURCE_TREE_HASH
ARG REEDITPRO_SOURCE_CLEAN
RUN printf '%s' "${REEDITPRO_SOURCE_COMMIT_SHA}" | grep -Eq '^[a-f0-9]{40}$' \
  && printf '%s' "${REEDITPRO_SOURCE_TREE_HASH}" | grep -Eq '^[a-f0-9]{40}$' \
  && test "${REEDITPRO_SOURCE_CLEAN}" = "true"
LABEL org.opencontainers.image.revision="${REEDITPRO_SOURCE_COMMIT_SHA}" \
  io.reeditpro.source.tree="${REEDITPRO_SOURCE_TREE_HASH}" \
  io.reeditpro.image.role="gpu_worker" \
  io.reeditpro.build.source.clean="${REEDITPRO_SOURCE_CLEAN}" \
  io.reeditpro.container.qualification.candidate.version="production-container-qualification-candidate-v1"

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=gpu_ai_worker
ENV REEDITPRO_MODEL_WEIGHT_DIR=/opt/reeditpro/model-weights
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HUB_OFFLINE=1
ENV TRANSFORMERS_OFFLINE=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    python3-pip \
    python3-venv \
    libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY docker/prod/gpu-worker/faster-whisper \
  /opt/reeditpro/gpu-operations/faster-whisper
RUN python3 -m venv \
    /opt/reeditpro/gpu-operations/faster-whisper/venv \
  && /opt/reeditpro/gpu-operations/faster-whisper/venv/bin/pip \
    install \
    --disable-pip-version-check \
    --no-cache-dir \
    --require-hashes \
    -r /opt/reeditpro/gpu-operations/faster-whisper/requirements.lock.txt \
  && chmod 0555 \
    /opt/reeditpro/gpu-operations/faster-whisper/runner.py \
  && chmod 0444 \
    /opt/reeditpro/gpu-operations/faster-whisper/requirements.lock.txt \
    /opt/reeditpro/gpu-operations/faster-whisper/source-provenance.lock

RUN mkdir -p \
    /opt/reeditpro/model-weights/faster-whisper \
    /opt/reeditpro/model-weights/birefnet \
    /opt/reeditpro/model-weights/sam2 \
    /opt/reeditpro/model-weights/deepfilternet \
    /opt/reeditpro/model-weights/demucs \
    /opt/reeditpro/model-weights/real-esrgan \
    /opt/reeditpro/model-weights/film \
    /opt/reeditpro/model-weights/paddleocr \
  && printf '%s\n' \
    'Model-weight directories are intentionally empty in the build candidate.' \
    'Runtime mounts/manifests must provide reviewed weights after qualification.' \
    > /opt/reeditpro/model-weights/README.txt

FROM gpu_runtime_foundation AS faster_whisper_runtime_build_candidate
RUN test -x \
    /opt/reeditpro/gpu-operations/faster-whisper/venv/bin/python \
  && test -x \
    /opt/reeditpro/gpu-operations/faster-whisper/runner.py \
  && /opt/reeditpro/gpu-operations/faster-whisper/venv/bin/python \
    -I \
    -B \
    -c "import importlib.metadata as m; import ctranslate2; assert m.version('faster-whisper') == '1.2.1'; assert m.version('ctranslate2') == '4.6.2'; assert ctranslate2.__version__ == '4.6.2'"

FROM gpu_runtime_foundation AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    python3-setuptools \
    nodejs \
    npm \
    ffmpeg \
    libglib2.0-0 \
    libgl1 \
  && rm -rf /var/lib/apt/lists/*
COPY docker/prod/gpu-worker/requirements.gpu.txt /tmp/requirements.gpu.txt
RUN python3 -m pip install --no-cache-dir --break-system-packages -r /tmp/requirements.gpu.txt

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=server_build /app/dist-server ./dist-server
RUN test -f dist-server/server.js \
  && test -f dist-server/container-readiness-receipt.js \
  && test -x \
    /opt/reeditpro/gpu-operations/faster-whisper/runner.py \
  && test -x \
    /opt/reeditpro/gpu-operations/faster-whisper/venv/bin/python

CMD ["node", "dist-server/server.js"]
