# AI Graphics Worker Handoff Requirements

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_integration`

## Future Handoff Contract

Future Worker Runtime handoff may accept AI graphics metadata only after a later Tool Route integration QA packet confirms:

- approved plan snapshot placeholder exists;
- scoped tool-call manifest placeholder exists;
- metadata route id exists;
- owner proof reference exists;
- private artifact manifest placeholder exists;
- checksum placeholder exists;
- QA and observability placeholders exist;
- blocked-use list remains complete;
- route selection failed closed for unsafe requests.

## Worker Boundary

This packet approves future handoff planning only:

- `futureWorkerHandoffApproved: true`
- `workerExecutionApprovedNow: false`
- `jobClaimApprovedNow: false`
- `queueExecutionApprovedNow: false`
- `workerRuntimeImportApprovedNow: false`

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, Supabase mutation, GCS upload, signed URL creation, public artifact creation, beta unlock, or production unlock is approved.
