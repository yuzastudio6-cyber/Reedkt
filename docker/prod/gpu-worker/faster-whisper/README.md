# Faster Whisper GPU operation source

This directory contains the bounded CUDA-only Faster Whisper operation source
for the one shared `gpu_ai_worker`. It is not a second worker, a production
deployment, or a production tool-registry promotion.

The runner accepts one closed JSON envelope on stdin. It obtains the approved
model files, one private WAV input, and its private output directory only from
fixed server-owned mount locations. Caller paths, URLs, bytes, commands,
settings, model aliases, runtime downloads, network fetches, and CPU fallback
are not accepted.

The envelope includes a SHA-256 binding over every other request field. The
runner recomputes it before reading mounts, caps each JSON output at 32 MiB and
all three outputs together at 64 MiB, and echoes only the request binding plus
digest-only output metadata.

The current existing ReeditPro regions are `us-east1` and `europe-west1`.
Cloud Run Jobs currently offers NVIDIA L4 in `europe-west1`, not `us-east1`,
so this contract admits only `europe-west1`. A US deployment requires a
separate canonical region-authority migration to an L4-capable US region; it
must not silently transfer private media across regions.

The pinned CUDA 12.3.2/cuDNN 9 base is a Linux/amd64 source expectation. A real
Cloud Run L4 build and execution must still prove CUDA minor-version
compatibility, CTranslate2 model loading, inference, private artifact writes,
QA, cost reconciliation, and cleanup before any production promotion.
