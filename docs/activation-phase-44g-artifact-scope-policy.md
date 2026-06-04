# Phase 44G Artifact Scope Policy

Approved scopes are private activation QA prefixes, private worker-temp prefixes, and ephemeral local temp scopes only. Committed reports may include hashes, counts, policy decisions, and redacted prefix metadata, but not payload bytes.

Blocked scopes include public artifacts, public URLs, signed URLs as source of truth, arbitrary user paths, arbitrary GCS prefixes, broad media buckets, committed media/audio/model payloads, and committed private payloads.

Future execution phases must emit a private artifact manifest and audit report, and must fail closed on cleanup or redaction failures.
