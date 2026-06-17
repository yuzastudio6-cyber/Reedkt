# AI_TOOLS_CREATIVE_GRAPHICS Route Allowed / Blocked Scope

Decision: `approved_with_warnings_for_ai_graphics_route_manifest_integration`

## Allowed

- AI graphics route eligibility metadata planning.
- Scoped tool-call manifest shape definition.
- Private artifact scope policy definition.
- Owner handoff contract documentation.
- Static diagnostics that inspect committed docs and package metadata only.
- Tracker/status doc update where present.

## Blocked

- dependency install
- package-lock mutation
- import smoke
- synthetic fixtures
- rasterization
- Remotion render/export
- browser runtime
- WebGL runtime
- canvas runtime
- actual tool execution
- route execution
- worker execution
- provider/model calls
- Supabase mutation
- SQL
- GCS upload/storage transfer
- signed URL creation
- public artifact creation
- raw prompt execution
- internal beta unlock
- external beta unlock
- production unlock
- broad service-role handler
