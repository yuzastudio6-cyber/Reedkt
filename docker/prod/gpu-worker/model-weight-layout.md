# GPU Model-Weight Layout

Milestone 11 creates or documents empty placeholder directories only. No model
files are committed, fetched, copied, baked into images, or treated as approved.

Expected future mount paths:

- `/opt/reeditpro/model-weights/rembg/`
- `/opt/reeditpro/model-weights/faster-whisper/`
- `/opt/reeditpro/model-weights/birefnet/`
- `/opt/reeditpro/model-weights/sam3_1/` (active successor candidate; gated official checkpoint only)
- `/opt/reeditpro/model-weights/deepfilternet/`
- `/opt/reeditpro/model-weights/demucs/`
- `/opt/reeditpro/model-weights/real-esrgan/`
- `/opt/reeditpro/model-weights/film/`
- `/opt/reeditpro/model-weights/paddleocr/`

Every path must be backed by a reviewed `ModelWeightManifest` before production
execution. Code/package license approval does not approve the model checkpoint.
SAM 2 has no active image mount or model-weight manifest. Immutable historical
SAM 2 evidence remains readable only through its original artifact records;
new plans, fallbacks, repairs, model loading, and dispatch must use the
separately admitted SAM 3.1 path.
