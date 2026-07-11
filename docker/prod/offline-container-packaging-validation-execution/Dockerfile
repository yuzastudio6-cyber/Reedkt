# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS gpac-build
ARG GPAC_VERSION=v26.02.0
ARG GPAC_SOURCE_SHA256=7a265e1cd58b317d8c9175816a54e0ab14199c21d81eb779047d7088fca52ae4
RUN printf '%s\n' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20260623T000000Z bookworm-security main' \
      > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 update \
  && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 install -y --no-install-recommends \
      ca-certificates curl build-essential pkg-config zlib1g-dev \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /build
RUN curl --fail --location --proto '=https' --tlsv1.2 "https://github.com/gpac/gpac/archive/refs/tags/${GPAC_VERSION}.tar.gz" -o /tmp/gpac.tar.gz \
  && echo "${GPAC_SOURCE_SHA256}  /tmp/gpac.tar.gz" | sha256sum --check --strict \
  && mkdir /build/gpac \
  && tar --extract --gzip --file /tmp/gpac.tar.gz --directory /build/gpac --strip-components=1 \
  && cd /build/gpac \
  && ./configure --prefix=/opt/reeditpro-gpac --isomedia-only --disable-network --disable-rmtws --disable-x11 --use-dvb4linux=no \
      --enable-fin --enable-mp4dmx --enable-txtin --enable-mp4mx --enable-fout \
  && make -j2 \
  && make install \
  && test -x /opt/reeditpro-gpac/bin/MP4Box \
  && test -s /opt/reeditpro-gpac/lib/libgpac.so

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS fixture-build
RUN printf '%s\n' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20260623T000000Z bookworm-security main' \
      > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 update \
  && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 install -y --no-install-recommends ffmpeg=7:5.1.9-0+deb12u1 \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /fixture
RUN ffmpeg -hide_banner -loglevel error -f lavfi -i 'color=c=0x2457d6:s=64x64:r=24:d=1' \
      -f lavfi -i 'sine=frequency=440:sample_rate=48000:duration=1' -shortest \
      -c:v mpeg4 -q:v 5 -pix_fmt yuv420p -c:a aac -b:a 64k \
      -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
      -map_metadata -1 -metadata creation_time='1970-01-01T00:00:00Z' -movflags +faststart /fixture/approved-source.mp4 \
  && test -s /fixture/approved-source.mp4

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS runtime
LABEL org.opencontainers.image.title="ReEditPro private offline container packaging validation execution" \
  org.opencontainers.image.base.digest="sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0" \
  com.reeditpro.runner.protocol="offline-container-packaging-validation-execution-container-v1" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false" \
  com.reeditpro.debian.snapshot="20260623T000000Z" \
  com.reeditpro.mkvtoolnix.version="74.0.0-1" \
  com.reeditpro.gpac.version="v26.02.0" \
  com.reeditpro.gpac.source.sha256="7a265e1cd58b317d8c9175816a54e0ab14199c21d81eb779047d7088fca52ae4"
RUN printf '%s\n' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20260623T000000Z bookworm-security main' \
      > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 update \
  && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 install -y --no-install-recommends \
      mkvtoolnix=74.0.0-1 zlib1g \
  && test "$(dpkg-query -W -f='${Version}' mkvtoolnix)" = '74.0.0-1' \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 reeditpro \
  && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin reeditpro
COPY --from=gpac-build /opt/reeditpro-gpac /opt/reeditpro-gpac
RUN echo /opt/reeditpro-gpac/lib > /etc/ld.so.conf.d/reeditpro-gpac.conf && ldconfig
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONHASHSEED=0 PYTHONNOUSERSITE=1
WORKDIR /app
COPY --from=fixture-build /fixture/approved-source.mp4 /app/approved-source.mp4
COPY docker/prod/offline-container-packaging-validation-execution/approved-caption.srt /app/approved-caption.srt
COPY docker/prod/offline-container-packaging-validation-execution/runner.py /app/runner.py
RUN python -m py_compile /app/runner.py \
  && chmod 0444 /app/runner.py /app/approved-source.mp4 /app/approved-caption.srt \
  && mkvmerge --version | grep -F 'mkvmerge v74.0.0' \
  && /opt/reeditpro-gpac/bin/MP4Box -version 2>&1 | grep -F 'GPAC version 26.02'
USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/runner.py"]
