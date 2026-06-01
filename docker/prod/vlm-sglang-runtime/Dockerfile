FROM pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    HF_HUB_DISABLE_TELEMETRY=1 \
    MODEL_DOWNLOADS_ENABLED=false \
    RAW_VLM_PROMPT_ENABLED=false \
    PROVIDER_EXECUTION_ENABLED=false \
    MEDIA_PROCESSING_ENABLED=false \
    REAL_MEDIA_INPUT_ENABLED=false \
    ARBITRARY_MEDIA_INPUT_ENABLED=false \
    PUBLIC_OUTPUT_ENABLED=false \
    TRACK_A_EXECUTION_ENABLED=false

RUN apt-get update && \
    apt-get install -y --no-install-recommends libnuma1 && \
    rm -rf /var/lib/apt/lists/*

COPY docker/prod/vlm-sglang-runtime/requirements.sglang.txt /tmp/requirements.sglang.txt
RUN python -m pip install --no-cache-dir --upgrade pip && \
    python -m pip install --no-cache-dir -r /tmp/requirements.sglang.txt

COPY server/workers/vlm-sglang-runtime/ /app/server/workers/vlm-sglang-runtime/

ENTRYPOINT ["python", "/app/server/workers/vlm-sglang-runtime/run-phase39c-sglang-cloud-job.py"]
