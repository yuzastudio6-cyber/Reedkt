# Controlled Tool Execution Worker Handoff Requirements

This phase does not approve worker execution. A later handoff must include an approved snapshot ref, idempotency key, correlation id, private artifact refs, checksums, cost/audit metadata, and explicit dry-run mode. Workers must reject raw prompts, provider responses, candidate snapshots, public artifacts, and signed URLs as source of truth.
