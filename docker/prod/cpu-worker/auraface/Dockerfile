# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS dependencies
ARG TARGETARCH
WORKDIR /opt/reeditpro-auraface
COPY docker/prod/cpu-worker/auraface/requirements.lock.txt ./requirements.lock.txt
RUN test "${TARGETARCH}" = "amd64" \
    && python -m pip install \
      --require-hashes \
      --only-binary=:all: \
      --no-deps \
      --no-cache-dir \
      --no-compile \
      --prefix=/opt/runtime \
      -r requirements.lock.txt \
    && rm -rf \
      /opt/runtime/lib/python3.13/site-packages/onnx/backend/test \
      /opt/runtime/lib/python3.13/site-packages/onnxruntime/datasets

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS runtime
LABEL org.opencontainers.image.title="ReEditPro private AuraFace CPU continuity candidate" \
      org.opencontainers.image.base.digest="sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0" \
      com.reeditpro.runner.protocol="living-frame-auraface-atomic-mount-offline-runner-v2" \
      com.reeditpro.runner.compatible-protocols="living-frame-auraface-offline-runner-v1,living-frame-auraface-atomic-mount-offline-runner-v2" \
      com.reeditpro.runner.platform="linux/amd64" \
      com.reeditpro.runner.private-internal-only="true" \
      com.reeditpro.runner.identity-decision-authority="false" \
      com.reeditpro.runner.product-ready="false" \
      com.reeditpro.runner.production-ready="false"
ENV PYTHONPATH=/opt/runtime/lib/python3.13/site-packages \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=0 \
    PYTHONNOUSERSITE=1 \
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    NO_ALBUMENTATIONS_UPDATE=1 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1
WORKDIR /app
COPY --from=dependencies /opt/runtime /opt/runtime
COPY --chown=10001:10001 docker/prod/cpu-worker/auraface/runner.py /app/runner.py
COPY --chown=10001:10001 docker/prod/cpu-worker/auraface/THIRD_PARTY_NOTICES.md /app/THIRD_PARTY_NOTICES.md
COPY --chown=10001:10001 docker/prod/cpu-worker/auraface/verify-installed-layout.sh /app/verify-installed-layout.sh
RUN groupadd --gid 10001 reeditpro \
    && useradd --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin reeditpro \
    && mkdir -p /mnt/reeditpro/model-artifacts/auraface \
    && chown root:root /mnt/reeditpro/model-artifacts/auraface \
    && chmod 0555 /mnt/reeditpro/model-artifacts/auraface \
    && chmod 0555 /app/verify-installed-layout.sh \
    && /app/verify-installed-layout.sh \
    && find /app /opt/runtime -type d -name __pycache__ -prune -exec rm -rf '{}' + \
    && rm -rf /usr/local/lib/python3.13/site-packages/pip /usr/local/lib/python3.13/site-packages/pip-* /usr/local/bin/pip*
USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/runner.py"]
