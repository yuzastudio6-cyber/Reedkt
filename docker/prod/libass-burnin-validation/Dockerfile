# ReeditPro Phase 45A libass caption burn-in validation image.
# CPU-only Track A runtime. No providers, Revideo, Track B tools, secrets, or final delivery paths are baked in.

FROM node:24-bookworm
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=staging_libass_burnin_validation
ENV PROVIDER_EXECUTION_ENABLED=false
ENV REVIDEO_ENABLED=false
ENV TRACK_B_TOOLS_ENABLED=false
ENV FINAL_DELIVERY_ENABLED=false
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates ffmpeg \
  && rm -rf /var/lib/apt/lists/* \
  && ffmpeg -hide_banner -filters | grep -E ' (ass|subtitles) ' >/dev/null \
  && ffprobe -version >/dev/null

COPY dist-staging-libass-burnin-worker ./dist-staging-libass-burnin-worker

CMD ["node", "dist-staging-libass-burnin-worker/staging-libass-burnin-worker-cli.js"]
