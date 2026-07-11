# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS dependencies
WORKDIR /opt/reeditpro-ai-capability
COPY docker/prod/offline-ai-capability-execution/requirements.lock.txt ./requirements.lock.txt
RUN python -m pip install \
      --require-hashes \
      --only-binary=:all: \
      --no-cache-dir \
      --no-compile \
      --extra-index-url=https://download.pytorch.org/whl/cpu \
      --prefix=/opt/runtime \
      -r requirements.lock.txt \
    && PYTHONPATH=/opt/runtime/lib/python3.13/site-packages python -c \
      "import importlib.metadata as m, kornia, music21, torch, torchvision, transformers; assert torch.__version__ == '2.13.0+cpu'; assert torchvision.__version__ == '0.28.0+cpu'; assert transformers.__version__ == '5.13.0'; assert kornia.__version__ == '0.8.3'; assert m.version('music21') == '10.5.0'; assert music21.__version__ == '10.5.0'"

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS runtime
LABEL org.opencontainers.image.title="ReEditPro private offline AI capability execution" \
      org.opencontainers.image.base.digest="sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0" \
      com.reeditpro.runner.protocol="offline-ai-capability-execution-container-v1" \
      com.reeditpro.runner.private-internal-only="true" \
      com.reeditpro.runner.product-ready="false" \
      com.reeditpro.runner.external-beta-ready="false" \
      com.reeditpro.runner.production-ready="false"
ENV PYTHONPATH=/opt/runtime/lib/python3.13/site-packages \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=0 \
    PYTHONNOUSERSITE=1 \
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    TOKENIZERS_PARALLELISM=false \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1
WORKDIR /app
COPY --from=dependencies /opt/runtime /opt/runtime
COPY --chown=10001:10001 docker/prod/offline-ai-capability-execution/runner.py /app/runner.py
RUN groupadd --gid 10001 reeditpro \
    && useradd --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin reeditpro \
    && rm -rf /usr/local/lib/python3.13/site-packages/pip /usr/local/lib/python3.13/site-packages/pip-* /usr/local/bin/pip* \
    && python -m py_compile /app/runner.py \
    && find /app /opt/runtime -type d -name __pycache__ -prune -exec rm -rf '{}' +
USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/runner.py"]
