# syntax=docker/dockerfile:1
# Dedicated control-plane image for the one-time, cloud-only official SAM 3.1
# source/checkpoint ingest. It never contains model weights and never performs
# media processing or inference. The gated checkpoint is streamed directly
# from the official origin into private, create-only Google Cloud Storage.

FROM node:24-bookworm-slim@sha256:65932751ed4073ed02f5c04e494e4b2572a891b7dbea0568a863dc80341bf848 AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24-bookworm-slim@sha256:65932751ed4073ed02f5c04e494e4b2572a891b7dbea0568a863dc80341bf848 AS build
WORKDIR /app
ENV NODE_ENV=development \
  NODE_OPTIONS=--max-old-space-size=6144
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build:sam3_1-official-artifact-ingest-bundle \
  && test -f dist-sam31-official-artifact-ingest/weeditpro-sam31-official-artifact-ingest.js \
  && test "$(find dist-sam31-official-artifact-ingest -type f | wc -l)" = '1'

FROM node:24-bookworm-slim@sha256:65932751ed4073ed02f5c04e494e4b2572a891b7dbea0568a863dc80341bf848 AS runtime
ARG WEEDITPRO_SOURCE_COMMIT_SHA
ARG WEEDITPRO_SOURCE_TREE_HASH
ARG WEEDITPRO_SOURCE_CLEAN
RUN printf '%s' "${WEEDITPRO_SOURCE_COMMIT_SHA}" \
      | grep -Eq '^[a-f0-9]{40}$' \
  && printf '%s' "${WEEDITPRO_SOURCE_TREE_HASH}" \
      | grep -Eq '^[a-f0-9]{40}$' \
  && test "${WEEDITPRO_SOURCE_CLEAN}" = 'true' \
  && apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates git \
  && rm -rf /var/lib/apt/lists/*
LABEL org.opencontainers.image.revision="${WEEDITPRO_SOURCE_COMMIT_SHA}" \
  io.weeditpro.source.tree="${WEEDITPRO_SOURCE_TREE_HASH}" \
  io.weeditpro.build.source.clean="${WEEDITPRO_SOURCE_CLEAN}" \
  io.weeditpro.image.role="sam31-official-artifact-ingest-control-plane" \
  io.weeditpro.model.weights.included="false" \
  io.weeditpro.runtime.inference.allowed="false"
WORKDIR /app
ENV NODE_ENV=production \
  REEDITPRO_DISABLE_DOTENV=true
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node \
  /app/dist-sam31-official-artifact-ingest/weeditpro-sam31-official-artifact-ingest.js \
  ./dist-sam31-official-artifact-ingest/weeditpro-sam31-official-artifact-ingest.js
COPY --chown=node:node package.json package-lock.json ./
RUN test -f dist-sam31-official-artifact-ingest/weeditpro-sam31-official-artifact-ingest.js \
  && test "$(find dist-sam31-official-artifact-ingest -type f | wc -l)" = '1' \
  && test "$(id -u node)" != '0'
USER node
ENTRYPOINT ["node", "dist-sam31-official-artifact-ingest/weeditpro-sam31-official-artifact-ingest.js"]
CMD ["--execute"]
