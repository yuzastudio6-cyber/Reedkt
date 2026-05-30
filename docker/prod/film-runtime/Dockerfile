# ReeditPro Phase 38C FILM generated-frame runtime image.
# CPU-only, generated-frame verification only. Model artifacts are copied from private GCS at runtime.

FROM node:24-bookworm AS node-runtime

FROM tensorflow/tensorflow:2.15.0 AS base
WORKDIR /app

ENV NODE_ENV=production
ENV REEDITPRO_RUNTIME_ROLE=staging_film_runtime
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV MODEL_DOWNLOADS_ENABLED=false
ENV PROVIDER_EXECUTION_ENABLED=false
ENV REAL_MEDIA_INPUT_ENABLED=false
ENV REVIDEO_ENABLED=false
ENV TF_CPP_MIN_LOG_LEVEL=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
  && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
  && if ! command -v python3 >/dev/null 2>&1; then ln -sf "$(command -v python)" /usr/local/bin/python3; fi \
  && python3 -m pip install --no-cache-dir pillow==10.4.0

COPY dist-staging-film-runtime-worker ./dist-staging-film-runtime-worker
COPY docker/prod/film-runtime/film_runtime_local.py ./film-runtime/film_runtime_local.py

CMD ["node", "dist-staging-film-runtime-worker/staging-film-runtime-worker-cli.js"]
