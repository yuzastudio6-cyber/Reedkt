# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS build
ARG LIBASS_VERSION=0.17.5
ARG LIBASS_SOURCE_SHA256=caab4b993dd7be6187c55623b789ed75dddefea6e65938af134637c732fe094a
ARG NOTO_SANS_ARCHIVE_SHA256=0c34df072a3fa7efbb7cbf34950e1f971a4447cffe365d3a359e2d4089b958f5
ARG NOTO_SANS_ARABIC_ARCHIVE_SHA256=1301aceaea84c501cf2e6dcfb3182e2328c8eae5725817fcb239672bda7154f1
ARG NOTO_SANS_DEVANAGARI_ARCHIVE_SHA256=4c582c103f0a42836338df07148b23a0aa080cce8393ddc4364af87eb22ebd85
ARG NOTO_SANS_JP_ARCHIVE_SHA256=2bbdd2c20f30670b39ca735c96d75f1fdabdb348103e43b820cf17701fd22b18
WORKDIR /build
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates curl build-essential pkg-config autoconf automake libtool \
    libfreetype6-dev libfribidi-dev libharfbuzz-dev libfontconfig1-dev libpng-dev \
    unzip opentype-sanitizer=8.2.1+dfsg-2 python3-fonttools=4.38.0-1+deb12u1 \
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
RUN set -eux; \
  mkdir -p /opt/reeditpro-fonts/fonts /opt/reeditpro-fonts/licenses; \
  curl --fail --location --proto '=https' --tlsv1.2 \
    'https://github.com/notofonts/latin-greek-cyrillic/releases/download/NotoSans-v2.015/NotoSans-v2.015.zip' \
    --output /tmp/noto-sans.zip; \
  echo "${NOTO_SANS_ARCHIVE_SHA256}  /tmp/noto-sans.zip" | sha256sum --check --strict; \
  unzip -p /tmp/noto-sans.zip 'NotoSans/hinted/ttf/NotoSans-Regular.ttf' > /opt/reeditpro-fonts/fonts/NotoSans-Regular.ttf; \
  unzip -p /tmp/noto-sans.zip 'OFL.txt' > /opt/reeditpro-fonts/licenses/NotoSans-OFL.txt; \
  echo '478c558ea716033cd60c03438f628dfa75694dcf6b5f6d505a2f05fd2b4f3823  /opt/reeditpro-fonts/fonts/NotoSans-Regular.ttf' | sha256sum --check --strict; \
  echo 'cee9892f9f0cc8fe882c9e9537ee6a89621d86ee7ceaf70b02e2b2b1c25c061a  /opt/reeditpro-fonts/licenses/NotoSans-OFL.txt' | sha256sum --check --strict; \
  test "$(wc -c < /opt/reeditpro-fonts/fonts/NotoSans-Regular.ttf)" = '621572'; \
  curl --fail --location --proto '=https' --tlsv1.2 \
    'https://github.com/notofonts/arabic/releases/download/NotoSansArabic-v2.013/NotoSansArabic-v2.013.zip' \
    --output /tmp/noto-sans-arabic.zip; \
  echo "${NOTO_SANS_ARABIC_ARCHIVE_SHA256}  /tmp/noto-sans-arabic.zip" | sha256sum --check --strict; \
  unzip -p /tmp/noto-sans-arabic.zip 'NotoSansArabic/hinted/ttf/NotoSansArabic-Regular.ttf' > /opt/reeditpro-fonts/fonts/NotoSansArabic-Regular.ttf; \
  unzip -p /tmp/noto-sans-arabic.zip 'OFL.txt' > /opt/reeditpro-fonts/licenses/NotoSansArabic-OFL.txt; \
  echo 'bdff3e5659d67e67def05b33f749683b9376ae819d65d3dd62ac4640b3aaef48  /opt/reeditpro-fonts/fonts/NotoSansArabic-Regular.ttf' | sha256sum --check --strict; \
  echo 'a7a5a25eb188bf1cd96982030d53e23c33485c69b1044a562254226857ee13af  /opt/reeditpro-fonts/licenses/NotoSansArabic-OFL.txt' | sha256sum --check --strict; \
  test "$(wc -c < /opt/reeditpro-fonts/fonts/NotoSansArabic-Regular.ttf)" = '234892'; \
  curl --fail --location --proto '=https' --tlsv1.2 \
    'https://github.com/notofonts/devanagari/releases/download/NotoSansDevanagari-v2.006/NotoSansDevanagari-v2.006.zip' \
    --output /tmp/noto-sans-devanagari.zip; \
  echo "${NOTO_SANS_DEVANAGARI_ARCHIVE_SHA256}  /tmp/noto-sans-devanagari.zip" | sha256sum --check --strict; \
  unzip -p /tmp/noto-sans-devanagari.zip 'NotoSansDevanagari/googlefonts/ttf/NotoSansDevanagari-Regular.ttf' > /opt/reeditpro-fonts/fonts/NotoSansDevanagari-Regular.ttf; \
  unzip -p /tmp/noto-sans-devanagari.zip 'OFL.txt' > /opt/reeditpro-fonts/licenses/NotoSansDevanagari-OFL.txt; \
  echo 'da2d2135e978c6f68852cfd8201c3a067df1acf73232fe80c58f89e6302ee6e8  /opt/reeditpro-fonts/fonts/NotoSansDevanagari-Regular.ttf' | sha256sum --check --strict; \
  echo 'a216f6f8d85c7228093e0ee5e258d9d377e6671f68acb4db1930b29583d0f331  /opt/reeditpro-fonts/licenses/NotoSansDevanagari-OFL.txt' | sha256sum --check --strict; \
  test "$(wc -c < /opt/reeditpro-fonts/fonts/NotoSansDevanagari-Regular.ttf)" = '282060'; \
  curl --fail --location --proto '=https' --tlsv1.2 \
    'https://github.com/notofonts/noto-cjk/releases/download/Sans2.004/16_NotoSansJP.zip' \
    --output /tmp/noto-sans-jp.zip; \
  echo "${NOTO_SANS_JP_ARCHIVE_SHA256}  /tmp/noto-sans-jp.zip" | sha256sum --check --strict; \
  unzip -p /tmp/noto-sans-jp.zip 'NotoSansJP-Regular.otf' > /opt/reeditpro-fonts/fonts/NotoSansJP-Regular.otf; \
  unzip -p /tmp/noto-sans-jp.zip 'LICENSE' > /opt/reeditpro-fonts/licenses/NotoSansJP-OFL.txt; \
  echo 'dff723ba59d57d136764a04b9b2d03205544f7cd785a711442d6d2d085ac5073  /opt/reeditpro-fonts/fonts/NotoSansJP-Regular.otf' | sha256sum --check --strict; \
  echo '6a73f9541c2de74158c0e7cf6b0a58ef774f5a780bf191f2d7ec9cc53efe2bf2  /opt/reeditpro-fonts/licenses/NotoSansJP-OFL.txt' | sha256sum --check --strict; \
  test "$(wc -c < /opt/reeditpro-fonts/fonts/NotoSansJP-Regular.otf)" = '4533028'; \
  for font in /opt/reeditpro-fonts/fonts/*; do \
    ots-sanitize "$font" "/tmp/$(basename "$font").sanitized"; \
    python3 -m fontTools.ttx -q -l "$font" > /dev/null; \
    python3 -m fontTools.subset "$font" --glyphs=.notdef \
      --output-file="/tmp/$(basename "$font").subset"; \
    python3 -m fontTools.ttx -q -l "/tmp/$(basename "$font").subset" > /dev/null; \
  done; \
  head -c 128 /opt/reeditpro-fonts/fonts/NotoSans-Regular.ttf \
    > /tmp/reeditpro-malformed-font.ttf; \
  if ots-sanitize /tmp/reeditpro-malformed-font.ttf \
      /tmp/reeditpro-malformed-font.sanitized; then exit 1; fi; \
  rm -f /tmp/noto-*.zip /tmp/*.sanitized /tmp/*.subset \
    /tmp/reeditpro-malformed-font.ttf
COPY docker/prod/offline-libass-caption-execution/source-provenance.lock /opt/reeditpro-provenance/source-provenance.lock
COPY docker/prod/offline-libass-caption-execution/font-provenance.lock /opt/reeditpro-provenance/font-provenance.lock
COPY docker/prod/offline-libass-caption-execution/caption_runner.c /build/caption_runner.c
RUN cc -std=c11 -O2 -Wall -Wextra -Werror \
    -I/opt/reeditpro-libass/include /build/caption_runner.c \
    -L/opt/reeditpro-libass/lib -Wl,-rpath,/opt/reeditpro-libass/lib \
    -lass -lpng -o /opt/reeditpro-caption-runner

FROM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS runtime
ARG REEDITPRO_SOURCE_TREE_SHA256=unset
LABEL org.opencontainers.image.title="ReEditPro private offline libass caption execution" \
  org.opencontainers.image.base.digest="sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf" \
  com.reeditpro.runner.protocol="offline-libass-caption-execution-container-v2" \
  com.reeditpro.runner.source-tree.sha256="${REEDITPRO_SOURCE_TREE_SHA256}" \
  com.reeditpro.libass.version="0.17.5" \
  com.reeditpro.libass.source.sha256="caab4b993dd7be6187c55623b789ed75dddefea6e65938af134637c732fe094a" \
  com.reeditpro.caption-font-pack.profile="reeditpro_reviewed_fonts_v2" \
  com.reeditpro.caption-font-pack.release="reeditpro-reviewed-noto-caption-fonts-2026-08-04-v1" \
  com.reeditpro.caption-font-pack.fonttools.version="4.38.0" \
  com.reeditpro.caption-font-pack.fonttools-subset-roundtrip="true" \
  com.reeditpro.caption-font-pack.opentype-sanitizer.version="8.2.1" \
  com.reeditpro.caption-font-pack.ots-malformed-rejection="true" \
  com.reeditpro.caption-font-pack.noto-sans.sha256="478c558ea716033cd60c03438f628dfa75694dcf6b5f6d505a2f05fd2b4f3823" \
  com.reeditpro.caption-font-pack.noto-sans-arabic.sha256="bdff3e5659d67e67def05b33f749683b9376ae819d65d3dd62ac4640b3aaef48" \
  com.reeditpro.caption-font-pack.noto-sans-devanagari.sha256="da2d2135e978c6f68852cfd8201c3a067df1acf73232fe80c58f89e6302ee6e8" \
  com.reeditpro.caption-font-pack.noto-sans-jp.sha256="dff723ba59d57d136764a04b9b2d03205544f7cd785a711442d6d2d085ac5073" \
  com.reeditpro.caption-font-pack.color-emoji-included="false" \
  com.reeditpro.caption-font-pack.runtime-download-allowed="false" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false"
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libfreetype6 libfribidi0 libharfbuzz0b libfontconfig1 fontconfig libpng16-16 fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 reeditpro \
  && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin reeditpro
COPY --from=build /opt/reeditpro-libass /opt/reeditpro-libass
COPY --from=build /opt/reeditpro-caption-runner /opt/reeditpro-caption-runner
COPY --from=build /opt/reeditpro-fonts/fonts /usr/share/fonts/reeditpro
COPY --from=build /opt/reeditpro-fonts/licenses /usr/share/licenses/reeditpro-caption-fonts
COPY --from=build /opt/reeditpro-provenance /usr/share/reeditpro/libass-caption-provenance
COPY docker/prod/offline-libass-caption-execution/99-reeditpro-caption-fonts.conf /etc/fonts/conf.d/99-reeditpro-caption-fonts.conf
RUN echo /opt/reeditpro-libass/lib > /etc/ld.so.conf.d/reeditpro-libass.conf \
  && ldconfig \
  && fc-cache --force /usr/share/fonts/reeditpro \
  && echo '478c558ea716033cd60c03438f628dfa75694dcf6b5f6d505a2f05fd2b4f3823  /usr/share/fonts/reeditpro/NotoSans-Regular.ttf' | sha256sum --check --strict \
  && echo 'bdff3e5659d67e67def05b33f749683b9376ae819d65d3dd62ac4640b3aaef48  /usr/share/fonts/reeditpro/NotoSansArabic-Regular.ttf' | sha256sum --check --strict \
  && echo 'da2d2135e978c6f68852cfd8201c3a067df1acf73232fe80c58f89e6302ee6e8  /usr/share/fonts/reeditpro/NotoSansDevanagari-Regular.ttf' | sha256sum --check --strict \
  && echo 'dff723ba59d57d136764a04b9b2d03205544f7cd785a711442d6d2d085ac5073  /usr/share/fonts/reeditpro/NotoSansJP-Regular.otf' | sha256sum --check --strict \
  && printf '%s\n' 'Approved caption render' \
    | /opt/reeditpro-caption-runner 640 360 1000 42 48 2 reeditpro_reviewed_fonts_v1 > /tmp/probe-v1.png \
  && printf '%s\n' 'L’élan crée déjà' \
    | /opt/reeditpro-caption-runner 640 360 1000 42 48 2 reeditpro_reviewed_fonts_v2 > /tmp/probe-fr.png \
  && printf '%s\n' '考えが動きを導く' \
    | /opt/reeditpro-caption-runner 640 360 1000 42 48 2 reeditpro_reviewed_fonts_v2 > /tmp/probe-ja.png \
  && printf '%s\n' 'الفكرة تقود الحركة' \
    | /opt/reeditpro-caption-runner 640 360 1000 42 48 2 reeditpro_reviewed_fonts_v2 > /tmp/probe-ar.png \
  && printf '%s\n' 'विचार गति को दिशा देते हैं' \
    | /opt/reeditpro-caption-runner 640 360 1000 42 48 2 reeditpro_reviewed_fonts_v2 > /tmp/probe-hi.png
RUN for probe in /tmp/probe-*.png; do \
    test "$(head -c 8 "$probe" | od -An -tx1 | tr -d ' \n')" = "89504e470d0a1a0a"; \
  done \
  && rm /tmp/probe-*.png
WORKDIR /app
USER 10001:10001
ENTRYPOINT ["/opt/reeditpro-caption-runner"]
