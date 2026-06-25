# Monitoring And Rollback Dry-Run

The monitoring shape is sanitized and excludes raw prompts, raw chat, private payloads, signed URLs, public URLs, and storage object paths. It can record tool ID, routing class, dry-run flags, approved snapshot linkage, credit reservation linkage, QA gate count, fallback policy, and blocked-scope summary.

The rollback record shape keeps routes disabled, keeps workers disabled, and blocks direct product calls. No monitoring event was emitted to runtime and no rollback was applied to runtime in this metadata phase.
