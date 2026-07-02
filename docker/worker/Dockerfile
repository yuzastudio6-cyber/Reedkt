# ReeditPro local/dev/test worker readiness image.
# This image proves tool availability for smoke tests only. It is not a
# production-approved media worker image, and it does not include provider SDKs,
# secrets, Remotion, Stripe, Google Cloud credentials, or deployment commands.
# Production FFmpeg and codec usage still needs LGPL-safe build/config review.

FROM node:22-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    ffmpeg \
    python3 \
    python3-pip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:api

ENV E2E_RUNTIME_MODE=local
ENV WORKER_RUNTIME_MODE=local
ENV STORAGE_MODE=local
ENV FFMPEG_BIN=ffmpeg
ENV FFPROBE_BIN=ffprobe
ENV PYTHON_BIN=python3

# Optional future tools are not installed here unless a future milestone adds
# and reviews them: AudioFlux, OpenCV, VapourSynth/plugins, Playwright browser
# dependencies, Signalsmith Stretch, Remotion, Sharp/libvips.

CMD ["npm", "run", "tools:check"]
