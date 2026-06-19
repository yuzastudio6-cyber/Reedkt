# syntax=docker/dockerfile:1
#
# ReeditPro production CPU analysis worker image definition.
# Milestone 10 adds core CPU/render install declarations only.
# Codex must not build this image or process media in this milestone.
#
# FFmpeg/ffprobe installed from distro packages are for dev/readiness image
# declaration. Final commercial LGPL-safe FFmpeg build verification remains
# pending manual legal/build review.

FROM node:24-bookworm AS base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=cpu_analysis_worker
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    build-essential \
    pkg-config \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    python3-setuptools \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    libvips42 \
    libvips-dev \
    libimage-exiftool-perl \
    mediainfo \
    tesseract-ocr \
    tesseract-ocr-eng \
    imagemagick \
  && rm -rf /var/lib/apt/lists/*

COPY docker/prod/cpu-worker/requirements.cpu.txt /tmp/requirements.cpu.txt
RUN python3 -m pip install --no-cache-dir --break-system-packages -r /tmp/requirements.cpu.txt

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist-server ./dist-server
COPY dist-staging-fixture-worker ./dist-staging-fixture-worker

CMD ["node", "dist-server/server.js"]
