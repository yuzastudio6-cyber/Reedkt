# Phase 44G Plan Snapshot Policy

Future sidecar work must require an approved plan snapshot before any execution can be considered. Required metadata includes the plan snapshot id, route manifest version, tool route entry id, tool id, approved capability id, input and output artifact scope ids, requester context, source phase, confirmation phase, runtime bounds, and audit report path.

Phase 44G blocks raw prompt execution, arbitrary commands, arbitrary file paths, arbitrary GCS prefixes, public URLs, signed URLs as source of truth, disabled route entries, Demucs, Qwen3-VL, vLLM, public output, broad media, arbitrary media, and provider calls.

Validation is fail-closed and metadata-only.
