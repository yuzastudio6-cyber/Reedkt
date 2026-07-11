# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS runtime
ARG DEBIAN_SNAPSHOT=20260623T000000Z
LABEL org.opencontainers.image.title="ReEditPro private offline native image pipeline execution" \
  org.opencontainers.image.base.digest="sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0" \
  com.reeditpro.runner.protocol="offline-native-image-pipeline-execution-container-v1" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false" \
  com.reeditpro.debian.snapshot="20260623T000000Z" \
  com.reeditpro.opencolorio-tools.version="2.1.2+dfsg1-4+b3" \
  com.reeditpro.openimageio-tools.version="2.4.7.1+dfsg-2" \
  com.reeditpro.gstreamer-tools.version="1.22.0-2+deb12u1" \
  com.reeditpro.gstreamer-plugins-base.version="1.22.0-3+deb12u6"
RUN printf '%s\n' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20260623T000000Z bookworm-security main' \
      > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 update \
  && DEBIAN_FRONTEND=noninteractive apt-get \
      -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 install -y --no-install-recommends \
      opencolorio-tools=2.1.2+dfsg1-4+b3 \
      openimageio-tools=2.4.7.1+dfsg-2 \
      gstreamer1.0-tools=1.22.0-2+deb12u1 \
      gstreamer1.0-plugins-base=1.22.0-3+deb12u6 \
  && test "$(dpkg-query -W -f='${Version}' opencolorio-tools)" = '2.1.2+dfsg1-4+b3' \
  && test "$(dpkg-query -W -f='${Version}' openimageio-tools)" = '2.4.7.1+dfsg-2' \
  && test "$(dpkg-query -W -f='${Version}' gstreamer1.0-tools)" = '1.22.0-2+deb12u1' \
  && test "$(dpkg-query -W -f='${Version}' gstreamer1.0-plugins-base)" = '1.22.0-3+deb12u6' \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 reeditpro \
  && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin reeditpro
ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=0 \
  PYTHONNOUSERSITE=1 \
  GST_REGISTRY=/tmp/gstreamer-registry.bin \
  GST_REGISTRY_REUSE_PLUGIN_SCANNER=no
WORKDIR /app
COPY docker/prod/offline-native-image-pipeline-execution/runner.py /app/runner.py
COPY docker/prod/offline-native-image-pipeline-execution/approved-color.spi1d /app/approved-color.spi1d
RUN python -m py_compile /app/runner.py \
  && test "$(sha256sum /app/approved-color.spi1d | cut -d' ' -f1)" = '6958954b4e3d500948bf94822e99aa159c0efbacf027d201ea85852c4d31dbf1' \
  && chmod 0444 /app/runner.py /app/approved-color.spi1d
USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/runner.py"]
