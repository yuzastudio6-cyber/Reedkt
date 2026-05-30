FROM node:24-bookworm

WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=staging_deepfilternet_runtime
ENV PROVIDER_EXECUTION_ENABLED=false
ENV REAL_MEDIA_INPUT_ENABLED=false
ENV RNNOISE_ENABLED=false
ENV DEMUCS_ENABLED=false
ENV MODEL_DOWNLOADS_ENABLED=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates ffmpeg \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY dist-staging-deepfilternet-runtime-worker ./dist-staging-deepfilternet-runtime-worker

CMD ["node", "dist-staging-deepfilternet-runtime-worker/staging-deepfilternet-runtime-worker-cli.js"]
