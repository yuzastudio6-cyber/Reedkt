# ReeditPro Phase 45B Remotion render validation image.
# CPU-only Track A runtime. No providers, Revideo, Track B tools, secrets, or final delivery paths are baked in.
FROM node:24-bookworm

WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=staging_remotion_render_validation
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROME_EXECUTABLE=/usr/bin/chromium
ENV REMOTION_DISABLE_UPDATE_CHECK=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    ffmpeg \
    fontconfig \
    fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev
RUN npm install --omit=dev --no-package-lock \
    react@18.3.1 \
    react-dom@18.3.1 \
    remotion@4.0.470 \
    @remotion/cli@4.0.470 \
    zod@4.3.6
RUN node -e "require('remotion'); require('@remotion/cli'); console.log('remotion=' + require('remotion/package.json').version); console.log('remotion_cli=' + require('@remotion/cli/package.json').version); console.log('zod=' + require('zod/package.json').version)" \
  && ffprobe -version \
  && test -x /usr/bin/chromium

COPY dist-staging-remotion-render-validation-worker ./dist-staging-remotion-render-validation-worker

CMD ["node", "dist-staging-remotion-render-validation-worker/staging-remotion-render-validation-worker-cli.js"]
