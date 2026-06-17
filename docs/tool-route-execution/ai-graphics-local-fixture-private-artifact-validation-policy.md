# AI Graphics Local Fixture Private Artifact Validation Policy

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation`

Future validation must treat private artifact refs and checksum placeholders as required metadata. Signed URLs and public artifacts are not source of truth.

Required artifact fields:

- `<PRIVATE_ARTIFACT_MANIFEST_REF>`;
- `<CHECKSUM_PLACEHOLDER>`;
- `<QA_EVIDENCE_PLACEHOLDER>`;
- `<OBSERVABILITY_EVIDENCE_PLACEHOLDER>`;
- `<CLEANUP_EVIDENCE_PLACEHOLDER>`;
- private artifact scope mapped to metadata/manifest-only output;
- no URL values, no signed URL values, no public artifact refs, no real user data, no secrets, and no provider raw output.

Artifact validation is static. It may confirm that placeholders exist and unsafe artifact delivery is blocked. It must not upload files, create storage objects, create signed URLs, create public artifacts, or write Supabase rows.
