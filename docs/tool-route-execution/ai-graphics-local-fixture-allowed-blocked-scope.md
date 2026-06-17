# AI Graphics Local Fixture Allowed And Blocked Scope

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_plan`

## Allowed

- Plan metadata-only local fixture cases.
- Commit placeholder fixture templates.
- Add static diagnostics that inspect committed docs and templates only.
- Update present Tool Route/status trackers.

## Blocked

- local fixture execution;
- route execution;
- actual tool execution;
- worker execution;
- provider/model calls;
- browser/WebGL/canvas runtime;
- resvg rasterization;
- Remotion render/export;
- Supabase mutation, SQL, GCS upload, storage transfer;
- signed URL creation, public artifact creation;
- raw prompt execution;
- internal beta, external beta, production unlock.

Production capability enabled: `none; Tool Route AI graphics metadata local fixture planning only`.
