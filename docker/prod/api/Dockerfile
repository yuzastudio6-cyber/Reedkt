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
