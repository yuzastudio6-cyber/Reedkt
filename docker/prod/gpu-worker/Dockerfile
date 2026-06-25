# syntax=docker/dockerfile:1
#
# ReeditPro production GPU AI worker image definition.
# Milestone 11 adds GPU package declarations and model-weight placeholders only.
# The `ai_graphics_install_proof` target may be built to verify package imports.
# Runtime jobs, media processing, model-weight fetches, and production unlocks
# still require separate approvals.
#
# First Cloud Run GPU target: NVIDIA L4 (`nvidia-l4`), one GPU per instance, at least
# 4 CPU and 16Gi memory, with --no-gpu-zonal-redundancy.

FROM nvidia/cuda:12.4.1-devel-ubuntu22.04 AS ai_graphics_install_base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=gpu_ai_worker
ENV REEDITPRO_MODEL_WEIGHT_DIR=/opt/reeditpro/model-weights
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV CUDA_HOME=/usr/local/cuda
ENV SAM2_BUILD_ALLOW_ERRORS=0
ENV PIP_DEFAULT_TIMEOUT=120
ENV PIP_RETRIES=10

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
    ninja-build \
    nodejs \
    npm \
    ffmpeg \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY docker/prod/gpu-worker/requirements.gpu.txt /tmp/requirements.gpu.txt
RUN python3 -m pip install --no-cache-dir --upgrade pip setuptools wheel
RUN python3 -m pip install --no-cache-dir --retries 10 --timeout 120 -r /tmp/requirements.gpu.txt
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3-dev \
  && rm -rf /var/lib/apt/lists/*
ENV TORCH_CUDA_ARCH_LIST=8.9
ENV SAM2_BUILD_CUDA=0
RUN python3 -m pip install --no-cache-dir --no-build-isolation --retries 10 --timeout 120 \
  "git+https://github.com/facebookresearch/sam2.git@2b90b9f5ceec907a1c18123530e92e794ad901a4#egg=SAM-2"
RUN python3 - <<'PY'
from pathlib import Path
import torchvision.transforms

transforms_dir = Path(torchvision.transforms.__file__).parent
(transforms_dir / "functional_tensor.py").write_text(
    "from .functional import rgb_to_grayscale\n",
    encoding="utf-8",
)
PY

COPY docker/prod/ai-graphics-gpu-install-smoke.py /tmp/ai-graphics-gpu-install-smoke.py
RUN NUMBA_DISABLE_JIT=1 python3 /tmp/ai-graphics-gpu-install-smoke.py --profile gpu_worker_ai_graphics

FROM ai_graphics_install_base AS ai_graphics_install_proof

FROM ai_graphics_install_base AS runtime

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
