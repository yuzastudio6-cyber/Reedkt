FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    QWEN_CPU_CALLER_EXECUTION_ENABLED=false \
    QWEN_CPU_CALLER_TIMEOUT_SECONDS=20 \
    QWEN_PRIVATE_INVOKE_TARGET_URL= \
    QWEN_PRIVATE_INVOKE_AUDIENCE= \
    QWEN_MODEL_IMPORT_ON_STARTUP=false \
    QWEN_INFERENCE_ENABLED=false \
    RAW_VLM_PROMPT_ENABLED=false \
    PROVIDER_EXECUTION_ENABLED=false \
    MEDIA_PROCESSING_ENABLED=false \
    PUBLIC_OUTPUT_ENABLED=false \
    TRACK_A_EXECUTION_ENABLED=false

COPY server/workers/qwen2_5_vl_private_invoke_cpu_caller/ /app/server/workers/qwen2_5_vl_private_invoke_cpu_caller/

CMD ["python", "/app/server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py", "--print-status"]
