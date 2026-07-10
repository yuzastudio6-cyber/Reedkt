ARG QWEN_VISUAL_BASE_IMAGE
FROM ${QWEN_VISUAL_BASE_IMAGE}

WORKDIR /app
COPY server/workers/qwen_visual_runtime /app/server/workers/qwen_visual_runtime

ENV PYTHONUNBUFFERED=1 \
    PORT=8080 \
    QWEN_MODEL_CACHE_MOUNT=/models/qwen2.5-vl-7b-instruct \
    QWEN_REAL_FRAME_ANALYSIS_ENABLED=false \
    QWEN_INFERENCE_ENABLED=false

CMD ["python3", "-m", "server.workers.qwen_visual_runtime.service"]
