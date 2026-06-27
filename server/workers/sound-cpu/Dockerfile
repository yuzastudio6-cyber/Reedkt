# SOUND-RUNTIME-MEDIA-GATE-1G source-only Dockerfile.
# No Docker build has been run for this file in Gate 1G.
# Runtime is disabled by default; this source does not approve worker execution.
# No media processing, worker readiness, runtime readiness, image readiness, beta readiness, or production readiness is claimed.

FROM --platform=linux/amd64 python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0 \
    REEDITPRO_WORKER_EXECUTION_ENABLED=0 \
    REEDITPRO_MEDIA_PROCESSING_ENABLED=0

WORKDIR /opt/reeditpro/sound-cpu

COPY server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt ./requirements.sound-oss-tools.txt

RUN apt-get update \
    && apt-get install --no-install-recommends -y libatomic1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --requirement ./requirements.sound-oss-tools.txt

RUN addgroup --system reeditpro \
    && adduser --system --ingroup reeditpro --home /home/reeditpro reeditpro

USER reeditpro

CMD ["python", "-c", "raise SystemExit('SOUND CPU worker Dockerfile source exists, but runtime execution is disabled pending owner gates')"]
