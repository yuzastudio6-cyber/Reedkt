# OCR Model Storage Policy

Approved future OCR model assets must use private staging generated-assets model-weight storage under:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/`

Planned subpaths are `pp-ocrv5/det/`, `pp-ocrv5/rec/`, and `pp-ocrv5/cls/`. Source-media buckets, public buckets, signed URLs as source of truth, and committed model files are forbidden. Phase 37B must record checksums after download before Phase 37C runtime verification.
