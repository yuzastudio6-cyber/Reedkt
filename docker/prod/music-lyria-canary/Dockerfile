FROM node:24-bookworm-slim

ARG REEDITPRO_SOURCE_COMMIT_SHA
ARG REEDITPRO_SOURCE_TREE_HASH
ARG REEDITPRO_SOURCE_CLEAN

RUN printf '%s' "${REEDITPRO_SOURCE_COMMIT_SHA}" | grep -Eq '^[a-f0-9]{40}$' \
  && printf '%s' "${REEDITPRO_SOURCE_TREE_HASH}" | grep -Eq '^[a-f0-9]{40}$' \
  && test "${REEDITPRO_SOURCE_CLEAN}" = "true"

LABEL org.opencontainers.image.revision="${REEDITPRO_SOURCE_COMMIT_SHA}" \
  io.reeditpro.source.tree="${REEDITPRO_SOURCE_TREE_HASH}" \
  io.reeditpro.image.role="music_lyria_private_canary" \
  io.reeditpro.build.source.clean="${REEDITPRO_SOURCE_CLEAN}"

ENV NODE_ENV=development
ENV REEDITPRO_RUNTIME_ROLE=music_lyria_private_canary
ENV REEDITPRO_DISABLE_DOTENV=true

WORKDIR /app

RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates ffmpeg \
  && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node server ./server
COPY --chown=node:node src ./src
COPY --chown=node:node tsconfig.json tsconfig.server.json ./

USER node
CMD ["npm", "run", "canary:music:lyria"]
