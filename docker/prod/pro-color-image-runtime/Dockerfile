# ReeditPro Phase 40B/40C pro color/image runtime image.
# CPU-only Track A runtime. No model weights, providers, Revideo, Track B tools, or secrets are baked in.

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
  && apt-get install -y --no-install-recommends ca-certificates ffmpeg python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir --break-system-packages --only-binary=:all: \
    numpy==1.26.4 \
    pillow==10.4.0 \
    opencolorio==2.4.2 \
    OpenImageIO==3.0.18.1 \
  && python3 -m pip install --no-cache-dir --break-system-packages --only-binary=:all: \
    --index-url https://download.pytorch.org/whl/cpu \
    --extra-index-url https://pypi.org/simple \
    torch==2.7.1+cpu \
  && python3 -m pip install --no-cache-dir --break-system-packages --only-binary=:all: \
    kornia==0.8.1 \
  && python3 - <<'PY'
import OpenImageIO
import PyOpenColorIO
import kornia
import torch
import subprocess

print("torch", torch.__version__)
print("kornia", kornia.__version__)
print("opencolorio", getattr(PyOpenColorIO, "__version__", "unknown"))
print("openimageio", getattr(OpenImageIO, "VERSION_STRING", "unknown"))
subprocess.run(["ffmpeg", "-version"], check=True, stdout=subprocess.DEVNULL)
subprocess.run(["ffprobe", "-version"], check=True, stdout=subprocess.DEVNULL)
assert torch.cuda.is_available() is False
PY

COPY dist-staging-pro-color-image-runtime-worker ./dist-staging-pro-color-image-runtime-worker
COPY docker/prod/pro-color-image-runtime/pro_color_image_runtime_local.py ./pro_color_image_runtime_local.py

CMD ["node", "dist-staging-pro-color-image-runtime-worker/staging-pro-color-image-runtime-worker-cli.js"]
