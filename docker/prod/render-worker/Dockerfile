# syntax=docker/dockerfile:1
#
# ReeditPro production render worker image definition.
# Milestone 10 adds core CPU/render install declarations only.
# Codex must not build this image, render media, or export final videos.
#
# Core render stack boundary: Hyperframe metadata handoff, Remotion templates,
# FFmpeg/ffprobe, libass subtitle support, Sharp/libvips, and OpenTimelineIO
# interchange. FFmpeg commercial LGPL-safe verification is pending manual review.

FROM node:24-bookworm AS base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=render_worker
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
    fontconfig \
    fonts-dejavu-core \
    libass9 \
    libass-dev \
    libvips42 \
    libvips-dev \
  && rm -rf /var/lib/apt/lists/*

COPY docker/prod/render-worker/requirements.render.txt /tmp/requirements.render.txt
RUN python3 -m pip install --no-cache-dir --break-system-packages -r /tmp/requirements.render.txt

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist-server ./dist-server
COPY dist-remotion-worker ./dist-remotion-worker

CMD ["node", "dist-server/server.js"]
