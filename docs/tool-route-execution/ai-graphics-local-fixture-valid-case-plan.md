# AI Graphics Local Fixture Valid Case Plan

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan`

Valid local fixture cases are planned as metadata-only records. A valid case must include:

- placeholder `planSnapshotId` from an approved plan snapshot;
- placeholder `scopedToolCallManifestId`;
- accepted AI graphics owner/capability id;
- metadata/manifest-only fixture family;
- private artifact manifest placeholder;
- checksum placeholder;
- QA, observability, cleanup, and worker handoff placeholders;
- blocked-use list that rejects runtime and artifact delivery requests.

The valid template `docs/tool-route-execution/fixtures/ai-graphics-metadata-local-fixture-valid-template.json` is docs-only and not executed. The later validation approval lane may decide whether to validate these templates; this packet only plans them.
