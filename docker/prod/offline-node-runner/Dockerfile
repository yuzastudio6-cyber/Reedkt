# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM node:24-bookworm-slim@sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5 AS production_dependencies
WORKDIR /opt/reeditpro-runner
COPY docker/prod/offline-node-runner/package.json ./package.json
COPY docker/prod/offline-node-runner/package-lock.json ./package-lock.json
ARG RUNNER_LOCK_SHA256
RUN test -n "${RUNNER_LOCK_SHA256}" \
    && echo "${RUNNER_LOCK_SHA256}  package-lock.json" | sha256sum --check --strict \
    && npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force

FROM node:24-bookworm-slim@sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5 AS builder
WORKDIR /opt/reeditpro-runner
COPY docker/prod/offline-node-runner/package.json ./package.json
COPY docker/prod/offline-node-runner/package-lock.json ./package-lock.json
ARG RUNNER_LOCK_SHA256
RUN test -n "${RUNNER_LOCK_SHA256}" \
    && echo "${RUNNER_LOCK_SHA256}  package-lock.json" | sha256sum --check --strict \
    && npm ci --ignore-scripts --no-audit --no-fund
COPY server/tool-execution ./server/tool-execution
COPY server/tool-registry ./server/tool-registry
COPY src/backend/contracts ./src/backend/contracts
RUN ./node_modules/.bin/esbuild \
      server/tool-execution/node-runner-activation/offline-node-runner-container-cli.ts \
      --bundle \
      --packages=external \
      --platform=node \
      --target=node24 \
      --format=esm \
      --legal-comments=none \
      --tree-shaking=true \
      --outfile=/opt/reeditpro-runner/offline-node-runner-cli.mjs \
    && node --check /opt/reeditpro-runner/offline-node-runner-cli.mjs

FROM node:24-bookworm-slim@sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5 AS runtime
ARG RUNNER_LOCK_SHA256
LABEL org.opencontainers.image.title="ReeditPro private offline Node runner" \
      org.opencontainers.image.description="Docker-confined internal activation surface for six fixed offline Node tool operations" \
      org.opencontainers.image.base.name="node:24-bookworm-slim" \
      org.opencontainers.image.base.digest="sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5" \
      com.reeditpro.runner.protocol="offline-node-runner-container-v1" \
      com.reeditpro.runner.lock.sha256="${RUNNER_LOCK_SHA256}" \
      com.reeditpro.runner.product-ready="false" \
      com.reeditpro.runner.external-beta-ready="false" \
      com.reeditpro.runner.production-ready="false"
ENV NODE_ENV=production
WORKDIR /app
RUN rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/corepack \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg \
      /opt/yarn-v1.22.22
COPY --from=production_dependencies --chown=10001:10001 /opt/reeditpro-runner/node_modules ./node_modules
COPY --from=production_dependencies --chown=10001:10001 /opt/reeditpro-runner/package.json ./package.json
COPY --from=production_dependencies --chown=10001:10001 /opt/reeditpro-runner/package-lock.json ./package-lock.json
COPY --from=builder --chown=10001:10001 /opt/reeditpro-runner/offline-node-runner-cli.mjs ./offline-node-runner-cli.mjs
USER 10001:10001
ENTRYPOINT ["node", "--no-warnings", "/app/offline-node-runner-cli.mjs"]
