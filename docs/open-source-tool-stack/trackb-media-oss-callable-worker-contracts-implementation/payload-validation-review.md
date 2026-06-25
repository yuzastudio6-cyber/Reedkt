# Payload Validation Review

Track B tool-call payload validation is fail-closed. Payloads must include approved snapshot, edit plan, idempotency, credit reservation, private artifact storage references, QA gates, fallback policy, and the sanitized result schema.

The validator rejects raw prompt/chat/provider prompt fields, public or signed URLs, missing gate linkage, and any attempt to set execution enabled before beta-readiness approval.
