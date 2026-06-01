# Phase 39C-Q-SO3 VLM Freeform Trace Policy

P1 freeform traces are diagnostic only. They help explain whether a candidate appears to perceive simple generated shapes, text, and UI regions, but they cannot count as a Phase 39C-Q-SO3 pass.

Full raw generated outputs stay private in the approved QA artifact prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-perception-canary/<run-id>/`

Committed reports may contain only safe trace hashes, short generated-output excerpts, parse categories, candidate IDs, fixture IDs, and private GCS references. They must not contain real media, provider logs, secrets, signed URLs, model payloads, or large raw traces.
