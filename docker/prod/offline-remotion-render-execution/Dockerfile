# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 \
    libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 \
    libpango-1.0-0 libcairo2 libcups2 \
  && rm -rf /var/lib/apt/lists/*
COPY docker/prod/offline-remotion-render-execution/package.json ./package.json
COPY docker/prod/offline-remotion-render-execution/package-lock.json ./package-lock.json
RUN npm ci --no-audit --no-fund
COPY docker/prod/offline-remotion-render-execution/entry.tsx ./entry.tsx
COPY docker/prod/offline-remotion-render-execution/composition.tsx ./composition.tsx
COPY docker/prod/offline-remotion-render-execution/build-bundle.mjs ./build-bundle.mjs
COPY docker/prod/offline-remotion-render-execution/ensure-browser.mjs ./ensure-browser.mjs
RUN node /app/build-bundle.mjs \
  && node /app/ensure-browser.mjs > /app/browser-path.txt \
  && node -e "const r=require('remotion/package.json'); const rr=require('@remotion/renderer/package.json'); if(r.version!=='4.0.487'||rr.version!=='4.0.487') process.exit(1)"

FROM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS runtime
ARG REEDITPRO_SOURCE_TREE_SHA256
RUN test "$(printf '%s' "${REEDITPRO_SOURCE_TREE_SHA256}" | wc -c)" -eq 64
LABEL org.opencontainers.image.title="ReEditPro private offline Remotion render execution" \
  org.opencontainers.image.base.digest="sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf" \
  com.reeditpro.runner.protocol="offline-remotion-render-execution-container-v1" \
  com.reeditpro.runner.source-tree.sha256="${REEDITPRO_SOURCE_TREE_SHA256}" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false"
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm1 libasound2 libxrandr2 \
    libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 \
    libpango-1.0-0 libcairo2 libcups2 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 reeditpro \
  && useradd --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin reeditpro
ENV NODE_ENV=production \
  REMOTION_CHROME_MODE=headless-shell
WORKDIR /app
COPY --from=build --chown=10001:10001 /app/node_modules /app/node_modules
COPY --from=build --chown=10001:10001 /app/browser-path.txt /app/browser-path.txt
COPY --from=build --chown=10001:10001 /opt/remotion-bundle /opt/remotion-bundle
COPY --chown=10001:10001 docker/prod/offline-remotion-render-execution/runner.mjs /app/runner.mjs
COPY --chmod=0555 docker/prod/offline-remotion-render-execution/remotion-cgroup-resource-observer.sh /usr/local/bin/reeditpro-remotion-cgroup-resource-observer
USER 10001:10001
ENTRYPOINT ["node", "/app/runner.mjs"]
