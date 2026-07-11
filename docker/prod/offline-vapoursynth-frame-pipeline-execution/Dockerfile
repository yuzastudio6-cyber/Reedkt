# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS build
ARG VAPOURSYNTH_WHEEL_URL=https://files.pythonhosted.org/packages/8a/db/9cd89d3794ea8e4c17eccb5c590d6474b319cc6f0de461e603bd17358635/vapoursynth-77-cp312-abi3-manylinux_2_27_aarch64.manylinux_2_28_aarch64.whl
ARG VAPOURSYNTH_WHEEL_SHA256=ab977973bf93e007778f383507ad6c2eae6526a90c2c18cdb41c11b33b794148
RUN printf '%s\n' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260623T000000Z bookworm main' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20260623T000000Z bookworm-security main' \
      > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/debian.sources \
  && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 update \
  && DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=5 install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && curl --fail --location --proto '=https' --tlsv1.2 "$VAPOURSYNTH_WHEEL_URL" -o /tmp/vapoursynth-77-cp312-abi3-manylinux_2_27_aarch64.manylinux_2_28_aarch64.whl \
  && echo "$VAPOURSYNTH_WHEEL_SHA256  /tmp/vapoursynth-77-cp312-abi3-manylinux_2_27_aarch64.manylinux_2_28_aarch64.whl" | sha256sum --check --strict \
  && python -m pip install --disable-pip-version-check --no-cache-dir --no-deps --target /opt/reeditpro-vapoursynth /tmp/vapoursynth-77-cp312-abi3-manylinux_2_27_aarch64.manylinux_2_28_aarch64.whl \
  && PYTHONPATH=/opt/reeditpro-vapoursynth python -c "import vapoursynth as vs; assert str(vs.__version__) == 'R77'; assert hasattr(vs.core, 'std'); assert hasattr(vs.core, 'resize')"

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS runtime
LABEL org.opencontainers.image.title="ReEditPro private offline VapourSynth frame pipeline execution" \
  org.opencontainers.image.base.digest="sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0" \
  com.reeditpro.runner.protocol="offline-vapoursynth-frame-pipeline-execution-container-v1" \
  com.reeditpro.runner.private-internal-only="true" \
  com.reeditpro.runner.product-ready="false" \
  com.reeditpro.runner.external-beta-ready="false" \
  com.reeditpro.runner.production-ready="false" \
  com.reeditpro.debian.snapshot="20260623T000000Z" \
  com.reeditpro.vapoursynth.version="77" \
  com.reeditpro.vapoursynth.wheel.architecture="manylinux_aarch64" \
  com.reeditpro.vapoursynth.wheel.sha256="ab977973bf93e007778f383507ad6c2eae6526a90c2c18cdb41c11b33b794148"
RUN groupadd --gid 10001 reeditpro \
  && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin reeditpro
COPY --from=build /opt/reeditpro-vapoursynth /opt/reeditpro-vapoursynth
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONHASHSEED=0 PYTHONNOUSERSITE=1 PYTHONPATH=/opt/reeditpro-vapoursynth
WORKDIR /app
COPY docker/prod/offline-vapoursynth-frame-pipeline-execution/runner.py /app/runner.py
RUN python -m py_compile /app/runner.py \
  && chmod 0444 /app/runner.py \
  && python -c "import vapoursynth as vs; assert str(vs.__version__) == 'R77'"
USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/runner.py"]
