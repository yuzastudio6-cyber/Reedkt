# syntax=docker/dockerfile:1
#
# ReeditPro production tool-readiness worker image definition.
# Milestone 10 adds safe command/import readiness declarations only.
# Codex must not build this image or run production readiness jobs.

FROM node:24-bookworm-slim AS base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=tool_readiness_worker
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    python3-setuptools \
    fontconfig \
    libass9 \
    libvips42 \
  && rm -rf /var/lib/apt/lists/*

COPY docker/prod/tool-readiness-worker/requirements.readiness.txt /tmp/requirements.readiness.txt
RUN python3 -m pip install --no-cache-dir --break-system-packages -r /tmp/requirements.readiness.txt

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist-server ./dist-server

CMD ["node", "dist-server/server.js"]
