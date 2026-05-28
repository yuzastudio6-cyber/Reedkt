# Activation GCP Staging Secret Policy

Phase 22 creates secret placeholder names only. It does not create secret versions, payloads, values, provider keys, model tokens, or service-role key files.

Secret values are inserted manually later through approved operator workflows. Secret Manager access must be granted only to the service identity that needs the secret, and only after the matching deployment phase requires it.
