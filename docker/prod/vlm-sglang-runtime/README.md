# Phase 39C-SG SGLang Runtime Image

Dedicated staging-only image for the SGLang alternate runtime evaluation.

The image contains runtime dependencies and worker code only. It does not contain model weights, tokenizer payloads, generated fixtures, secrets, credentials, or production service code.

Cloud Run must run it as a Job on the approved staging L4 shape only.
