# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS build
ARG AUDIOFLUX_SOURCE_URL=https://github.com/libAudioFlux/audioFlux/archive/refs/tags/v0.1.9.tar.gz
ARG AUDIOFLUX_SOURCE_SHA256=538c2b5ff718c88b8c457b10f4b8fc03796680e43daf4afc2e95d717d01d281b
RUN printf '%s\n' \
      'deb [check-valid-until=no] https://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' \
      'deb [check-valid-until=no] https://snapshot.debian.org/archive/debian-security/20260623T000000Z bookworm-security main' \
      > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=10 -o Acquire::https::Timeout=60 update \
  && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=10 -o Acquire::https::Timeout=60 install -y --no-install-recommends ca-certificates curl clang cmake libomp-dev ninja-build \
  && rm -rf /var/lib/apt/lists/*
COPY docker/prod/offline-audioflux-analysis-execution/requirements.lock.txt /tmp/requirements.lock.txt
RUN python -m pip install --disable-pip-version-check --no-cache-dir --require-hashes --target /opt/reeditpro-audioflux -r /tmp/requirements.lock.txt \
  && curl --retry 5 --fail --location --proto '=https' --tlsv1.2 "$AUDIOFLUX_SOURCE_URL" -o /tmp/audioflux.tar.gz \
  && echo "$AUDIOFLUX_SOURCE_SHA256  /tmp/audioflux.tar.gz" | sha256sum --check --strict \
  && mkdir -p /tmp/audioflux /tmp/audioflux-build \
  && tar -xzf /tmp/audioflux.tar.gz --strip-components=1 -C /tmp/audioflux \
  && cmake -G Ninja -S /tmp/audioflux/src -B /tmp/audioflux-build -DCMAKE_SYSTEM_NAME=linux -DCMAKE_BUILD_TYPE=Release \
  && cmake --build /tmp/audioflux-build --parallel 2 \
  && cp -R /tmp/audioflux/python/audioflux /opt/reeditpro-audioflux/audioflux \
  && rm -rf /opt/reeditpro-audioflux/audioflux/lib \
  && mkdir -p /opt/reeditpro-audioflux/audioflux/lib \
  && cp /tmp/audioflux-build/libaudioflux.so /opt/reeditpro-audioflux/audioflux/lib/libaudioflux.so \
  && sed -i '/^from \. import display$/d' /opt/reeditpro-audioflux/audioflux/__init__.py \
  && find /opt/reeditpro-audioflux -type d -name __pycache__ -prune -exec rm -rf '{}' + \
  && PYTHONPATH=/opt/reeditpro-audioflux python -c "import audioflux as af; assert af.__version__ == '0.1.9'; assert hasattr(af, 'BFT'); assert hasattr(af, 'Spectral')"

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS runtime
LABEL org.opencontainers.image.title="ReEditPro private offline AudioFlux analysis execution" \
  org.opencontainers.image.base.digest="sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0" \
  com.reeditpro.runner.protocol="offline-audioflux-analysis-execution-container-v1" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false" \
  com.reeditpro.debian.snapshot="20260623T000000Z" \
  com.reeditpro.audioflux.version="0.1.9" \
  com.reeditpro.audioflux.source.sha256="538c2b5ff718c88b8c457b10f4b8fc03796680e43daf4afc2e95d717d01d281b" \
  com.reeditpro.audioflux.native.architecture="linux_arm64_source_build"
RUN printf '%s\n' \
      'deb [check-valid-until=no] https://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' \
      > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=10 -o Acquire::https::Timeout=60 update \
  && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=10 -o Acquire::https::Timeout=60 install -y --no-install-recommends libomp5-14=1:14.0.6-12 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 reeditpro \
  && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin reeditpro
COPY --from=build /opt/reeditpro-audioflux /opt/reeditpro-audioflux
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONHASHSEED=0 PYTHONNOUSERSITE=1 PYTHONPATH=/opt/reeditpro-audioflux OMP_NUM_THREADS=1
WORKDIR /app
COPY docker/prod/offline-audioflux-analysis-execution/runner.py /app/runner.py
RUN python -m py_compile /app/runner.py \
  && chmod 0444 /app/runner.py \
  && python -c "import audioflux as af; assert af.__version__ == '0.1.9'"
USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/runner.py"]
