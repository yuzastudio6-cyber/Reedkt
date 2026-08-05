# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS dependencies
WORKDIR /opt/reeditpro-python-runner
RUN apt-get update \
    && apt-get install -y --no-install-recommends libatomic1=12.2.0-14+deb12u1 \
    && rm -rf /var/lib/apt/lists/*
COPY docker/prod/offline-python-structured-execution/requirements.lock.txt ./requirements.lock.txt
COPY docker/prod/offline-python-structured-execution/requirements.scenedetect.lock.txt ./requirements.scenedetect.lock.txt
COPY docker/prod/offline-python-structured-execution/requirements.noisereduce.lock.txt ./requirements.noisereduce.lock.txt
COPY docker/prod/offline-python-structured-execution/requirements.pretty-midi.lock.txt ./requirements.pretty-midi.lock.txt
RUN python -m pip install \
      --require-hashes \
      --only-binary=:all: \
      --no-cache-dir \
      --no-compile \
      --prefix=/opt/runtime \
      -r requirements.lock.txt \
    && PYTHONPATH=/opt/runtime/lib/python3.13/site-packages python -m pip install \
      --require-hashes \
      --only-binary=:all: \
      --no-deps \
      --no-cache-dir \
      --no-compile \
      --prefix=/opt/runtime \
      -r requirements.scenedetect.lock.txt \
    && python -m pip install \
      --require-hashes \
      --only-binary=:all: \
      --no-deps \
      --no-cache-dir \
      --no-compile \
      --prefix=/opt/runtime \
      -r requirements.noisereduce.lock.txt \
    && PYTHONPATH=/opt/runtime/lib/python3.13/site-packages python -m pip install \
      --require-hashes \
      --no-deps \
      --no-build-isolation \
      --no-cache-dir \
      --no-compile \
      --prefix=/opt/runtime \
      -r requirements.pretty-midi.lock.txt \
    && for module in \
      audioread av cv2 duckdb librosa mido mir_eval noisereduce numpy \
      opentimelineio pedalboard polars pretty_midi pydub pyloudnorm resampy \
      scenedetect scipy; do \
        echo "Verifying pinned structured Python import: ${module}"; \
        PYTHONPATH=/opt/runtime/lib/python3.13/site-packages \
          python -c "import importlib; importlib.import_module('${module}')"; \
      done \
    && PYTHONPATH=/opt/runtime/lib/python3.13/site-packages python -c \
      "import importlib.metadata as m; expected = {'av': '18.0.0', 'duckdb': '1.5.4', 'librosa': '0.11.0', 'mido': '1.3.3', 'mir_eval': '0.8.2', 'noisereduce': '3.0.3', 'numpy': '2.4.6', 'opencv-python-headless': '5.0.0.93', 'opentimelineio': '0.18.1', 'pedalboard': '0.9.24', 'polars': '1.42.1', 'pretty_midi': '0.2.11', 'pydub': '0.25.1', 'pyloudnorm': '0.2.0', 'resampy': '0.4.3', 'scenedetect': '0.7', 'scipy': '1.18.0'}; actual = {name: m.version(name) for name in expected}; assert actual == expected, {'expected': expected, 'actual': actual}; print(actual)"

FROM python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0 AS runtime
LABEL org.opencontainers.image.title="ReeditPro private structured offline Python execution" \
      org.opencontainers.image.base.digest="sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0" \
      com.reeditpro.runner.protocol="offline-python-structured-execution-container-v1" \
      com.reeditpro.runner.private-internal-only="true" \
      com.reeditpro.runner.product-ready="false" \
      com.reeditpro.runner.external-beta-ready="false" \
      com.reeditpro.runner.production-ready="false"
ENV PYTHONPATH=/opt/runtime/lib/python3.13/site-packages \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=0 \
    NUMBA_CACHE_DIR=/tmp/numba-cache \
    NUMBA_NUM_THREADS=1 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends libatomic1=12.2.0-14+deb12u1 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=dependencies /opt/runtime /opt/runtime
COPY --chown=10001:10001 docker/prod/offline-python-structured-execution/runner.py /app/runner.py
RUN rm -rf \
      /usr/local/lib/python3.13/site-packages/pip \
      /usr/local/lib/python3.13/site-packages/pip-* \
      /usr/local/bin/pip \
      /usr/local/bin/pip3 \
      /usr/local/bin/pip3.13 \
    && python -m py_compile /app/runner.py \
    && find /app /opt/runtime -type d -name __pycache__ -prune -exec rm -rf '{}' +
USER 10001:10001
ENTRYPOINT ["python", "-s", "/app/runner.py"]
