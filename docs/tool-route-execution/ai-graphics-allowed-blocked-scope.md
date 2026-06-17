# AI Graphics Metadata Integration Allowed And Blocked Scope

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_integration`

## Allowed Now

- Add Tool Route owner approval docs.
- Add static diagnostic for the approval packet.
- Update existing status trackers that already track Tool Route or production beta readiness.
- Preserve AI graphics owner evidence and Tool Route context as source evidence.
- Approve future metadata/scoped-manifest planning only:
  - `futureToolRouteMetadataIntegrationApproved: true`
  - `futureScopedToolCallManifestIntakeApproved: true`
  - `futureWorkerHandoffApproved: true`

## Blocked Now

- route execution;
- actual tool execution;
- worker execution;
- provider/model runtime;
- browser/WebGL/canvas runtime;
- resvg rasterization;
- Remotion render/export;
- dependency install or package-lock mutation;
- import smoke or synthetic fixture execution;
- Supabase mutation or SQL;
- GCS/storage transfer;
- signed URL creation;
- public artifact creation;
- raw prompt execution;
- internal beta, external beta, and production unlock.

Production capability enabled: `none; Tool Route AI graphics metadata integration approval only`.
