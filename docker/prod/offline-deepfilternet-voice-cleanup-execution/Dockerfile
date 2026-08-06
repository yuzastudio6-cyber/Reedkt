# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM python:3.11.15-slim-bookworm@sha256:f5cf0344c9886ff24d34797578d5d7dd6e8911ae0fe5962bb55d0f89603ec361 AS build
ARG DEEPFILTERNET_MODEL_URL=https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/models/DeepFilterNet3.zip
ARG DEEPFILTERNET_MODEL_ARCHIVE_SHA256=49c52edc8947ae1f9bf50d81530beaf3a2c3245aeaf34b6f31ff535cd22284d2
RUN printf '%s\n' 'deb [check-valid-until=no] https://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=10 -o Acquire::https::Timeout=60 update \
  && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=10 -o Acquire::https::Timeout=60 install -y --no-install-recommends ca-certificates curl espeak-ng libgomp1 unzip \
  && test "$(dpkg-query -W -f='${Version}' espeak-ng)" = '1.51+dfsg-10+deb12u2' \
  && test "$(dpkg-query -W -f='${Version}' libgomp1)" = '12.2.0-14+deb12u1' \
  && rm -rf /var/lib/apt/lists/*
COPY docker/prod/offline-deepfilternet-voice-cleanup-execution/requirements.lock.txt /tmp/requirements.lock.txt
RUN python -m pip install --disable-pip-version-check --no-cache-dir --require-hashes --target /opt/reeditpro-deepfilternet -r /tmp/requirements.lock.txt \
  && mkdir -p /opt/reeditpro-models /opt/reeditpro-fixtures \
  && curl --retry 5 --fail --location --proto '=https' --tlsv1.2 "$DEEPFILTERNET_MODEL_URL" -o /tmp/DeepFilterNet3.zip \
  && echo "$DEEPFILTERNET_MODEL_ARCHIVE_SHA256  /tmp/DeepFilterNet3.zip" | sha256sum --check --strict \
  && test "$(stat -c %s /tmp/DeepFilterNet3.zip)" = 7986207 \
  && unzip -q /tmp/DeepFilterNet3.zip -d /opt/reeditpro-models \
  && echo '415eb925d44990d938fb739f514aa3662c1ec0ea836cff044fa1291b82cb4290  /opt/reeditpro-models/DeepFilterNet3/config.ini' | sha256sum --check --strict \
  && echo '23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003  /opt/reeditpro-models/DeepFilterNet3/checkpoints/model_120.ckpt.best' | sha256sum --check --strict \
  && espeak-ng -v en-us -s 145 -w /opt/reeditpro-fixtures/approved-voice.wav 'Reedit Pro keeps every voice clear and professional.' \
  && echo 'db1c85abd221a559fd18d59e77f960d6efd3306c51e8c4bd4e423a66b1bda8ec  /opt/reeditpro-fixtures/approved-voice.wav' | sha256sum --check --strict \
  && test "$(stat -c %s /opt/reeditpro-fixtures/approved-voice.wav)" = 176522 \
  && PYTHONPATH=/opt/reeditpro-deepfilternet python -c "import importlib.metadata as m; import torch, torchaudio; import df; assert m.version('DeepFilterNet') == '0.5.6'; assert m.version('DeepFilterLib') == '0.5.6'; assert torch.__version__ == '2.2.2'; assert torchaudio.__version__ == '2.2.2'"

FROM python:3.11.15-slim-bookworm@sha256:f5cf0344c9886ff24d34797578d5d7dd6e8911ae0fe5962bb55d0f89603ec361 AS runtime
LABEL org.opencontainers.image.title="ReEditPro private offline DeepFilterNet voice cleanup execution" \
  org.opencontainers.image.base.digest="sha256:f5cf0344c9886ff24d34797578d5d7dd6e8911ae0fe5962bb55d0f89603ec361" \
  com.reeditpro.runner.protocol="offline-deepfilternet-voice-cleanup-execution-container-v1" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false" \
  com.reeditpro.debian.snapshot="20260623T000000Z" \
  com.reeditpro.deepfilternet.version="0.5.6" \
  com.reeditpro.deepfilterlib.version="0.5.6" \
  com.reeditpro.torch.version="2.2.2" \
  com.reeditpro.torchaudio.version="2.2.2" \
  com.reeditpro.model.id="DeepFilterNet3" \
  com.reeditpro.model.archive.sha256="49c52edc8947ae1f9bf50d81530beaf3a2c3245aeaf34b6f31ff535cd22284d2" \
  com.reeditpro.model.checkpoint.sha256="23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003" \
  com.reeditpro.model.config.sha256="415eb925d44990d938fb739f514aa3662c1ec0ea836cff044fa1291b82cb4290" \
  com.reeditpro.model.upstream.license="MIT_private_test_only_production_review_required" \
  com.reeditpro.fixture.sha256="db1c85abd221a559fd18d59e77f960d6efd3306c51e8c4bd4e423a66b1bda8ec"
RUN printf '%s\n' 'deb [check-valid-until=no] https://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=10 -o Acquire::https::Timeout=60 update \
  && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=10 -o Acquire::https::Timeout=60 install -y --no-install-recommends libgomp1 \
  && test "$(dpkg-query -W -f='${Version}' libgomp1)" = '12.2.0-14+deb12u1' \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 reeditpro \
  && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin reeditpro
COPY --from=build /opt/reeditpro-deepfilternet /opt/reeditpro-deepfilternet
COPY --from=build /opt/reeditpro-models /opt/reeditpro-models
COPY --from=build /opt/reeditpro-fixtures /opt/reeditpro-fixtures
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONHASHSEED=0 PYTHONNOUSERSITE=1 PYTHONPATH=/opt/reeditpro-deepfilternet OMP_NUM_THREADS=1 MKL_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1
WORKDIR /app
COPY docker/prod/offline-deepfilternet-voice-cleanup-execution/runner.py /app/runner.py
RUN python -m py_compile /app/runner.py \
  && chmod 0444 /app/runner.py \
  && chmod -R a-w /opt/reeditpro-models /opt/reeditpro-fixtures \
  && python -c "import importlib.metadata as m; assert m.version('DeepFilterNet') == '0.5.6'"
USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/runner.py"]
