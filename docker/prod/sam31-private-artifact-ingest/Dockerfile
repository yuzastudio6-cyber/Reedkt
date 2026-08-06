# syntax=docker/dockerfile:1
# Cloud-only control-plane image that exact-rereads the already-published SAM
# 3.1 source/checkpoint plus authenticated terms and security review evidence.
# It hashes the private streams and emits a create-only ingest receipt. It
# contains no model weights and cannot perform inference or media processing.

FROM node:24-alpine3.22@sha256:8106d433c31d51dfd2fcce29763020619e334dd8c5b34a2f0a357c6656d1ca97 AS build
WORKDIR /app
ENV NODE_ENV=development \
  NODE_OPTIONS=--max-old-space-size=6144
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build:sam3_1-private-artifact-ingest-bundle \
  && test -f dist-sam31-private-artifact-ingest/weeditpro-sam31-private-artifact-ingest.js \
  && test "$(find dist-sam31-private-artifact-ingest -type f | wc -l)" = '1'

FROM node:24-alpine3.22@sha256:8106d433c31d51dfd2fcce29763020619e334dd8c5b34a2f0a357c6656d1ca97 AS runtime
ARG WEEDITPRO_SOURCE_COMMIT_SHA
ARG WEEDITPRO_SOURCE_TREE_HASH
ARG WEEDITPRO_SOURCE_CLEAN
RUN printf '%s' "${WEEDITPRO_SOURCE_COMMIT_SHA}" \
      | grep -Eq '^[a-f0-9]{40}$' \
  && printf '%s' "${WEEDITPRO_SOURCE_TREE_HASH}" \
      | grep -Eq '^[a-f0-9]{40}$' \
  && test "${WEEDITPRO_SOURCE_CLEAN}" = 'true' \
  && apk add --no-cache 'ca-certificates=20260611-r0' \
  && rm -rf /usr/local/lib/node_modules/npm \
      /usr/local/bin/npm /usr/local/bin/npx /opt/yarn* \
  && test ! -e /usr/local/bin/npm \
  && test ! -e /usr/local/bin/npx
LABEL org.opencontainers.image.revision="${WEEDITPRO_SOURCE_COMMIT_SHA}" \
  io.weeditpro.source.tree="${WEEDITPRO_SOURCE_TREE_HASH}" \
  io.weeditpro.build.source.clean="${WEEDITPRO_SOURCE_CLEAN}" \
  io.weeditpro.image.role="sam31-private-artifact-ingest-control-plane" \
  io.weeditpro.model.weights.included="false" \
  io.weeditpro.runtime.inference.allowed="false" \
  io.weeditpro.runtime.gpu.required="false"
WORKDIR /app
ENV NODE_ENV=production \
  REEDITPRO_DISABLE_DOTENV=true
COPY --from=build --chown=node:node \
  /app/dist-sam31-private-artifact-ingest/weeditpro-sam31-private-artifact-ingest.js \
  ./dist-sam31-private-artifact-ingest/weeditpro-sam31-private-artifact-ingest.js
RUN test -f dist-sam31-private-artifact-ingest/weeditpro-sam31-private-artifact-ingest.js \
  && test "$(find dist-sam31-private-artifact-ingest -type f | wc -l)" = '1' \
  && test "$(id -u node)" != '0'
USER node
ENTRYPOINT ["node", "dist-sam31-private-artifact-ingest/weeditpro-sam31-private-artifact-ingest.js"]
CMD ["--execute"]
