# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

# Isolated ReEditPro FFmpeg foundation for internal/private worker evaluation.
# This image is deliberately not wired into any route or worker image.
# It is not production-ready and it does not authorize production H.264,
# HEVC, AAC, FLAC, render, export, or public-delivery execution.

ARG DEBIAN_BASE=debian:bookworm-slim@sha256:60eac759739651111db372c07be67863818726f754804b8707c90979bda511df
ARG SOURCE_DATE_EPOCH=1781664539

FROM ${DEBIAN_BASE} AS ffmpeg_builder

ARG SOURCE_DATE_EPOCH
ENV SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}
ENV TZ=UTC
ENV LC_ALL=C

# The snapshot timestamp and top-level versions are immutable build inputs.
# snapshot.debian.org Release metadata is signed by Debian archive keys; HTTP
# avoids a mutable certificate-bootstrap install in the minimal builder base.
RUN printf '%s\n' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20260623T000000Z bookworm-security main' \
      > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get \
      -o Acquire::Check-Valid-Until=false \
      -o Acquire::Retries=5 \
      -o APT::Install-Recommends=false \
      update \
  && attempt=1 \
  && while ! apt-get install -y --no-install-recommends \
        build-essential=12.9 \
        libvpx-dev=1.12.0-1+deb12u5 \
        nasm=2.16.01-1 \
        pkg-config=1.8.1-1 \
        xz-utils=5.4.1-1 \
        zlib1g-dev=1:1.2.13.dfsg-1; do \
      [ "$attempt" -lt 3 ] || exit 1; \
      attempt=$((attempt + 1)); \
    done \
  && find /usr/lib -type l -name libvpx.so -delete \
  && rm -rf /var/lib/apt/lists/*

# Official FFmpeg 8.1.2 release source. The digest was independently checked
# against the release signed by FCF986EA15E6E293A5644F10B4322F04D67658D8.
COPY ffmpeg-8.1.2.tar.xz /tmp/ffmpeg-8.1.2.tar.xz

COPY configure-flags.txt /tmp/configure-flags.txt
COPY allowed-encoders.txt /tmp/allowed-encoders.txt
COPY allowed-decoders.txt /tmp/allowed-decoders.txt
COPY allowed-filters.txt /tmp/allowed-filters.txt
COPY allowed-demuxers.txt /tmp/allowed-demuxers.txt
COPY allowed-muxers.txt /tmp/allowed-muxers.txt
COPY allowed-protocols.txt /tmp/allowed-protocols.txt
COPY allowed-bsfs.txt /tmp/allowed-bsfs.txt

WORKDIR /tmp/ffmpeg-source
RUN printf '%s  %s\n' \
      '464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c' \
      '/tmp/ffmpeg-8.1.2.tar.xz' \
      | sha256sum --check --strict - \
  && tar --extract --xz --file /tmp/ffmpeg-8.1.2.tar.xz --strip-components=1 \
  && grep -Fx -- '--disable-gpl' /tmp/configure-flags.txt \
  && grep -Fx -- '--disable-nonfree' /tmp/configure-flags.txt \
  && grep -Fx -- '--disable-version3' /tmp/configure-flags.txt \
  && grep -Fx -- '--disable-network' /tmp/configure-flags.txt \
  && ! grep -Eq '^--enable-(gpl|nonfree|version3)$' /tmp/configure-flags.txt \
  && xargs ./configure < /tmp/configure-flags.txt \
  && make -j"$(getconf _NPROCESSORS_ONLN)" \
  && make install \
  && strip /opt/reeditpro-ffmpeg/bin/ffmpeg /opt/reeditpro-ffmpeg/bin/ffprobe \
  && /opt/reeditpro-ffmpeg/bin/ffmpeg -hide_banner -version \
  && /opt/reeditpro-ffmpeg/bin/ffprobe -hide_banner -version \
  && rm -rf \
      /opt/reeditpro-ffmpeg/include \
      /opt/reeditpro-ffmpeg/lib \
      /opt/reeditpro-ffmpeg/share \
  && mkdir -p /opt/reeditpro-ffmpeg/share/reeditpro \
  && cp COPYING.LGPLv2.1 /opt/reeditpro-ffmpeg/share/reeditpro/COPYING.LGPLv2.1 \
  && cp /tmp/configure-flags.txt /opt/reeditpro-ffmpeg/share/reeditpro/configure-flags.txt \
  && cp /tmp/allowed-encoders.txt /opt/reeditpro-ffmpeg/share/reeditpro/allowed-encoders.txt \
  && cp /tmp/allowed-decoders.txt /opt/reeditpro-ffmpeg/share/reeditpro/allowed-decoders.txt \
  && cp /tmp/allowed-filters.txt /opt/reeditpro-ffmpeg/share/reeditpro/allowed-filters.txt \
  && cp /tmp/allowed-demuxers.txt /opt/reeditpro-ffmpeg/share/reeditpro/allowed-demuxers.txt \
  && cp /tmp/allowed-muxers.txt /opt/reeditpro-ffmpeg/share/reeditpro/allowed-muxers.txt \
  && cp /tmp/allowed-protocols.txt /opt/reeditpro-ffmpeg/share/reeditpro/allowed-protocols.txt \
  && cp /tmp/allowed-bsfs.txt /opt/reeditpro-ffmpeg/share/reeditpro/allowed-bsfs.txt \
  && dpkg-query -W -f='${Package}=${Version}\n' \
      | LC_ALL=C sort \
      > /opt/reeditpro-ffmpeg/share/reeditpro/builder-packages.lock \
  && /opt/reeditpro-ffmpeg/bin/ffmpeg -hide_banner -buildconf \
      > /opt/reeditpro-ffmpeg/share/reeditpro/ffmpeg-buildconf.txt 2>&1

# Runtime policy scripts are packaged after the expensive source build so a
# bounded runner correction cannot invalidate the pinned FFmpeg compile layer.
COPY verify-runtime.sh /tmp/verify-runtime.sh
COPY source-slice-finalizer.sh /tmp/source-slice-finalizer.sh
COPY object-mezzanine-chunk.sh /tmp/object-mezzanine-chunk.sh
COPY continuous-program-audio.sh /tmp/continuous-program-audio.sh
COPY continuous-program-audio-probe.sh /tmp/continuous-program-audio-probe.sh
COPY long-form-master-assembly.sh /tmp/long-form-master-assembly.sh
COPY customer-delivery-master-mux.sh /tmp/customer-delivery-master-mux.sh
COPY visual-calibration-objective-qa.sh /tmp/visual-calibration-objective-qa.sh
COPY media-cgroup-resource-observer.sh /tmp/media-cgroup-resource-observer.sh
COPY source-provenance.lock /tmp/source-provenance.lock

RUN find \
      /opt/reeditpro-ffmpeg/bin \
      /opt/reeditpro-ffmpeg/share/reeditpro \
      -type f ! -name runtime-files.sha256 -print0 \
      | LC_ALL=C sort -z \
      | xargs -0 sha256sum \
      > /opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && cp /tmp/source-provenance.lock \
      /opt/reeditpro-ffmpeg/share/reeditpro/source-provenance.lock \
  && sha256sum /opt/reeditpro-ffmpeg/share/reeditpro/source-provenance.lock \
      >> /opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && mkdir -p \
      /runtime-rootfs/opt \
      /runtime-rootfs/usr/local/bin \
      /runtime-rootfs/work \
      /runtime-rootfs/tmp \
  && cp -a /opt/reeditpro-ffmpeg /runtime-rootfs/opt/reeditpro-ffmpeg \
  && install -m 0555 /tmp/verify-runtime.sh \
      /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-verify \
  && install -m 0555 /tmp/source-slice-finalizer.sh \
      /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-source-slice-finalizer \
  && install -m 0555 /tmp/object-mezzanine-chunk.sh \
      /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-object-mezzanine-chunk \
  && install -m 0555 /tmp/continuous-program-audio.sh \
      /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-continuous-program-audio \
  && install -m 0555 /tmp/continuous-program-audio-probe.sh \
      /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-continuous-program-audio-probe \
  && install -m 0555 /tmp/long-form-master-assembly.sh \
      /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-long-form-master-assembly \
  && install -m 0555 /tmp/customer-delivery-master-mux.sh \
      /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-customer-delivery-master-mux \
  && install -m 0555 /tmp/visual-calibration-objective-qa.sh \
      /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-visual-calibration-objective-qa \
  && install -m 0555 /tmp/media-cgroup-resource-observer.sh \
      /runtime-rootfs/usr/local/bin/reeditpro-media-cgroup-resource-observer \
  && sha256sum /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-verify \
      | sed 's#  /runtime-rootfs/#  /#' \
      >> /runtime-rootfs/opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && sha256sum /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-source-slice-finalizer \
      | sed 's#  /runtime-rootfs/#  /#' \
      >> /runtime-rootfs/opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && sha256sum /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-object-mezzanine-chunk \
      | sed 's#  /runtime-rootfs/#  /#' \
      >> /runtime-rootfs/opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && sha256sum /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-continuous-program-audio \
      | sed 's#  /runtime-rootfs/#  /#' \
      >> /runtime-rootfs/opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && sha256sum /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-continuous-program-audio-probe \
      | sed 's#  /runtime-rootfs/#  /#' \
      >> /runtime-rootfs/opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && sha256sum /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-long-form-master-assembly \
      | sed 's#  /runtime-rootfs/#  /#' \
      >> /runtime-rootfs/opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && sha256sum /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-customer-delivery-master-mux \
      | sed 's#  /runtime-rootfs/#  /#' \
      >> /runtime-rootfs/opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && sha256sum /runtime-rootfs/usr/local/bin/reeditpro-ffmpeg-visual-calibration-objective-qa \
      | sed 's#  /runtime-rootfs/#  /#' \
      >> /runtime-rootfs/opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && sha256sum /runtime-rootfs/usr/local/bin/reeditpro-media-cgroup-resource-observer \
      | sed 's#  /runtime-rootfs/#  /#' \
      >> /runtime-rootfs/opt/reeditpro-ffmpeg/share/reeditpro/runtime-files.sha256 \
  && chmod -R a+rX /runtime-rootfs/opt/reeditpro-ffmpeg \
  && chmod 0755 /runtime-rootfs/work \
  && chmod 1777 /runtime-rootfs/tmp \
  && find /runtime-rootfs -exec touch -h -d "@${SOURCE_DATE_EPOCH}" {} +

FROM ${DEBIAN_BASE} AS runtime

ARG SOURCE_DATE_EPOCH
ARG REEDITPRO_SOURCE_TREE_SHA256

LABEL org.opencontainers.image.title="ReEditPro minimal FFmpeg internal-worker foundation" \
      org.opencontainers.image.description="Pinned FFmpeg source build with GPL/nonfree/network disabled; internal evaluation only" \
      org.opencontainers.image.version="8.1.2" \
      org.opencontainers.image.source="https://ffmpeg.org/releases/ffmpeg-8.1.2.tar.xz" \
      org.opencontainers.image.licenses="NOASSERTION" \
      reeditpro.product-ready="false" \
      reeditpro.production-encoding-ready="false" \
      reeditpro.h264-encoding="blocked_not_compiled" \
      reeditpro.aac-encoding="private_source_slice_finalizer_and_customer_delivery_mux_only" \
      reeditpro.mp4-mux="private_source_slice_finalizer_and_customer_delivery_mux_only" \
      reeditpro.object-mezzanine-chunk="private_all_chunk_vp9_cq12_only" \
      reeditpro.flac-encoding="private_continuous_program_audio_only" \
      reeditpro.continuous-program-audio="private_30fps_48khz_source_audio_only" \
      reeditpro.long-form-master-assembly="private_vp9_flac_matroska_stream_copy_only" \
      reeditpro.customer-delivery-master-mux="private_h264_stream_copy_aac_lc_192k_front_loaded_mp4_only" \
      reeditpro.visual-calibration-objective-qa="private_dependency_bound_mp4_and_reference_frames_only" \
      reeditpro.exact-source-frame-png="private_exact_decoded_source_frame_rgba_png_only" \
      reeditpro.codec-patent-legal-review="required" \
      reeditpro.runtime-network="must_run_with_network_none" \
      reeditpro.runtime-rootfs="must_run_read_only" \
      reeditpro.source-tree.sha256="${REEDITPRO_SOURCE_TREE_SHA256}"

ENV PATH=/opt/reeditpro-ffmpeg/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ENV HOME=/nonexistent
ENV TMPDIR=/tmp
ENV REEDITPRO_RUNTIME_ROLE=ffmpeg_internal_foundation
ENV REEDITPRO_FFMPEG_PRODUCT_READY=false
ENV REEDITPRO_FFMPEG_FINAL_EXPORT_ALLOWED=false
ENV SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}

COPY --from=ffmpeg_builder /runtime-rootfs /

WORKDIR /work
USER 65532:65532
STOPSIGNAL SIGTERM
ENTRYPOINT ["/opt/reeditpro-ffmpeg/bin/ffmpeg"]
CMD ["-hide_banner", "-version"]
