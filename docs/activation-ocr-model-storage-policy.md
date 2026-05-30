# OCR Model Storage Policy

Approved future OCR model assets must use private staging generated-assets model-weight storage under:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/`

Phase 37B narrows the first safe-zone v1 prefix to:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/pp-ocrv5/paddle3.0.0-mobile-safe-zone-v1/`

Selected subpaths are `det/PP-OCRv5_mobile_det_infer.tar`, `rec/PP-OCRv5_mobile_rec_infer.tar`, and `dict/ppocrv5_dict.txt`. The textline orientation classifier is optional/deferred and must not be stored or auto-downloaded for safe-zone v1.

Source-media buckets, public buckets, signed URLs as source of truth, and committed model files are forbidden. Phase 37B must record checksums and private GCS upload verification before Phase 37C runtime verification.
