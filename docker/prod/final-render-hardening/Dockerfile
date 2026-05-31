# ReeditPro Phase 45D FFmpeg/FFprobe final render hardening image.
# CPU-only Track A runtime. No providers, Revideo, Track B tools, secrets, public access, or final delivery paths are baked in.

FROM node:24-bookworm
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=staging_final_render_hardening
ENV PROVIDER_EXECUTION_ENABLED=false
ENV REVIDEO_ENABLED=false
ENV TRACK_B_TOOLS_ENABLED=false
ENV PUBLIC_ACCESS_ENABLED=false
ENV FINAL_DELIVERY_ENABLED=false
ENV REEDITPRO_PRODUCTION_READY=false
ENV REEDITPRO_EXTERNAL_BETA_READY=false
ENV REEDITPRO_PAID_PRODUCTION_READY=false
ENV REEDITPRO_BROAD_REAL_MEDIA_READY=false
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates ffmpeg \
  && rm -rf /var/lib/apt/lists/* \
  && ffmpeg -version >/dev/null \
  && ffprobe -version >/dev/null \
  && ffmpeg -hide_banner -encoders | grep -E 'libx264| h264' >/dev/null \
  && ffmpeg -hide_banner -encoders | grep -E ' AAC| aac' >/dev/null

COPY dist-staging-final-render-hardening-worker ./dist-staging-final-render-hardening-worker

CMD ["node", "dist-staging-final-render-hardening-worker/staging-final-render-hardening-worker-cli.js"]
