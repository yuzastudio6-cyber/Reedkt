# syntax=docker/dockerfile:1
#
# ReeditPro production QA worker image definition.
# Milestone 10 adds core CPU/render install declarations only.
# Codex must not build this image or run production QA jobs.

FROM node:24-bookworm AS server_build
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server

FROM node:24-bookworm AS base
WORKDIR /app

ARG REEDITPRO_SOURCE_COMMIT_SHA
ARG REEDITPRO_SOURCE_TREE_HASH
ARG REEDITPRO_SOURCE_CLEAN
RUN printf '%s' "${REEDITPRO_SOURCE_COMMIT_SHA}" | grep -Eq '^[a-f0-9]{40}$' \
  && printf '%s' "${REEDITPRO_SOURCE_TREE_HASH}" | grep -Eq '^[a-f0-9]{40}$' \
  && test "${REEDITPRO_SOURCE_CLEAN}" = "true"
LABEL org.opencontainers.image.revision="${REEDITPRO_SOURCE_COMMIT_SHA}" \
  io.reeditpro.source.tree="${REEDITPRO_SOURCE_TREE_HASH}" \
  io.reeditpro.image.role="qa_worker" \
  io.reeditpro.build.source.clean="${REEDITPRO_SOURCE_CLEAN}" \
  io.reeditpro.container.qualification.candidate.version="production-container-qualification-candidate-v1"

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=qa_worker
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
  && rm -rf /var/lib/apt/lists/*

COPY docker/prod/qa-worker/requirements.qa.txt /tmp/requirements.qa.txt
RUN python3 -m pip install --no-cache-dir --break-system-packages -r /tmp/requirements.qa.txt

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=server_build /app/dist-server ./dist-server
RUN test -f dist-server/server.js \
  && test -f dist-server/container-readiness-receipt.js

CMD ["node", "dist-server/server.js"]
