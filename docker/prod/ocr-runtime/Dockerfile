FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_DOWNLOADS_ENABLED=false \
    REAL_MEDIA_INPUT_ENABLED=false \
    PROVIDER_EXECUTION_ENABLED=false \
    PADDLE_PDX_LOCAL_FONT_FILE_PATH=/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 libgl1 libglib2.0-0 fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

COPY docker/prod/ocr-runtime/requirements.ocr.txt /tmp/requirements.ocr.txt
COPY server/workers/ocr-runtime/requirements.ocr-transitive-macos-py312.txt /tmp/requirements.ocr-transitive-macos-py312.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && (pip install --no-cache-dir -r /tmp/requirements.ocr.txt \
      || (pip install --no-cache-dir --no-deps -r /tmp/requirements.ocr.txt \
        && pip install --no-cache-dir --no-deps paddlex==3.0.0 \
        && pip install --no-cache-dir -r /tmp/requirements.ocr-transitive-macos-py312.txt))

COPY server/workers/ocr-runtime /app/server/workers/ocr-runtime

ENTRYPOINT ["python", "/app/server/workers/ocr-runtime/run-generated-ocr-fixture.py"]
