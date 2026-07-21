# syntax=docker/dockerfile:1
#
# ReeditPro production CPU analysis worker image definition.
# Milestone 10 adds core CPU/render install declarations only.
# Codex must not build this image or process media in this milestone.
#
# FFmpeg/ffprobe installed from distro packages are for dev/readiness image
# declaration. Final commercial LGPL-safe FFmpeg build verification remains
# pending manual legal/build review.

FROM node:24-bookworm AS signalsmith_stretch_builder

ARG SIGNALSMITH_STRETCH_COMMIT=57b93f4e9206a089a45387eaa39bdc9f310d3308
ARG SIGNALSMITH_LINEAR_COMMIT=5668673560146a9cfe38c25315071e3fd68c8317

RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g; s|http://security.debian.org|https://security.debian.org|g' /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Retries=5 update \
  && apt-get -o Acquire::Retries=5 install -y --no-install-recommends \
    ca-certificates \
    git \
    g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp/signalsmith-build
RUN git clone --recurse-submodules https://github.com/Signalsmith-Audio/signalsmith-stretch.git stretch \
  && cd stretch \
  && git checkout "${SIGNALSMITH_STRETCH_COMMIT}" \
  && git submodule update --init --recursive \
  && test "$(git rev-parse HEAD)" = "${SIGNALSMITH_STRETCH_COMMIT}" \
  && git clone https://github.com/Signalsmith-Audio/linear.git /tmp/signalsmith-build/linear \
  && cd /tmp/signalsmith-build/linear \
  && git checkout "${SIGNALSMITH_LINEAR_COMMIT}" \
  && test "$(git rev-parse HEAD)" = "${SIGNALSMITH_LINEAR_COMMIT}" \
  && cd /tmp/signalsmith-build/stretch \
  && g++ -std=c++11 -O3 -Wall -Wextra \
    -include cstring \
    -I include \
    -I /tmp/signalsmith-build/linear/include \
    -I cmd/util/include \
    cmd/main.cpp \
    -o /usr/local/bin/signalsmith-stretch \
  && /usr/local/bin/signalsmith-stretch -v

FROM node:24-bookworm AS base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=cpu_analysis_worker
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g; s|http://security.debian.org|https://security.debian.org|g' /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Retries=5 update \
  && apt-get -o Acquire::Retries=5 install -y --no-install-recommends \
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
    libatomic1 \
    libgomp1 \
    libvips42 \
    libvips-dev \
  && rm -rf /var/lib/apt/lists/*

COPY docker/prod/cpu-worker/requirements.cpu.txt /tmp/requirements.cpu.txt
RUN python3 -m pip install --no-cache-dir --break-system-packages -r /tmp/requirements.cpu.txt \
  && python3 -m pip install --no-cache-dir --break-system-packages --no-deps scenedetect==0.7

COPY --from=signalsmith_stretch_builder /usr/local/bin/signalsmith-stretch /usr/local/bin/signalsmith-stretch

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node dist-server ./dist-server
RUN test -f dist-server/server.js \
  && test -f dist-server/container-readiness-receipt.js

# Tool processes run without root. Canonical job sandboxes and output roots
# are supplied as explicitly scoped writable mounts by the worker launcher.
USER node

CMD ["node", "dist-server/server.js"]
