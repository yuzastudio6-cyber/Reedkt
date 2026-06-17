# AI Graphics Local Fixture Blocked Case Validation Policy

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_local_fixture_validation`

Future blocked case validation must reject unsafe requests represented in PR #458 blocked fixture templates and the 13-tool inventory. Blocked requests include:

- local fixture execution;
- route execution;
- actual tool execution;
- worker execution;
- provider/model runtime;
- browser runtime, WebGL runtime, or canvas runtime;
- resvg rasterization;
- Remotion render/export;
- Supabase mutation or SQL execution;
- GCS upload or storage transfer;
- signed URL creation;
- public artifact creation;
- raw prompt execution;
- internal beta, external beta, or production unlock.

Blocked cases may confirm that the request is identified and rejected. They must not execute a substitute path, create preview output, create media output, create route output, mutate storage, or hand off to workers.
