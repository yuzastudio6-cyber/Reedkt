# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS build
ARG DEBIAN_SNAPSHOT=20260623T000000Z
ARG RNNOISE_VERSION=v0.2
ARG RNNOISE_SOURCE_SHA256=e4a17eb1493b7551f9f7781d2acc67b8847d6ed7c4b64db0fd62c017021ae1ec
ARG RNNOISE_BUILD_FIX_COMMIT=372f7b4b76cde4ca1ec4605353dd17898a99de38
ARG RNNOISE_BUILD_FIX_SHA256=03ef15484795607274840e4c0167a4f59173357395985f73cc1c940fe4bcd0b0
ARG RNNOISE_MODEL_VERSION=0b50c45
ARG RNNOISE_MODEL_SHA256=4ac81c5c0884ec4bd5907026aaae16209b7b76cd9d7f71af582094a2f98f4b43
ARG SIGNALSMITH_VERSION=1.1.0
ARG SIGNALSMITH_SOURCE_SHA256=bdd68615090e0da6f9309c4666a99ed8ff6efae0fd2fbbf7d9219dcd9a28d69e
ARG SIGNALSMITH_ADAPTER_SHA256=4d31eb307e7342c7e07a82830a9a618b2d9086ea81f416f86b09297799f5fe9f
RUN printf '%s\n' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20260623T000000Z bookworm-security main' \
      > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 update \
  && DEBIAN_FRONTEND=noninteractive apt-get \
      -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 install -y --no-install-recommends \
      ca-certificates curl build-essential autoconf automake libtool pkg-config patch \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY docker/prod/offline-native-audio-processing-execution/signalsmith_adapter.cpp /build/signalsmith_adapter.cpp
RUN curl --fail --location --proto '=https' --tlsv1.2 "https://github.com/xiph/rnnoise/archive/refs/tags/${RNNOISE_VERSION}.tar.gz" -o /tmp/rnnoise.tar.gz \
  && echo "${RNNOISE_SOURCE_SHA256}  /tmp/rnnoise.tar.gz" | sha256sum --check --strict \
  && mkdir /build/rnnoise \
  && tar --extract --gzip --file /tmp/rnnoise.tar.gz --directory /build/rnnoise --strip-components=1 \
  && curl --fail --location --proto '=https' --tlsv1.2 "https://gitlab.xiph.org/xiph/rnnoise/-/commit/${RNNOISE_BUILD_FIX_COMMIT}.patch" -o /tmp/rnnoise-build-fix.patch \
  && echo "${RNNOISE_BUILD_FIX_SHA256}  /tmp/rnnoise-build-fix.patch" | sha256sum --check --strict \
  && cd /build/rnnoise \
  && patch --batch --forward --strip=1 < /tmp/rnnoise-build-fix.patch \
  && curl --fail --location --proto '=https' --tlsv1.2 "https://media.xiph.org/rnnoise/models/rnnoise_data-${RNNOISE_MODEL_VERSION}.tar.gz" -o "/build/rnnoise/rnnoise_data-${RNNOISE_MODEL_VERSION}.tar.gz" \
  && echo "${RNNOISE_MODEL_SHA256}  /build/rnnoise/rnnoise_data-${RNNOISE_MODEL_VERSION}.tar.gz" | sha256sum --check --strict \
  && cd /build/rnnoise \
  && ./autogen.sh \
  && ./configure --prefix=/opt/reeditpro-rnnoise --enable-examples \
  && make -j2 \
  && make install \
  && install -D -m 0555 examples/.libs/rnnoise_demo /opt/reeditpro-rnnoise/bin/rnnoise_demo \
  && test -s /opt/reeditpro-rnnoise/lib/librnnoise.so
RUN curl --fail --location --proto '=https' --tlsv1.2 "https://github.com/Signalsmith-Audio/signalsmith-stretch/archive/refs/tags/${SIGNALSMITH_VERSION}.tar.gz" -o /tmp/signalsmith.tar.gz \
  && echo "${SIGNALSMITH_SOURCE_SHA256}  /tmp/signalsmith.tar.gz" | sha256sum --check --strict \
  && mkdir /build/signalsmith \
  && tar --extract --gzip --file /tmp/signalsmith.tar.gz --directory /build/signalsmith --strip-components=1 \
  && echo "${SIGNALSMITH_ADAPTER_SHA256}  /build/signalsmith_adapter.cpp" | sha256sum --check --strict \
  && g++ -std=c++17 -O3 -DNDEBUG -Wall -Wextra -Werror -static-libstdc++ -static-libgcc \
      -I/build/signalsmith /build/signalsmith_adapter.cpp -o /opt/reeditpro-signalsmith-stretch-adapter \
  && test -x /opt/reeditpro-signalsmith-stretch-adapter

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS runtime
LABEL org.opencontainers.image.title="ReEditPro private offline native audio processing execution" \
  org.opencontainers.image.base.digest="sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0" \
  com.reeditpro.runner.protocol="offline-native-audio-processing-execution-container-v1" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false" \
  com.reeditpro.debian.snapshot="20260623T000000Z" \
  com.reeditpro.rnnoise.version="v0.2" \
  com.reeditpro.rnnoise.source.sha256="e4a17eb1493b7551f9f7781d2acc67b8847d6ed7c4b64db0fd62c017021ae1ec" \
  com.reeditpro.rnnoise.build-fix.commit="372f7b4b76cde4ca1ec4605353dd17898a99de38" \
  com.reeditpro.rnnoise.build-fix.sha256="03ef15484795607274840e4c0167a4f59173357395985f73cc1c940fe4bcd0b0" \
  com.reeditpro.rnnoise.model.version="0b50c45" \
  com.reeditpro.rnnoise.model.sha256="4ac81c5c0884ec4bd5907026aaae16209b7b76cd9d7f71af582094a2f98f4b43" \
  com.reeditpro.signalsmith.version="1.1.0" \
  com.reeditpro.signalsmith.source.sha256="bdd68615090e0da6f9309c4666a99ed8ff6efae0fd2fbbf7d9219dcd9a28d69e" \
  com.reeditpro.signalsmith.adapter.sha256="4d31eb307e7342c7e07a82830a9a618b2d9086ea81f416f86b09297799f5fe9f"
COPY --from=build /opt/reeditpro-rnnoise /opt/reeditpro-rnnoise
COPY --from=build /opt/reeditpro-signalsmith-stretch-adapter /opt/reeditpro-signalsmith-stretch-adapter
RUN echo /opt/reeditpro-rnnoise/lib > /etc/ld.so.conf.d/reeditpro-rnnoise.conf \
  && ldconfig \
  && groupadd --gid 10001 reeditpro \
  && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin reeditpro
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONHASHSEED=0 PYTHONNOUSERSITE=1
WORKDIR /app
COPY docker/prod/offline-native-audio-processing-execution/runner.py /app/runner.py
RUN python -m py_compile /app/runner.py \
  && chmod 0444 /app/runner.py \
  && /opt/reeditpro-rnnoise/bin/rnnoise_demo 2>&1 | grep -F 'usage:' \
  && ( /opt/reeditpro-signalsmith-stretch-adapter >/dev/null 2>&1; test "$?" = 2 )
USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/runner.py"]
