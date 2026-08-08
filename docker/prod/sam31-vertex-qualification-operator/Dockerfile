# syntax=docker/dockerfile:1
# Zero-idle control-plane operator for one admitted SAM 3.1 Vertex A100
# qualification and its restart-safe reconciliation. The image contains no
# checkpoint, model weights, media processor, CUDA runtime, or GPU driver.

FROM node:24-alpine3.22@sha256:8106d433c31d51dfd2fcce29763020619e334dd8c5b34a2f0a357c6656d1ca97 AS build
WORKDIR /app
ENV NODE_ENV=development \
  NODE_OPTIONS=--max-old-space-size=6144
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build:sam3_1-vertex-qualification-operator-bundle \
  && test -f dist-sam31-vertex-qualification-operator/weeditpro-sam31-vertex-qualification-operator.js \
  && test "$(find dist-sam31-vertex-qualification-operator -type f | wc -l)" = '1'

FROM node:24-alpine3.22@sha256:8106d433c31d51dfd2fcce29763020619e334dd8c5b34a2f0a357c6656d1ca97 AS runtime
ARG WEEDITPRO_SOURCE_COMMIT_SHA
ARG WEEDITPRO_SOURCE_TREE_HASH
ARG WEEDITPRO_SOURCE_CLEAN
RUN printf '%s' "${WEEDITPRO_SOURCE_COMMIT_SHA}" \
      | grep -Eq '^[a-f0-9]{40}$' \
  && printf '%s' "${WEEDITPRO_SOURCE_TREE_HASH}" \
      | grep -Eq '^[a-f0-9]{40}$' \
  && test "${WEEDITPRO_SOURCE_CLEAN}" = 'true' \
  && apk add --no-cache \
      'ca-certificates=20260611-r0' \
      'libcrypto3=3.5.7-r0' \
      'libssl3=3.5.7-r0' \
  && rm -rf /usr/local/lib/node_modules/npm \
      /usr/local/bin/npm /usr/local/bin/npx /opt/yarn* \
  && test ! -e /usr/local/lib/node_modules/npm \
  && test ! -e /usr/local/bin/npm \
  && test ! -e /usr/local/bin/npx
LABEL org.opencontainers.image.revision="${WEEDITPRO_SOURCE_COMMIT_SHA}" \
  io.weeditpro.source.tree="${WEEDITPRO_SOURCE_TREE_HASH}" \
  io.weeditpro.build.source.clean="${WEEDITPRO_SOURCE_CLEAN}" \
  io.weeditpro.image.role="sam31-vertex-qualification-control-plane" \
  io.weeditpro.model.weights.included="false" \
  io.weeditpro.media.processing.allowed="false" \
  io.weeditpro.runtime.inference.allowed="false" \
  io.weeditpro.vertex.job.creation.requires.account.rate="true"
WORKDIR /app
ENV NODE_ENV=production \
  REEDITPRO_DISABLE_DOTENV=true \
  WEEDITPRO_SAM31_VERTEX_OPERATOR_ACTION=disabled
COPY --from=build --chown=node:node \
  /app/dist-sam31-vertex-qualification-operator/weeditpro-sam31-vertex-qualification-operator.js \
  ./dist-sam31-vertex-qualification-operator/weeditpro-sam31-vertex-qualification-operator.js
COPY --from=build --chown=node:node \
  /app/node_modules/abort-controller ./node_modules/abort-controller
COPY --from=build --chown=node:node \
  /app/node_modules/event-target-shim ./node_modules/event-target-shim
RUN test -f dist-sam31-vertex-qualification-operator/weeditpro-sam31-vertex-qualification-operator.js \
  && test "$(find dist-sam31-vertex-qualification-operator -type f | wc -l)" = '1' \
  && test -f node_modules/abort-controller/package.json \
  && test -f node_modules/event-target-shim/package.json \
  && test "$(id -u node)" != '0'
USER node
ENTRYPOINT ["node", "dist-sam31-vertex-qualification-operator/weeditpro-sam31-vertex-qualification-operator.js"]
CMD ["--execute"]
