# syntax=docker/dockerfile:1
#
# ReeditPro production GPU AI worker image definition.
# Milestone 11 adds GPU package declarations and model-weight placeholders only.
# Codex must not build this image, run GPU jobs, process media, or fetch weights.
#
# First Cloud Run GPU target: NVIDIA L4 (`nvidia-l4`), one GPU per instance, at least
# 4 CPU and 16Gi memory, with --no-gpu-zonal-redundancy.

FROM nvidia/cuda:12.4.1-devel-ubuntu22.04 AS base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=gpu_ai_worker
ENV REEDITPRO_MODEL_WEIGHT_DIR=/opt/reeditpro/model-weights
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV CUDA_HOME=/usr/local/cuda
ENV SAM2_BUILD_ALLOW_ERRORS=0

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    build-essential \
    pkg-config \
    python3 \
    python3-pip \
    python3-venv \
    python3-setuptools \
    git \
    nodejs \
    npm \
    ffmpeg \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY docker/prod/gpu-worker/requirements.gpu.txt /tmp/requirements.gpu.txt
RUN python3 -m pip install --no-cache-dir --break-system-packages -r /tmp/requirements.gpu.txt

RUN mkdir -p \
    /opt/reeditpro/model-weights/faster-whisper \
    /opt/reeditpro/model-weights/transformers \
    /opt/reeditpro/model-weights/birefnet \
    /opt/reeditpro/model-weights/sam2 \
    /opt/reeditpro/model-weights/rembg \
    /opt/reeditpro/model-weights/transparent-background \
    /opt/reeditpro/model-weights/deepfilternet \
    /opt/reeditpro/model-weights/demucs \
    /opt/reeditpro/model-weights/real-esrgan \
    /opt/reeditpro/model-weights/film \
    /opt/reeditpro/model-weights/paddleocr \
  && printf '%s\n' \
    'Model-weight directories are intentionally empty in Milestone 11.' \
    'Runtime mounts/manifests must provide reviewed weights in a later milestone.' \
    > /opt/reeditpro/model-weights/README.txt

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist-server ./dist-server

CMD ["node", "dist-server/server.js"]
