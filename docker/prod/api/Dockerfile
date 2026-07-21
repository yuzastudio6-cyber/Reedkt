# ReeditPro production API image template.
# Milestone 5 only: do not build or deploy from Codex.
# No FFmpeg, GPU dependencies, model weights, provider secrets, or heavy media tools belong in this image.

FROM node:24-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS build
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server

FROM base AS runtime
ARG REEDITPRO_SOURCE_COMMIT_SHA
ARG REEDITPRO_SOURCE_TREE_HASH
ARG REEDITPRO_SOURCE_CLEAN
RUN printf '%s' "${REEDITPRO_SOURCE_COMMIT_SHA}" | grep -Eq '^[a-f0-9]{40}$' \
  && printf '%s' "${REEDITPRO_SOURCE_TREE_HASH}" | grep -Eq '^[a-f0-9]{40}$' \
  && test "${REEDITPRO_SOURCE_CLEAN}" = "true"
LABEL org.opencontainers.image.revision="${REEDITPRO_SOURCE_COMMIT_SHA}" \
  io.reeditpro.source.tree="${REEDITPRO_SOURCE_TREE_HASH}" \
  io.reeditpro.image.role="api" \
  io.reeditpro.build.source.clean="${REEDITPRO_SOURCE_CLEAN}" \
  io.reeditpro.container.qualification.candidate.version="production-container-qualification-candidate-v1"
ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=api_service
ENV PORT=8080
ENV E2E_RUNTIME_MODE=cloud_run
ENV STORAGE_MODE=gcs_disabled
ENV WORKER_RUNTIME_MODE=disabled
ENV REEDITPRO_DISABLE_DOTENV=true
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist-server ./dist-server
RUN test -f dist-server/server.js \
  && test -f dist-server/container-readiness-receipt.js
COPY package*.json ./
EXPOSE 8080
USER node
CMD ["node", "dist-server/server.js"]
