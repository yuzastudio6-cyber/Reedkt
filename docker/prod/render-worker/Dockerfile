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
    curl \
    gnupg \
    build-essential \
    pkg-config \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    python3-setuptools \
    fontconfig \
    fonts-dejavu-core \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-tools \
    libass9 \
    libass-dev \
    libvips42 \
    libvips-dev \
    mkvtoolnix \
  && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
  install -d -m 0755 /usr/share/keyrings /etc/apt/sources.list.d /etc/apt/preferences.d; \
  curl -fsSL https://dist.gpac.io/gpac/linux/gpg.asc \
    | gpg --dearmor -o /usr/share/keyrings/gpac-archive-keyring.gpg; \
  chmod 0644 /usr/share/keyrings/gpac-archive-keyring.gpg; \
  printf '%s\n' \
    'Types: deb' \
    'URIs: https://dist.gpac.io/gpac/linux/debian' \
    'Suites: bookworm' \
    'Components: main' \
    'Signed-By: /usr/share/keyrings/gpac-archive-keyring.gpg' \
    > /etc/apt/sources.list.d/gpac.sources; \
  printf '%s\n' \
    'Package: gpac' \
    'Pin: origin "dist.gpac.io"' \
    'Pin-Priority: 501' \
    > /etc/apt/preferences.d/gpac.pref; \
  apt-get update; \
  apt-cache policy gpac | tee /tmp/reeditpro-gpac-policy.txt; \
  candidate="$(apt-cache policy gpac | awk '/Candidate:/ {print $2}')"; \
  test -n "$candidate"; \
  test "$candidate" != "(none)"; \
  grep -F 'https://dist.gpac.io/gpac/linux/debian bookworm/main' /tmp/reeditpro-gpac-policy.txt; \
  ! grep -F 'nightly' /tmp/reeditpro-gpac-policy.txt; \
  apt-get install -s --no-install-recommends "gpac=${candidate}" | tee /tmp/reeditpro-gpac-install-simulate.txt; \
  for package_name in $(awk '/^Inst / {print $2}' /tmp/reeditpro-gpac-install-simulate.txt); do \
    if [ "$package_name" != 'gpac' ] && apt-cache policy "$package_name" | grep -Fq 'https://dist.gpac.io'; then \
      echo "unexpected GPAC repository package in install simulation: ${package_name}" >&2; \
      exit 1; \
    fi; \
  done; \
  apt-get install -y --no-install-recommends "gpac=${candidate}"; \
  dpkg-query -W -f='${Package}\t${Version}\t${Architecture}\n' gpac; \
  command -v MP4Box; \
  rm -rf /var/lib/apt/lists/* /tmp/reeditpro-gpac-policy.txt /tmp/reeditpro-gpac-install-simulate.txt

COPY docker/prod/render-worker/requirements.render.txt /tmp/requirements.render.txt
RUN python3 -m pip install --no-cache-dir --break-system-packages -r /tmp/requirements.render.txt

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist-server ./dist-server
COPY dist-remotion-worker ./dist-remotion-worker
COPY dist-staging-fixture-worker ./dist-staging-fixture-worker
COPY dist-staging-real-video-export-worker ./dist-staging-real-video-export-worker

CMD ["node", "dist-server/server.js"]
