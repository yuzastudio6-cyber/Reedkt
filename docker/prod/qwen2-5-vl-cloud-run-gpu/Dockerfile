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
    TRACK_A_EXECUTION_ENABLED=false \
    QWEN_APPROVED_SNAPSHOT_REQUIRED=true \
    QWEN_QUEUE_LEASE_REQUIRED=true \
    QWEN_MODEL_IMPORT_ON_STARTUP=false \
    QWEN_INFERENCE_ENABLED=false \
    QWEN_MODEL_CACHE_MOUNT=/models/qwen2.5-vl-7b-instruct \
    QWEN_MODEL_REVISION=cc594898137f460bfe9f0759e9844b3ce807cfb5 \
    QWEN_MODEL_AGGREGATE_SHA256=46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b \
    PORT=8080

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential libnuma1 && \
    rm -rf /var/lib/apt/lists/*

COPY docker/prod/qwen2-5-vl-cloud-run-gpu/requirements.qwen2-5-vl.txt /tmp/requirements.qwen2-5-vl.txt
RUN python -m pip install --no-cache-dir --upgrade pip && \
    python -m pip install --no-cache-dir -r /tmp/requirements.qwen2-5-vl.txt

COPY server/workers/qwen2_5_vl_cloud_run_gpu/ /app/server/workers/qwen2_5_vl_cloud_run_gpu/

CMD ["python", "/app/server/workers/qwen2_5_vl_cloud_run_gpu/service.py"]
