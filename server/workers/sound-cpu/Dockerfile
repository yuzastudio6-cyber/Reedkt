# SOUND-RUNTIME-MEDIA-GATE-1G source-only Dockerfile.
# No Docker build has been run for this file in Gate 1G.
# Runtime is disabled by default; this source does not approve worker execution.
# No media processing, worker readiness, runtime readiness, image readiness, beta readiness, or production readiness is claimed.

FROM --platform=linux/amd64 python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0 \
    REEDITPRO_WORKER_EXECUTION_ENABLED=0 \
    REEDITPRO_MEDIA_PROCESSING_ENABLED=0 \
    REEDITPRO_SUPABASE_MUTATION_ENABLED=0 \
    REEDITPRO_ARTIFACT_WRITE_ENABLED=0 \
    REEDITPRO_EXTERNAL_BETA_READY=false \
    REEDITPRO_PRODUCTION_READY=false

WORKDIR /opt/reeditpro/sound-cpu

COPY --chmod=0644 server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt ./requirements.sound-oss-tools.txt
COPY --chmod=0644 scripts/validation/worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-runner.py ./controlled-tool-execution-runner.py

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        ffmpeg \
        fontconfig \
        fonts-dejavu-core \
        libass9 \
        libatomic1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --requirement ./requirements.sound-oss-tools.txt

RUN addgroup --system reeditpro \
    && adduser --system --ingroup reeditpro --home /home/reeditpro reeditpro

USER reeditpro

CMD ["python", "./controlled-tool-execution-runner.py", "--require-disabled-env"]
