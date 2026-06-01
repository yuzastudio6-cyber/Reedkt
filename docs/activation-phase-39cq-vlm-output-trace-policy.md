# Phase 39C-Q-SO Output Trace Policy

Full raw model outputs from generated synthetic fixtures may be uploaded only as private QA artifacts under:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-structured-output/<run-id>/`

Committed reports may include:

- candidate ID
- fixture ID
- strategy ID
- output SHA-256
- output byte count
- short safe excerpt
- parse/schema failure category
- private GCS artifact reference

Committed reports must not include large raw outputs, secrets, signed URLs, model payloads, runtime caches, provider logs, real media, or public artifact URLs.
