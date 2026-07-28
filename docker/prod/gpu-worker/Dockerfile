# syntax=docker/dockerfile:1
#
# WeEditPro production GPU AI worker image definition.
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
    libbz2-1.0 \
    libffi8 \
    libgomp1 \
    liblzma5 \
    libncursesw6 \
    libreadline8 \
    libsqlite3-0 \
    libssl3 \
    zlib1g \
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

FROM gpu_runtime_foundation AS rembg_runtime_builder
ADD --checksum=sha256:563d2a1b2a5ba5d5409b5ecd05a0e1bf9b028cf3e6a6f0c87a5dc8dc3f2d9182 \
  https://www.python.org/ftp/python/3.11.14/Python-3.11.14.tgz \
  /tmp/Python-3.11.14.tgz
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    libbz2-dev \
    libffi-dev \
    libgdbm-dev \
    liblzma-dev \
    libncursesw5-dev \
    libreadline-dev \
    libsqlite3-dev \
    libssl-dev \
    tk-dev \
    uuid-dev \
    xz-utils \
    zlib1g-dev \
  && echo \
    "563d2a1b2a5ba5d5409b5ecd05a0e1bf9b028cf3e6a6f0c87a5dc8dc3f2d9182  /tmp/Python-3.11.14.tgz" \
    | sha256sum --check --strict \
  && mkdir /tmp/Python-3.11.14 \
  && tar \
    --extract \
    --gzip \
    --file /tmp/Python-3.11.14.tgz \
    --directory /tmp/Python-3.11.14 \
    --strip-components 1 \
  && cd /tmp/Python-3.11.14 \
  && ./configure \
    --prefix=/opt/python-3.11 \
    --with-ensurepip=install \
  && make -j"$(nproc)" \
  && make install \
  && /opt/python-3.11/bin/python3.11 \
    -c "import sys; assert sys.version_info[:3] == (3, 11, 14)"

COPY docker/prod/gpu-worker/rembg \
  /opt/reeditpro/gpu-operations/rembg
RUN /opt/python-3.11/bin/python3.11 \
    -m venv /opt/reeditpro/gpu-operations/rembg/venv \
  && /opt/reeditpro/gpu-operations/rembg/venv/bin/pip \
    install \
    --disable-pip-version-check \
    --no-cache-dir \
    --require-hashes \
    -r /opt/reeditpro/gpu-operations/rembg/requirements.lock.txt \
  && chmod 0555 \
    /opt/reeditpro/gpu-operations/rembg/runner.py \
  && chmod 0444 \
    /opt/reeditpro/gpu-operations/rembg/requirements.lock.txt \
    /opt/reeditpro/gpu-operations/rembg/source-provenance.lock \
  && /opt/reeditpro/gpu-operations/rembg/venv/bin/python \
    -I \
    -B \
    -c "import importlib.metadata as m; import onnxruntime as ort; import rembg; assert m.version('rembg') == '2.0.76'; assert m.version('onnxruntime-gpu') == '1.27.0'; assert rembg.__version__ == '2.0.76'; assert ort.__version__ == '1.27.0'; assert 'CUDAExecutionProvider' in ort.get_available_providers()"

FROM gpu_runtime_foundation AS gpu_runtime_with_operations
COPY --from=rembg_runtime_builder \
  /opt/python-3.11 /opt/python-3.11
COPY --from=rembg_runtime_builder \
  /opt/reeditpro/gpu-operations/rembg \
  /opt/reeditpro/gpu-operations/rembg

FROM gpu_runtime_with_operations AS faster_whisper_runtime_build_candidate
RUN test -x \
    /opt/reeditpro/gpu-operations/faster-whisper/venv/bin/python \
  && test -x \
    /opt/reeditpro/gpu-operations/faster-whisper/runner.py \
  && /opt/reeditpro/gpu-operations/faster-whisper/venv/bin/python \
    -I \
    -B \
    -c "import importlib.metadata as m; import ctranslate2; assert m.version('faster-whisper') == '1.2.1'; assert m.version('ctranslate2') == '4.6.2'; assert ctranslate2.__version__ == '4.6.2'"

FROM gpu_runtime_with_operations AS rembg_runtime_build_candidate
RUN test -x \
    /opt/reeditpro/gpu-operations/rembg/venv/bin/python \
  && test -x \
    /opt/reeditpro/gpu-operations/rembg/runner.py \
  && /opt/reeditpro/gpu-operations/rembg/venv/bin/python \
    -I \
    -B \
    -c "import importlib.metadata as m; import onnxruntime as ort; import rembg; assert m.version('rembg') == '2.0.76'; assert m.version('onnxruntime-gpu') == '1.27.0'; assert rembg.__version__ == '2.0.76'; assert ort.__version__ == '1.27.0'; assert 'CUDAExecutionProvider' in ort.get_available_providers()"

FROM gpu_runtime_with_operations AS base
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
    /opt/reeditpro/gpu-operations/faster-whisper/venv/bin/python \
  && test -x \
    /opt/reeditpro/gpu-operations/rembg/runner.py \
  && test -x \
    /opt/reeditpro/gpu-operations/rembg/venv/bin/python

CMD ["node", "dist-server/server.js"]
