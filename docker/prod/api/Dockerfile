# syntax=docker/dockerfile:1
#
# ReeditPro production API image template.
# Milestone 5 only: do not build or deploy from Codex.
# No FFmpeg, GPU dependencies, model weights, provider secrets, or heavy media tools belong in this image.

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS build
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build:server

FROM base AS runtime
ENV REEDITPRO_RUNTIME_ROLE=api_service
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist-server ./dist-server
COPY package*.json ./
EXPOSE 8080
CMD ["node", "dist-server/server.js"]
