# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS build
ARG LIBASS_VERSION=0.17.5
ARG LIBASS_SOURCE_SHA256=caab4b993dd7be6187c55623b789ed75dddefea6e65938af134637c732fe094a
WORKDIR /build
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates curl build-essential pkg-config autoconf automake libtool \
    libfreetype6-dev libfribidi-dev libharfbuzz-dev libfontconfig1-dev libpng-dev \
  && rm -rf /var/lib/apt/lists/*
RUN curl --fail --location --proto '=https' --tlsv1.2 \
    "https://github.com/libass/libass/releases/download/${LIBASS_VERSION}/libass-${LIBASS_VERSION}.tar.gz" \
    --output /tmp/libass.tar.gz \
  && echo "${LIBASS_SOURCE_SHA256}  /tmp/libass.tar.gz" | sha256sum --check --strict \
  && mkdir /tmp/libass-source \
  && tar --extract --gzip --file /tmp/libass.tar.gz --directory /tmp/libass-source --strip-components=1 \
  && cd /tmp/libass-source \
  && ./configure --prefix=/opt/reeditpro-libass --disable-static --enable-shared \
  && make -j2 \
  && make install \
  && test "$(PKG_CONFIG_PATH=/opt/reeditpro-libass/lib/pkgconfig pkg-config --modversion libass)" = "${LIBASS_VERSION}"
COPY docker/prod/offline-libass-caption-execution/caption_runner.c /build/caption_runner.c
RUN cc -std=c11 -O2 -Wall -Wextra -Werror \
    -I/opt/reeditpro-libass/include /build/caption_runner.c \
    -L/opt/reeditpro-libass/lib -Wl,-rpath,/opt/reeditpro-libass/lib \
    -lass -lpng -o /opt/reeditpro-caption-runner

FROM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS runtime
LABEL org.opencontainers.image.title="ReEditPro private offline libass caption execution" \
  org.opencontainers.image.base.digest="sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf" \
  com.reeditpro.runner.protocol="offline-libass-caption-execution-container-v1" \
  com.reeditpro.libass.version="0.17.5" \
  com.reeditpro.libass.source.sha256="caab4b993dd7be6187c55623b789ed75dddefea6e65938af134637c732fe094a" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false"
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libfreetype6 libfribidi0 libharfbuzz0b libfontconfig1 libpng16-16 fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 reeditpro \
  && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin reeditpro
COPY --from=build /opt/reeditpro-libass /opt/reeditpro-libass
COPY --from=build /opt/reeditpro-caption-runner /opt/reeditpro-caption-runner
RUN echo /opt/reeditpro-libass/lib > /etc/ld.so.conf.d/reeditpro-libass.conf \
  && ldconfig \
  && printf '%s\n' 'Approved caption render' \
    | /opt/reeditpro-caption-runner 640 360 1000 42 48 2 > /tmp/probe.png
RUN test "$(head -c 8 /tmp/probe.png | od -An -tx1 | tr -d ' \n')" = "89504e470d0a1a0a" \
  && rm /tmp/probe.png
WORKDIR /app
USER 10001:10001
ENTRYPOINT ["/opt/reeditpro-caption-runner"]
