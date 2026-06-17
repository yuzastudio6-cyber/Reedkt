# AI Graphics Local Fixture Private Artifact Template

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan`

Future private artifact fixtures must use placeholders only:

- `privateArtifactManifestRef`: `<PRIVATE_ARTIFACT_MANIFEST_REF>`
- `privateGcsPathRef`: `<PRIVATE_GCS_PATH_PLACEHOLDER>`
- `supabaseRowRef`: `<SUPABASE_ROW_PLACEHOLDER>`
- `checksumRef`: `<CHECKSUM_PLACEHOLDER>`
- `provenanceRef`: `<PROVENANCE_PLACEHOLDER>`
- `qaRef`: `<QA_EVIDENCE_PLACEHOLDER>`
- `cleanupRef`: `<CLEANUP_EVIDENCE_PLACEHOLDER>`

Signed URLs are not source of truth. Public artifacts are blocked. This planning packet does not create private GCS paths, Supabase rows, storage transfers, signed URLs, or public artifacts.
