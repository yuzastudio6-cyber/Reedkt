# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS build
ARG U2NETP_MODEL_URL=https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
ARG U2NETP_MODEL_SHA256=309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8
RUN printf '%s\n' 'deb [check-valid-until=no] https://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=10 -o Acquire::https::Timeout=60 update \
  && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=10 -o Acquire::https::Timeout=60 install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
COPY docker/prod/offline-rembg-background-removal-execution/requirements.lock.txt /tmp/requirements.lock.txt
RUN python -m pip install --disable-pip-version-check --no-cache-dir --require-hashes --target /opt/reeditpro-rembg -r /tmp/requirements.lock.txt \
  && mkdir -p /opt/reeditpro-models \
  && curl --retry 5 --fail --location --proto '=https' --tlsv1.2 "$U2NETP_MODEL_URL" -o /opt/reeditpro-models/u2netp.onnx \
  && echo "$U2NETP_MODEL_SHA256  /opt/reeditpro-models/u2netp.onnx" | sha256sum --check --strict \
  && test "$(stat -c %s /opt/reeditpro-models/u2netp.onnx)" = 4574861 \
  && PYTHONPATH=/opt/reeditpro-rembg U2NET_HOME=/opt/reeditpro-models python -c "import onnxruntime as ort; import rembg; from rembg import new_session, remove; assert rembg.__version__ == '2.0.76'; assert ort.__version__ == '1.27.0'; assert 'CPUExecutionProvider' in ort.get_available_providers(); assert 'CUDAExecutionProvider' not in ort.get_available_providers(); assert 'ROCMExecutionProvider' not in ort.get_available_providers(); session = new_session('u2netp', providers=['CPUExecutionProvider']); assert session.name() == 'u2netp'; assert session.inner_session.get_providers() == ['CPUExecutionProvider']"

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS runtime
LABEL org.opencontainers.image.title="ReEditPro private offline rembg background removal execution" \
  org.opencontainers.image.base.digest="sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0" \
  com.reeditpro.runner.protocol="offline-rembg-background-removal-execution-container-v1" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false" \
  com.reeditpro.debian.snapshot="20260623T000000Z" \
  com.reeditpro.rembg.version="2.0.76" \
  com.reeditpro.onnxruntime.version="1.27.0" \
  com.reeditpro.model.id="u2netp" \
  com.reeditpro.model.sha256="309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8" \
  com.reeditpro.model.bytes="4574861" \
  com.reeditpro.model.upstream.license="Apache-2.0_reviewed_for_private_test_production_review_required"
RUN groupadd --gid 10001 reeditpro \
  && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin reeditpro
COPY --from=build /opt/reeditpro-rembg /opt/reeditpro-rembg
COPY --from=build /opt/reeditpro-models /opt/reeditpro-models
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONHASHSEED=0 PYTHONNOUSERSITE=1 PYTHONPATH=/opt/reeditpro-rembg U2NET_HOME=/opt/reeditpro-models OMP_NUM_THREADS=1 NUMBA_CACHE_DIR=/tmp/numba-cache
WORKDIR /app
COPY docker/prod/offline-rembg-background-removal-execution/runner.py /app/runner.py
RUN python -m py_compile /app/runner.py \
  && chmod 0444 /app/runner.py \
  && python -c "import rembg; assert rembg.__version__ == '2.0.76'"
USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/runner.py"]
