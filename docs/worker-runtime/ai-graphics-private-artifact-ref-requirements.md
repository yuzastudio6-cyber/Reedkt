# AI Graphics Private Artifact Ref Requirements

Decision: `worker_ai_graphics_metadata_handoff_approved_with_warnings`

Future Worker Runtime handoff planning must treat private artifact manifests as source-of-truth references. Signed URLs and public artifacts are not source of truth.

## Requirements

- Private artifact ref placeholder: `<PRIVATE_ARTIFACT_MANIFEST_REF>`.
- Checksum placeholder: `<CHECKSUM_REF>`.
- Required metadata: approved plan snapshot ref, scoped tool-call manifest ref, owner id, capability id, source PR evidence, no-execution proof, and blocked-use list.
- Disallowed metadata: signed URL, public artifact URL, raw prompt text, provider raw output, real user media, unscoped storage path, or executable instruction.
