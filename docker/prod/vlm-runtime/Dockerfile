FROM vllm/vllm-openai:v0.11.0

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
    VLLM_WORKER_MULTIPROC_METHOD=spawn

RUN python3 -m pip install --no-cache-dir \
    google-cloud-storage==2.19.0 \
    Pillow==10.4.0 \
    qwen-vl-utils==0.0.11

COPY server/workers/vlm-runtime/ /app/server/workers/vlm-runtime/

ENTRYPOINT ["python3", "/app/server/workers/vlm-runtime/run-phase39c-cloud-job.py"]
